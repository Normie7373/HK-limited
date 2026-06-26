const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/dashboard/summary - Summary cards statistics
router.get('/summary', async (req, res, next) => {
  try {
    // 1. Total active partners
    const partnersQuery = 'SELECT COUNT(*)::int FROM transporters WHERE is_active = true';
    const partnersResult = await pool.query(partnersQuery);
    const totalPartners = partnersResult.rows[0].count;

    // 2. Average score across all records
    const avgQuery = 'SELECT ROUND(AVG(performance_score), 1)::float as avg_score FROM performance_ratings';
    const avgResult = await pool.query(avgQuery);
    const avgScore = avgResult.rows[0].avg_score || 0;
    
    // Total record count (for subtext in average score)
    const recordsQuery = 'SELECT COUNT(*)::int FROM performance_ratings';
    const recordsResult = await pool.query(recordsQuery);
    const totalRecords = recordsResult.rows[0].count;

    // 3. Top performer (active transporter with highest average score)
    const topQuery = `
      SELECT t.name, ROUND(AVG(r.performance_score), 1)::float as avg_score
      FROM performance_ratings r
      JOIN transporters t ON r.transporter_id = t.id
      WHERE t.is_active = true
      GROUP BY t.id, t.name
      ORDER BY avg_score DESC, t.name ASC
      LIMIT 1
    `;
    const topResult = await pool.query(topQuery);
    const topPerformer = topResult.rows.length > 0 
      ? { name: topResult.rows[0].name, score: topResult.rows[0].avg_score }
      : { name: 'N/A', score: 0 };

    // 4. Active alerts count
    const alertsQuery = 'SELECT COUNT(*)::int FROM alerts WHERE is_resolved = false';
    const alertsResult = await pool.query(alertsQuery);
    const activeAlerts = alertsResult.rows[0].count;

    res.status(200).json({
      success: true,
      data: {
        totalPartners,
        avgScore,
        totalRecords,
        topPerformer: topPerformer.name,
        topPerformerScore: topPerformer.score,
        activeAlerts
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/trend - Last 7 months score trend
router.get('/trend', async (req, res, next) => {
  try {
    const trendQuery = `
      SELECT rating_month, ROUND(AVG(performance_score), 1)::float as avg_score
      FROM performance_ratings
      GROUP BY rating_month
      ORDER BY rating_month DESC
      LIMIT 7
    `;
    const { rows } = await pool.query(trendQuery);
    
    // Map and reverse to output chronologically
    const trend = rows.map(r => ({
      month: r.rating_month,
      avgScore: r.avg_score
    })).reverse();
    
    res.status(200).json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/tier-distribution - Count by tier based on latest rating per transporter
router.get('/tier-distribution', async (req, res, next) => {
  try {
    const query = `
      SELECT tier, COUNT(*)::int as count
      FROM (
        SELECT DISTINCT ON (r.transporter_id) r.tier
        FROM performance_ratings r
        JOIN transporters t ON r.transporter_id = t.id
        WHERE t.is_active = true
        ORDER BY r.transporter_id, r.rating_month DESC
      ) latest_tiers
      GROUP BY tier
    `;
    const { rows } = await pool.query(query);
    
    const distribution = { EXCELLENT: 0, GOOD: 0, AVERAGE: 0, POOR: 0 };
    rows.forEach(r => {
      if (r.tier && r.tier in distribution) {
        distribution[r.tier] = r.count;
      }
    });
    
    // Format as array for Recharts donut
    const formattedData = Object.keys(distribution).map(tier => ({
      name: tier.charAt(0) + tier.slice(1).toLowerCase(), // e.g. "Excellent"
      value: distribution[tier]
    }));
    
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/leaderboard - Top 10 partners by avg performance
router.get('/leaderboard', async (req, res, next) => {
  try {
    const query = `
      SELECT 
        t.id,
        t.name as partner,
        COUNT(r.id)::int as records,
        ROUND(AVG(r.performance_score), 1)::float as avg_score,
        (SELECT tier FROM performance_ratings WHERE transporter_id = t.id ORDER BY rating_month DESC LIMIT 1) as tier
      FROM transporters t
      JOIN performance_ratings r ON r.transporter_id = t.id
      WHERE t.is_active = true
      GROUP BY t.id, t.name
      ORDER BY avg_score DESC, t.name ASC
      LIMIT 10
    `;
    const { rows } = await pool.query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
