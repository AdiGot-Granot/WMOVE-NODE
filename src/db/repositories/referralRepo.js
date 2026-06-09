'use strict';

// Referral sources for the "How did you hear about us?" dropdown (cst.TREF).
// Legacy entrywc: SELECT RNAME FROM cst.TREF WHERE CustId=.. AND ACTIVE=1
//   AND (DEPTID=<dept> OR DEPTID=0 OR DEPTID IS NULL) ORDER BY RNAME

const config = require('../../config');
const demo = require('../../../data/demo/fixtures');

async function getActive(custId, deptId) {
  if (config.isDemo) return demo.referrals;
  const { query, sql } = require('../pool');
  return query(
    `SELECT R.RNAME
       FROM cst.TREF R
      WHERE R.CustId=@custId AND R.ACTIVE=1
        AND (R.DEPTID=@deptId OR R.DEPTID=0 OR R.DEPTID IS NULL)
      ORDER BY R.RNAME`,
    { custId: { type: sql.Int, value: Number(custId) }, deptId: { type: sql.Int, value: Number(deptId) || 0 } }
  );
}

module.exports = { getActive };
