const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { validateRating } = require('../middleware/validateRequest');
const { requireRole } = require('../middleware/auth');

// Mathematical formulas for score calculation
function calculatePerformanceScore(onTimeRate, damageIncidents, billingAccuracy, clientFeedback, weights = { on_time: 0.40, billing: 0.25, feedback: 0.25, damage: 0.10 }) {
  const onTimeScore = parseFloat(onTimeRate) * weights.on_time;
  const billingScore = parseFloat(billingAccuracy) * weights.billing;
  const feedbackScore = (parseFloat(clientFeedback) / 10) * 100 * weights.feedback;
  
  const damagePenalty = Math.min(parseInt(damageIncidents) * 2, 10);
  const damageScore = (1 - damagePenalty / 100) * 100 * weights.damage;
  
  const total = onTimeScore + billingScore + feedbackScore + damageScore;
  return Math.round(total * 10) / 10;
}

function getTier(score) {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 60) return 'AVERAGE';
  return 'POOR';
}

// Helper function to auto-generate alerts
async function autoGenerateAlerts(client, transporterId, ratingMonth, onTimeRate, damageIncidents, performanceScore, clientFeedbackScore) {
  const parsedDamage = parseInt(damageIncidents);
  const parsedScore = parseFloat(performanceScore);
  const parsedOnTime = parseFloat(onTimeRate);
  const parsedFeedback = parseFloat(clientFeedbackScore);

  const alertsToInsert = [];

  // Rule 1: High damage
  if (parsedDamage >= 5) {
    alertsToInsert.push({
      type: 'HIGH_DAMAGE',
      severity: 'MEDIUM',
      message: `High damage in ${ratingMonth}: ${parsedDamage} incidents`
    });
  }

  // Rule 2: Poor score
  if (parsedScore < 60) {
    alertsToInsert.push({
      type: 'POOR_PERFORMANCE',
      severity: 'HIGH',
      message: `Performance score critically low: ${parsedScore}/100`
    });
  }

  // Rule 3: Low on-time rate
  if (parsedOnTime < 70) {
    alertsToInsert.push({
      type: 'LOW_ON_TIME',
      severity: 'HIGH',
      message: `On-time delivery rate below threshold: ${parsedOnTime}%`
    });
  }

  // Rule 4: Poor client feedback
  if (parsedFeedback < 5) {
    alertsToInsert.push({
      type: 'LOW_FEEDBACK',
      severity: 'MEDIUM',
      message: `Client feedback score low: ${parsedFeedback}/10`
    });
  }

  for (const alert of alertsToInsert) {
    const insertQuery = `
      INSERT INTO alerts (transporter_id, alert_type, severity, message, rating_month, is_resolved)
      VALUES ($1, $2, $3, $4, $5, false)
    `;
    await client.query(insertQuery, [transporterId, alert.type, alert.severity, alert.message, ratingMonth]);
  }
}

