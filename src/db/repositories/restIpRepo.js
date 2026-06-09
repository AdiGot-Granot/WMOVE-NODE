'use strict';

// IP restriction data access (cst.RESTIP). Legacy MPEST.indexwc blocks a visitor
// when their IP matches a full address, or a /24 prefix flagged with BLKIPSEQ.

const config = require('../../config');
const demo = require('../../../data/demo/fixtures');

function prefix24(ip) {
  const p = String(ip).split('.');
  return p.length >= 3 ? p.slice(0, 3).join('.') : String(ip);
}

async function isBlocked(custId, ip) {
  if (!ip) return false;
  let rows;
  if (config.isDemo) {
    rows = demo.restIp.filter((r) => r.CUSTID === Number(custId));
  } else {
    const { query, sql } = require('../pool');
    rows = await query(
      `SELECT IP, BLKIPSEQ FROM cst.RESTIP
        WHERE CUSTID = @custId AND ACTIVE = 1 AND USERID = 0`,
      { custId: { type: sql.Int, value: Number(custId) } }
    );
  }
  for (const r of rows) {
    const rip = String(r.IP).trim();
    if (rip === ip) return true; // exact match
    if (r.BLKIPSEQ && prefix24(rip) === prefix24(ip)) return true; // /24 block
  }
  return false;
}

module.exports = { isBlocked };
