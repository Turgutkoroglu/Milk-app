require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/db');

async function migrate() {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'migrations', '002_sabah_aksam_odeme.sql'),
    'utf8'
  );
  try {
    await pool.query(sql);
    console.log('Migration 002 basariyla uygulandi.');
  } catch (err) {
    console.error('Migration 002 hatasi:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
