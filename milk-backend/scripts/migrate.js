require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Semaya basariyla uygulandi.');
  } catch (err) {
    console.error('Migration hatasi:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
