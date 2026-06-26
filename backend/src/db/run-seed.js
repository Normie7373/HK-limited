const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    const sqlPath = path.join(__dirname, 'seed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running database seeding...');
    await client.query(sql);
    console.log('Database seeding completed successfully.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
