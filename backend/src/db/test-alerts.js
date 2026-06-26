const pool = require('./pool');

async function main() {
  try {
    console.log('Querying alerts...');
    const result = await pool.query(`
      SELECT a.*, t.name as transporter_name
      FROM alerts a
      JOIN transporters t ON a.transporter_id = t.id
      WHERE a.is_resolved = false
      ORDER BY a.created_at DESC
    `);
    console.log('Query completed successfully! Row count:', result.rows.length);
    console.log('Rows:', JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Error occurred during query execution:', err);
  }
}

main();
