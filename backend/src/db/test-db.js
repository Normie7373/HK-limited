const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:password@localhost:5432/postgres'
});

async function main() {
  try {
    await client.connect();
    console.log('Successfully connected to postgres database!');
    
    // Check if hkshipping database exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='hkshipping'");
    if (res.rows.length === 0) {
      console.log('hkshipping database does not exist. Creating it...');
      await client.query('CREATE DATABASE hkshipping');
      console.log('hkshipping database created successfully.');
    } else {
      console.log('hkshipping database already exists.');
    }
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await client.end();
  }
}

main();
