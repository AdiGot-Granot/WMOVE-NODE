'use strict';

// Thin wrapper around the mssql connection pool.
// In demo mode the pool is never created — repositories serve fixtures instead.

const sql = require('mssql');
const config = require('../config');
const log = require('../lib/logger');

let poolPromise = null;

function getPool() {
  if (config.isDemo) {
    throw new Error('getPool() called in demo mode — repositories should use fixtures.');
  }
  if (!poolPromise) {
    poolPromise = sql
      .connect({
        server: config.db.server,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
        options: config.db.options,
        pool: config.db.pool,
      })
      .then((pool) => {
        log.info({ server: config.db.server, database: config.db.database }, 'SQL Server pool connected');
        return pool;
      })
      .catch((err) => {
        poolPromise = null; // allow retry on next call
        log.error({ err }, 'SQL Server connection failed');
        throw err;
      });
  }
  return poolPromise;
}

// Run a parameterized query.
//   params: { name: value } or { name: { type, value } }
async function query(text, params = {}) {
  const pool = await getPool();
  const req = pool.request();
  for (const [name, val] of Object.entries(params)) {
    if (val && typeof val === 'object' && 'type' in val) {
      req.input(name, val.type, val.value);
    } else {
      req.input(name, val);
    }
  }
  const result = await req.query(text);
  return result.recordset;
}

// Execute a stored procedure (Phase 1 reuses the existing GMOVE sprocs).
async function execProc(name, params = {}) {
  const pool = await getPool();
  const req = pool.request();
  for (const [pname, val] of Object.entries(params)) {
    if (val && typeof val === 'object' && 'type' in val) {
      req.input(pname, val.type, val.value);
    } else {
      req.input(pname, val);
    }
  }
  const result = await req.execute(name);
  return result.recordset;
}

module.exports = { sql, getPool, query, execProc };
