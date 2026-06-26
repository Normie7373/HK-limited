const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

// Enforce ADMIN role for all routes in this router
router.use(requireRole('ADMIN'));

// GET /api/admin/users - Get list of users
router.get('/users', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY username ASC');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/authorized-emails - Get list of authorized emails
router.get('/authorized-emails', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM authorized_emails ORDER BY created_at DESC');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/authorized-emails - Add authorized email
router.post('/authorized-emails', async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role are required' });
    }

    const validatedRole = role.toUpperCase();
    if (!['ADMIN', 'OPERATIONS', 'MANAGER'].includes(validatedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    // Check if email already whitelisted
    const checkQuery = 'SELECT id FROM authorized_emails WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already authorized' });
    }

    const insertQuery = `
      INSERT INTO authorized_emails (email, role)
      VALUES ($1, $2)
      RETURNING *
    `;
    const { rows } = await pool.query(insertQuery, [email, validatedRole]);
    
    // Log audit trail
    await logAction(req.user.id, req.user.username, 'EMAIL_AUTHORIZE', `Authorized email ${email} with role ${validatedRole}`);

    res.status(201).json({ success: true, message: 'Email authorized successfully', data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/authorized-emails/:id - Remove authorized email
router.delete('/authorized-emails/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get email details first for logging
    const getQuery = 'SELECT email FROM authorized_emails WHERE id = $1';
    const getResult = await pool.query(getQuery, [id]);
    if (getResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Authorized email record not found' });
    }
    const { email } = getResult.rows[0];

    const deleteQuery = 'DELETE FROM authorized_emails WHERE id = $1 RETURNING *';
    await pool.query(deleteQuery, [id]);

    // Log audit trail
    await logAction(req.user.id, req.user.username, 'EMAIL_DEAUTHORIZE', `Deauthorized email ${email}`);

    res.status(200).json({ success: true, message: 'Authorized email removed successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/logs - Get audit logs list
router.get('/logs', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
