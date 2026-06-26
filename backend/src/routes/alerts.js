const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/alerts - List alerts (defaults to unresolved, support include_resolved=true)
router.get('/', async (req, res, next) => {
  try {
    const { include_resolved } = req.query;
    
    let query = `
      SELECT a.*, t.name as transporter_name
      FROM alerts a
      JOIN transporters t ON a.transporter_id = t.id
    `;
    
    if (include_resolved !== 'true') {
      query += ' WHERE a.is_resolved = false';
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const { rows } = await pool.query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// PUT /api/alerts/resolve-all - Resolve all unresolved alerts
router.put('/resolve-all', async (req, res, next) => {
  try {
    const query = `
      UPDATE alerts
      SET is_resolved = true
      WHERE is_resolved = false
      RETURNING *
    `;
    const { rows } = await pool.query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// PUT /api/alerts/:id/resolve - Resolve a specific alert
router.put('/:id/resolve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
      UPDATE alerts
      SET is_resolved = true
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
