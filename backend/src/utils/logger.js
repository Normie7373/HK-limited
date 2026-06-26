const pool = require('../db/pool');

async function logAction(userId, username, actionType, details) {
  try {
    const query = `
      INSERT INTO audit_logs (user_id, username, action_type, details)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(query, [userId, username, actionType, details]);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

module.exports = { logAction };
