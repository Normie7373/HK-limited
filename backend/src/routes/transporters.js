const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { validateTransporter } = require('../middleware/validateRequest');
const { requireRole } = require('../middleware/auth');

// GET /api/transporters - List all transporters with latest score & tier
router.get('/', async (req, res, next) => {
  try {
    const query = `
      SELECT 
        t.id, 
        t.name, 
        t.contact_person, 
        t.phone, 
        t.email, 
        t.city, 
        t.is_active,
        t.status,
        t.created_at,
        (SELECT performance_score FROM performance_ratings WHERE transporter_id = t.id ORDER BY rating_month DESC LIMIT 1) as latest_score,
        (SELECT tier FROM performance_ratings WHERE transporter_id = t.id ORDER BY rating_month DESC LIMIT 1) as latest_tier,
        (SELECT COUNT(*)::int FROM performance_ratings WHERE transporter_id = t.id) as records_count
      FROM transporters t
      ORDER BY t.name ASC
    `;
    const { rows } = await pool.query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/transporters/:id - Single transporter + ratings
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const transporterQuery = 'SELECT * FROM transporters WHERE id = $1';
    const ratingsQuery = 'SELECT * FROM performance_ratings WHERE transporter_id = $1 ORDER BY rating_month DESC';
    
    const transporterResult = await pool.query(transporterQuery, [id]);
    if (transporterResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transporter not found' });
    }
    
    const ratingsResult = await pool.query(ratingsQuery, [id]);
    
    const transporter = transporterResult.rows[0];
    transporter.ratings = ratingsResult.rows;
    
    res.status(200).json({ success: true, data: transporter });
  } catch (error) {
    next(error);
  }
});

// POST /api/transporters - Create new transporter (Admin only)
router.post('/', requireRole('ADMIN'), validateTransporter, async (req, res, next) => {
  try {
    const { name, contact_person, phone, email, city } = req.body;
    
    // Check if name is unique
    const checkQuery = 'SELECT id FROM transporters WHERE name = $1';
    const checkResult = await pool.query(checkQuery, [name]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Transporter name already exists' });
    }
    
    const insertQuery = `
      INSERT INTO transporters (name, contact_person, phone, email, city)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await pool.query(insertQuery, [name, contact_person, phone, email, city]);
    const { logAction } = require('../utils/logger');
    await logAction(req.user.id, req.user.username, 'TRANSPORTER_CREATE', `Created transporter partner: ${name}`);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /api/transporters/:id - Update transporter details (Admin only)
router.put('/:id', requireRole('ADMIN'), validateTransporter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, city, is_active } = req.body;
    
    // Check if name exists for another transporter
    const checkQuery = 'SELECT id FROM transporters WHERE name = $1 AND id <> $2';
    const checkResult = await pool.query(checkQuery, [name, id]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Transporter name already exists' });
    }
    
    const updateQuery = `
      UPDATE transporters
      SET name = $1, contact_person = $2, phone = $3, email = $4, city = $5, is_active = COALESCE($6, is_active)
      WHERE id = $7
      RETURNING *
    `;
    const { rows } = await pool.query(updateQuery, [name, contact_person, phone, email, city, is_active, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transporter not found' });
    }
    
    const { logAction } = require('../utils/logger');
    await logAction(req.user.id, req.user.username, 'TRANSPORTER_UPDATE', `Updated transporter details for partner: ${name}`);

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/transporters/:id - Soft delete (set is_active = false) (Admin only)
router.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleteQuery = `
      UPDATE transporters
      SET is_active = false
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(deleteQuery, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transporter not found' });
    }
    
    const { logAction } = require('../utils/logger');
    await logAction(req.user.id, req.user.username, 'TRANSPORTER_DELETE', `Disabled transporter partner: ${rows[0].name}`);

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /api/transporters/:id/status - Approve/reject status (Manager only)
router.put('/:id/status', requireRole('MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const validatedStatus = status.toUpperCase();
    const is_active = validatedStatus === 'APPROVED';

    const updateQuery = `
      UPDATE transporters
      SET status = $1, is_active = $2
      WHERE id = $3
      RETURNING *
    `;
    const { rows } = await pool.query(updateQuery, [validatedStatus, is_active, id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transporter not found' });
    }

    const { logAction } = require('../utils/logger');
    await logAction(req.user.id, req.user.username, 'TRANSPORTER_STATUS_UPDATE', `Changed status of transporter partner: ${rows[0].name} to ${validatedStatus}`);

    res.status(200).json({ success: true, message: `Transporter status updated to ${validatedStatus}`, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
