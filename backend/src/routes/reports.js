const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireRole } = require('../middleware/auth');

// Helper to get defaults for from/to if not specified
async function getMonthBounds() {
  const query = `
    SELECT 
      MIN(rating_month) as min_month, 
      MAX(rating_month) as max_month 
    FROM performance_ratings
  `;
  const { rows } = await pool.query(query);
  return {
    minMonth: rows[0].min_month || '2025-01',
    maxMonth: rows[0].max_month || '2026-12'
  };
}

// GET /api/reports/summary - Reports dashboard summary metrics and charts data
router.get('/summary', async (req, res, next) => {
  try {
    const { from, to, transporter_id } = req.query;
    
    // Fallbacks
    const bounds = await getMonthBounds();
    const fromMonth = from || bounds.minMonth;
    const toMonth = to || bounds.maxMonth;
    
    let whereClause = 'WHERE r.rating_month >= $1 AND r.rating_month <= $2';
    const params = [fromMonth, toMonth];
    
    if (transporter_id) {
      params.push(transporter_id);
      whereClause += ` AND r.transporter_id = $${params.length}`;
    }
    
    // 1. Partners count (distinct transporters rated in range)
    const partnersQuery = `
      SELECT COUNT(DISTINCT r.transporter_id)::int as count 
      FROM performance_ratings r
      JOIN transporters t ON r.transporter_id = t.id
      ${whereClause}
    `;
    const partnersResult = await pool.query(partnersQuery, params);
    const partnersCount = partnersResult.rows[0].count;
    
    // 2. Records count
    const recordsQuery = `
      SELECT COUNT(r.id)::int as count 
      FROM performance_ratings r
      JOIN transporters t ON r.transporter_id = t.id
      ${whereClause}
    `;
    const recordsResult = await pool.query(recordsQuery, params);
    const recordsCount = recordsResult.rows[0].count;
    
    // 3. Average Score
    const avgQuery = `
      SELECT ROUND(AVG(r.performance_score), 1)::float as avg_score 
      FROM performance_ratings r
      JOIN transporters t ON r.transporter_id = t.id
      ${whereClause}
    `;
    const avgResult = await pool.query(avgQuery, params);
    const avgScore = avgResult.rows[0].avg_score || 0;
    
    // 4. Alerts count (alerts created in range matching filters)
    let alertsWhereClause = 'WHERE a.rating_month >= $1 AND a.rating_month <= $2';
    const alertsParams = [fromMonth, toMonth];
    if (transporter_id) {
      alertsParams.push(transporter_id);
      alertsWhereClause += ` AND a.transporter_id = $${alertsParams.length}`;
    }
    const alertsQuery = `
      SELECT COUNT(a.id)::int as count 
      FROM alerts a
      JOIN transporters t ON a.transporter_id = t.id
      ${alertsWhereClause}
    `;
    const alertsResult = await pool.query(alertsQuery, alertsParams);
    const alertsCount = alertsResult.rows[0].count;
    
    // 5. Partner Comparison (horizontal bar chart: partner name & avg score)
    const comparisonQuery = `
      SELECT t.name as partner, ROUND(AVG(r.performance_score), 1)::float as avg_score
      FROM performance_ratings r
      JOIN transporters t ON r.transporter_id = t.id
      ${whereClause}
      GROUP BY t.id, t.name
      ORDER BY avg_score DESC, t.name ASC
    `;
    const comparisonResult = await pool.query(comparisonQuery, params);
    const partnerComparison = comparisonResult.rows.map(row => ({
      name: row.partner,
      score: row.avg_score
    }));
    
    // 6. Monthly Trend (line chart: month & avg score)
    const trendQuery = `
      SELECT r.rating_month as month, ROUND(AVG(r.performance_score), 1)::float as avg_score
      FROM performance_ratings r
      JOIN transporters t ON r.transporter_id = t.id
      ${whereClause}
      GROUP BY r.rating_month
      ORDER BY r.rating_month ASC
    `;
    const trendResult = await pool.query(trendQuery, params);
    const monthlyTrend = trendResult.rows.map(row => ({
      month: row.month,
      avgScore: row.avg_score
    }));
    
    res.status(200).json({
      success: true,
      data: {
        partners: partnersCount,
        records: recordsCount,
        avgScore,
        alerts: alertsCount,
        partnerComparison,
        monthlyTrend
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/export - Export CSV file of rating records matching filter range (Admin only)
router.get('/export', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { from, to, transporter_id } = req.query;
    
    const bounds = await getMonthBounds();
    const fromMonth = from || bounds.minMonth;
    const toMonth = to || bounds.maxMonth;
    
    let whereClause = 'WHERE r.rating_month >= $1 AND r.rating_month <= $2';
    const params = [fromMonth, toMonth];
    
    if (transporter_id) {
      params.push(transporter_id);
      whereClause += ` AND r.transporter_id = $${params.length}`;
    }
    
    const query = `
      SELECT 
        t.name as partner_name, 
        r.rating_month, 
        r.on_time_delivery_rate, 
        r.damage_incidents,
        r.billing_accuracy, 
        r.client_feedback_score, 
        r.performance_score, 
        r.tier
      FROM performance_ratings r
      JOIN transporters t ON r.transporter_id = t.id
      ${whereClause}
      ORDER BY r.rating_month DESC, t.name ASC
    `;
    
    const { rows } = await pool.query(query, params);
    
    // Construct CSV content
    const headers = ['Partner', 'Month', 'On-Time%', 'Damage', 'Billing%', 'Feedback', 'Score', 'Tier'];
    let csvContent = headers.join(',') + '\r\n';
    
    rows.forEach(row => {
      const line = [
        `"${row.partner_name.replace(/"/g, '""')}"`,
        `"${row.rating_month}"`,
        row.on_time_delivery_rate,
        row.damage_incidents,
        row.billing_accuracy,
        row.client_feedback_score,
        row.performance_score,
        `"${row.tier}"`
      ];
      csvContent += line.join(',') + '\r\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="performance_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
