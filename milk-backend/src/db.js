const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Beklenmeyen veritabani hatasi:', err);
});

module.exports = pool;
