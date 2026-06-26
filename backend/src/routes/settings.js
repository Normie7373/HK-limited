const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Default fallback weights
const DEFAULT_WEIGHTS = {
  on_time: 0.40,
  billing: 0.25,
  feedback: 0.25,
  damage: 0.10
};

// GET /api/settings/scoring-weights - Get current weights (Accessible to all authenticated users)
router.get('/scoring-weights', authenticateJWT, async (req, res, next) => {
  try {
    const query = "SELECT value FROM system_settings WHERE key = 'scoring_weights'";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: DEFAULT_WEIGHTS });
    }

    res.status(200).json({ success: true, data: rows[0].value });
  } catch (error) {
    next(error);
  }
});

// POST /api/settings/scoring-weights - Update weights (Admin only)
router.post('/scoring-weights', authenticateJWT, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { on_time, billing, feedback, damage } = req.body;

    // Validate sum
    const sum = parseFloat(on_time) + parseFloat(billing) + parseFloat(feedback) + parseFloat(damage);
    if (Math.abs(sum - 1.0) > 0.001) {
      return res.status(400).json({ 
        success: false, 
        message: `Validation failed: Scoring weights must sum up to 100% (currently ${Math.round(sum * 100)}%)` 
      });
    }

    const weights = {
      on_time: parseFloat(on_time),
      billing: parseFloat(billing),
      feedback: parseFloat(feedback),
      damage: parseFloat(damage)
    };

    // Upsert key
    const upsertQuery = `
      INSERT INTO system_settings (key, value)
      VALUES ('scoring_weights', $1::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      RETURNING value
    `;
    const { rows } = await pool.query(upsertQuery, [JSON.stringify(weights)]);

    const { logAction } = require('../utils/logger');
    await logAction(req.user.id, req.user.username, 'SETTINGS_UPDATE', `Updated scoring weights to: On-Time ${on_time * 100}%, Billing ${billing * 100}%, Feedback ${feedback * 100}%, Damage ${damage * 100}%`);

    res.status(200).json({ 
      success: true, 
      message: 'Scoring weights updated successfully', 
      data: rows[0].value 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
