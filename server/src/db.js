/*
 * Database connection.
 *
 * One pool for the whole process. Railway injects DATABASE_URL; running
 * locally, set it yourself. There is no fallback to a hardcoded string
 * on purpose — a server that silently connects to the wrong database is
 * worse than one that refuses to start.
 */

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. The server cannot start without it.');
  console.error('On Railway: add DATABASE_URL = ${{Postgres.DATABASE_URL}} to this service.');
  process.exit(1);
}

// Railway's managed Postgres presents a certificate that does not chain to a
// public root. Verification is therefore disabled for the hosted case only —
// the connection is still encrypted. A local database needs no TLS at all.
const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  // A pooled client dying in the background should be logged, not fatal.
  console.error('Unexpected database pool error:', err.message);
});

/** Run a query. Returns the pg result. */
async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run several statements inside one transaction.
 *
 * A session arrives as one submission but writes to four tables. Either
 * all of it lands or none of it does — a session row with no lessons
 * attached would look like a real entry and silently mean nothing.
 */
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, transaction };
