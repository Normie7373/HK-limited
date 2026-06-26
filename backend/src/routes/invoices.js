const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

// GET /api/invoices - List invoices with filters and search
router.get('/', async (req, res, next) => {
  try {
    const { transporter_id, status, search } = req.query;

    let queryText = `
      SELECT i.*, t.name as transporter_name
      FROM invoices i
      JOIN transporters t ON i.transporter_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (transporter_id) {
      params.push(transporter_id);
      queryText += ` AND i.transporter_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      queryText += ` AND i.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND i.invoice_number ILIKE $${params.length}`;
    }

    queryText += ' ORDER BY i.created_at DESC';

    const { rows } = await pool.query(queryText, params);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/invoices - Create new invoice (Admin or Operations)
router.post('/', requireRole(['ADMIN', 'OPERATIONS']), async (req, res, next) => {
  try {
    const { invoice_number, transporter_id, amount, paid_amount, payment_date, status, dispute_reason } = req.body;

    if (!invoice_number || !transporter_id || amount === undefined || !status) {
      return res.status(400).json({ success: false, message: 'Invoice number, transporter, amount, and status are required' });
    }

    // Verify invoice number is unique
    const checkQuery = 'SELECT id FROM invoices WHERE invoice_number = $1';
    const checkResult = await pool.query(checkQuery, [invoice_number]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Invoice number already exists' });
    }

    const insertQuery = `
      INSERT INTO invoices (invoice_number, transporter_id, amount, paid_amount, payment_date, status, dispute_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const { rows } = await pool.query(insertQuery, [
      invoice_number,
      transporter_id,
      parseFloat(amount),
      parseFloat(paid_amount || 0),
      payment_date || null,
      status,
      status === 'DISPUTED' ? dispute_reason : null
    ]);

    // Fetch transporter name for logging
    const tResult = await pool.query('SELECT name FROM transporters WHERE id = $1', [transporter_id]);
    const tName = tResult.rows[0]?.name || 'Unknown';

    // Log action to audit logs
    await logAction(req.user.id, req.user.username, 'INVOICE_CREATE', `Created invoice ${invoice_number} for partner ${tName} with amount ${amount}`);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /api/invoices/:id - Update invoice (Admin or Operations)
router.put('/:id', requireRole(['ADMIN', 'OPERATIONS']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { invoice_number, transporter_id, amount, paid_amount, payment_date, status, dispute_reason } = req.body;

    // Check if invoice exists
    const checkQuery = 'SELECT * FROM invoices WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice record not found' });
    }
    const existing = checkResult.rows[0];

    // Check if invoice number is unique (if changed)
    if (invoice_number && invoice_number !== existing.invoice_number) {
      const uniqueResult = await pool.query('SELECT id FROM invoices WHERE invoice_number = $1 AND id <> $2', [invoice_number, id]);
      if (uniqueResult.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Invoice number already exists' });
      }
    }

    const updateQuery = `
      UPDATE invoices
      SET invoice_number = $1, transporter_id = $2, amount = $3, paid_amount = $4,
          payment_date = $5, status = $6, dispute_reason = $7
      WHERE id = $8
      RETURNING *
    `;
    const { rows } = await pool.query(updateQuery, [
      invoice_number || existing.invoice_number,
      transporter_id || existing.transporter_id,
      amount !== undefined ? parseFloat(amount) : existing.amount,
      paid_amount !== undefined ? parseFloat(paid_amount) : existing.paid_amount,
      payment_date !== undefined ? (payment_date || null) : existing.payment_date,
      status || existing.status,
      (status || existing.status) === 'DISPUTED' ? dispute_reason : null,
      id
    ]);

    // Fetch transporter name for logging
    const tResult = await pool.query('SELECT name FROM transporters WHERE id = $1', [rows[0].transporter_id]);
    const tName = tResult.rows[0]?.name || 'Unknown';

    // Log action to audit logs
    await logAction(req.user.id, req.user.username, 'INVOICE_UPDATE', `Updated invoice ${rows[0].invoice_number} details for partner ${tName} (status: ${rows[0].status})`);

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/invoices/:id - Delete invoice (Admin only)
router.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch invoice details first for logging
    const getQuery = 'SELECT invoice_number FROM invoices WHERE id = $1';
    const getResult = await pool.query(getQuery, [id]);
    if (getResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice record not found' });
    }
    const { invoice_number } = getResult.rows[0];

    const deleteQuery = 'DELETE FROM invoices WHERE id = $1 RETURNING *';
    await pool.query(deleteQuery, [id]);

    // Log action to audit logs
    await logAction(req.user.id, req.user.username, 'INVOICE_DELETE', `Deleted invoice ${invoice_number}`);

    res.status(200).json({ success: true, message: 'Invoice record deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
