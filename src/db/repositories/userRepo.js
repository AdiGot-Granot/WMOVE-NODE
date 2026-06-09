'use strict';

// User / authentication data access (arn.USERS, inf.USERSPRIV, inf.PRIVLGS).

const config = require('../../config');
const demo = require('../../../data/demo/fixtures');

// Find an active, non-deleted user by username (optionally scoped to a tenant).
async function findByUsername(username, custId) {
  if (config.isDemo) {
    return (
      demo.users.find(
        (u) =>
          u.username.toLowerCase() === String(username).toLowerCase() &&
          (custId == null || u.custid === Number(custId))
      ) || null
    );
  }
  const { query, sql } = require('../pool');
  const where = ['username = @username', 'active = 1', 'ISNULL(del,0) = 0'];
  const params = { username: { type: sql.VarChar, value: String(username) } };
  if (custId != null) {
    where.push('custid = @custid');
    params.custid = { type: sql.Int, value: Number(custId) };
  }
  const rows = await query(
    `SELECT TOP 2 userid, custid, username, password, firstname, lastname,
            levelid, posid, dept, deptid, viewall, estimator, email
       FROM arn.USERS WHERE ${where.join(' AND ')}`,
    params
  );
  // If username is ambiguous across tenants and no custid was given, signal it.
  if (rows.length > 1) return { _ambiguous: true };
  return rows[0] || null;
}

// Privilege codes granted to a user (active rows only).
async function getPrivCodes(userId) {
  if (config.isDemo) {
    const u = demo.users.find((x) => x.userid === Number(userId));
    return u ? u.privs || [] : [];
  }
  const { query, sql } = require('../pool');
  const rows = await query(
    `SELECT p.privcode
       FROM inf.USERSPRIV up
       JOIN inf.PRIVLGS p ON p.privid = up.privid
      WHERE up.userid = @userid AND ISNULL(up.active,0) = 1`,
    { userid: { type: sql.Int, value: Number(userId) } }
  );
  return rows.map((r) => r.privcode);
}

module.exports = { findByUsername, getPrivCodes };