// GET /api/ratings - List ratings with filters, search, and pagination
router.get('/', async (req, res, next) => {
  try {
    const { transporter_id, month, tier, search, page, limit } = req.query;
    
    let baseQuery = `
      FROM performance_ratings r
      JOIN transporters t ON r.transporter_id = t.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (transporter_id) {
      params.push(transporter_id);
      baseQuery += ` AND r.transporter_id = $${params.length}`;
    }
    
    if (month) {
      params.push(month);
      baseQuery += ` AND r.rating_month = $${params.length}`;
    }
    
    if (tier) {
      params.push(tier);
      baseQuery += ` AND r.tier = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      baseQuery += ` AND (t.name ILIKE $${params.length} OR r.notes ILIKE $${params.length})`;
    }
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*)::int ${baseQuery}`;
    const countResult = await pool.query(countQuery, params);
    const totalRecords = countResult.rows[0].count;
    
    let selectQuery = `
      SELECT r.*, t.name as transporter_name
      ${baseQuery}
      ORDER BY r.rating_month DESC, t.name ASC
    `;
    
    // Apply pagination if specified
    if (page && limit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const offset = (pageNum - 1) * limitNum;
      
      params.push(limitNum);
      selectQuery += ` LIMIT $${params.length}`;
      
      params.push(offset);
      selectQuery += ` OFFSET $${params.length}`;
    }
    
    const { rows } = await pool.query(selectQuery, params);
    
    res.status(200).json({
      success: true,
      data: rows,
      pagination: page && limit ? {
        total: totalRecords,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalRecords / parseInt(limit))
      } : null
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ratings/:id - Single rating record
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT r.*, t.name as transporter_name
      FROM performance_ratings r
      JOIN transporters t ON r.transporter_id = t.id
      WHERE r.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Rating record not found' });
    }
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// POST /api/ratings - Create performance rating (Operations or Admin)
router.post('/', requireRole(['ADMIN', 'OPERATIONS']), validateRating, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      transporter_id,
      rating_month,
      on_time_delivery_rate,
      damage_incidents,
      billing_accuracy,
      client_feedback_score,
      notes
    } = req.body;
    
    // Check if rating for this partner and month already exists
    const checkQuery = `
      SELECT id FROM performance_ratings 
      WHERE transporter_id = $1 AND rating_month = $2
    `;
    const checkResult = await client.query(checkQuery, [transporter_id, rating_month]);
    if (checkResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `A rating record already exists for this partner in ${rating_month}`
      });
    }
    
    // Verify transporter is active
    const transporterCheck = await client.query('SELECT is_active FROM transporters WHERE id = $1', [transporter_id]);
    if (transporterCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Transporter not found' });
    }
    if (!transporterCheck.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Transporter is inactive and cannot receive ratings' });
    }
    
    // Fetch dynamic scoring weights
    const weightsResult = await client.query("SELECT value FROM system_settings WHERE key = 'scoring_weights'");
    const weights = weightsResult.rows.length > 0 ? weightsResult.rows[0].value : {
      on_time: 0.40,
      billing: 0.25,
      feedback: 0.25,
      damage: 0.10
    };

    const performance_score = calculatePerformanceScore(
      on_time_delivery_rate,
      damage_incidents,
      billing_accuracy,
      client_feedback_score,
      weights
    );
    const tier = getTier(performance_score);
    
    const insertQuery = `
      INSERT INTO performance_ratings (
        transporter_id, rating_month, on_time_delivery_rate, 
        damage_incidents, billing_accuracy, client_feedback_score, 
        performance_score, tier, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const ratingResult = await client.query(insertQuery, [
      transporter_id,
      rating_month,
      on_time_delivery_rate,
      damage_incidents,
      billing_accuracy,
      client_feedback_score,
      performance_score,
      tier,
      notes
    ]);
    
    // Run alert auto-generation
    await autoGenerateAlerts(
      client,
      transporter_id,
      rating_month,
      on_time_delivery_rate,
      damage_incidents,
      performance_score,
      client_feedback_score
    );
    
    // Log action to audit logs
    const partnerNameResult = await client.query('SELECT name FROM transporters WHERE id = $1', [transporter_id]);
    const partnerName = partnerNameResult.rows[0]?.name || 'Unknown';
    const { logAction } = require('../utils/logger');
    await logAction(req.user.id, req.user.username, 'RATING_CREATE', `Logged performance rating for partner ${partnerName} for month ${rating_month} with score ${performance_score}`);

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: ratingResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// PUT /api/ratings/:id - Update rating (Operations or Admin)
router.put('/:id', requireRole(['ADMIN', 'OPERATIONS']), validateRating, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      transporter_id,
      rating_month,
      on_time_delivery_rate,
      damage_incidents,
      billing_accuracy,
      client_feedback_score,
      notes
    } = req.body;
    
    // Check if rating exists
    const checkQuery = 'SELECT * FROM performance_ratings WHERE id = $1';
    const checkResult = await client.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Rating record not found' });
    }
    
    // Check if updating causes duplicate transporter+month constraint issue
    const duplicateQuery = `
      SELECT id FROM performance_ratings 
      WHERE transporter_id = $1 AND rating_month = $2 AND id <> $3
    `;
    const duplicateResult = await client.query(duplicateQuery, [transporter_id, rating_month, id]);
    if (duplicateResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `A rating record already exists for this partner in ${rating_month}`
      });
    }
    
    // Fetch dynamic scoring weights
    const weightsResult = await client.query("SELECT value FROM system_settings WHERE key = 'scoring_weights'");
    const weights = weightsResult.rows.length > 0 ? weightsResult.rows[0].value : {
      on_time: 0.40,
      billing: 0.25,
      feedback: 0.25,
      damage: 0.10
    };

    const performance_score = calculatePerformanceScore(
      on_time_delivery_rate,
      damage_incidents,
      billing_accuracy,
      client_feedback_score,
      weights
    );
    const tier = getTier(performance_score);
    
    const updateQuery = `
      UPDATE performance_ratings
      SET transporter_id = $1, rating_month = $2, on_time_delivery_rate = $3,
          damage_incidents = $4, billing_accuracy = $5, client_feedback_score = $6,
          performance_score = $7, tier = $8, notes = $9
      WHERE id = $10
      RETURNING *
    `;
    const ratingResult = await client.query(updateQuery, [
      transporter_id,
      rating_month,
      on_time_delivery_rate,
      damage_incidents,
      billing_accuracy,
      client_feedback_score,
      performance_score,
      tier,
      notes,
      id
    ]);
    
    // Remove old unresolved alerts for this transporter and month
    const deleteAlertsQuery = `
      DELETE FROM alerts 
      WHERE transporter_id = $1 AND rating_month = $2 AND is_resolved = false
    `;
    await client.query(deleteAlertsQuery, [transporter_id, rating_month]);
    
    // Generate new alerts based on updated stats
    await autoGenerateAlerts(
      client,
      transporter_id,
      rating_month,
      on_time_delivery_rate,
      damage_incidents,
      performance_score,
      client_feedback_score
    );
    
    // Log action to audit logs
    const partnerNameResult = await client.query('SELECT name FROM transporters WHERE id = $1', [transporter_id]);
    const partnerName = partnerNameResult.rows[0]?.name || 'Unknown';
    const { logAction } = require('../utils/logger');
    await logAction(req.user.id, req.user.username, 'RATING_UPDATE', `Updated rating record for partner ${partnerName} for month ${rating_month} to score ${performance_score}`);

    await client.query('COMMIT');
    res.status(200).json({ success: true, data: ratingResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// DELETE /api/ratings/:id - Delete rating (Operations or Admin)
router.delete('/:id', requireRole(['ADMIN', 'OPERATIONS']), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Get details first to delete corresponding unresolved alerts
    const getQuery = 'SELECT transporter_id, rating_month FROM performance_ratings WHERE id = $1';
    const getResult = await client.query(getQuery, [id]);
    if (getResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Rating record not found' });
    }
    
    const { transporter_id, rating_month } = getResult.rows[0];
    
    // Delete rating
    const deleteQuery = 'DELETE FROM performance_ratings WHERE id = $1 RETURNING *';
    const ratingResult = await client.query(deleteQuery, [id]);
    
    // Delete corresponding unresolved alerts
    const deleteAlertsQuery = `
      DELETE FROM alerts 
      WHERE transporter_id = $1 AND rating_month = $2 AND is_resolved = false
    `;
    await client.query(deleteAlertsQuery, [transporter_id, rating_month]);
    
    // Log action to audit logs
    const partnerNameResult = await client.query('SELECT name FROM transporters WHERE id = $1', [transporter_id]);
    const partnerName = partnerNameResult.rows[0]?.name || 'Unknown';
    const { logAction } = require('../utils/logger');
    await logAction(req.user.id, req.user.username, 'RATING_DELETE', `Deleted performance rating for partner ${partnerName} for month ${rating_month}`);

    await client.query('COMMIT');
    res.status(200).json({ success: true, data: ratingResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
