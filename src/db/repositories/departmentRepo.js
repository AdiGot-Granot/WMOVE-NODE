'use strict';

// Department data access (cst.DEPARTMENT). Legacy MPEST.indexwc:
//   SELECT DEPT,DEPTID,GRP,DEPTNAME FROM cst.DEPARTMENT
//   WHERE CUSTID=<id> AND ACTIVE=1 AND DEPTMAIN=1

const config = require('../../config');
const demo = require('../../../data/demo/fixtures');

async function getMain(custId) {
  if (config.isDemo) {
    return demo.departments.find((d) => d.CUSTID === Number(custId)) || null;
  }
  const { query, sql } = require('../pool');
  const rows = await query(
    `SELECT TOP 1 DEPT, DEPTID, GRP, DEPTNAME
       FROM cst.DEPARTMENT
      WHERE CUSTID = @custId AND ACTIVE = 1 AND DEPTMAIN = 1`,
    { custId: { type: sql.Int, value: Number(custId) } }
  );
  return rows[0] || null;
}

// Active departments for a tenant (legacy cst.vw_Department), optionally
// restricted to the user's group when they don't have view-all.
async function getActive(custId, { viewall = true, group = null } = {}) {
  let rows;
  if (config.isDemo) {
    rows = demo.departments.filter((d) => d.CUSTID === Number(custId));
  } else {
    const { query, sql } = require('../pool');
    rows = await query(
      `SELECT DEPTID, DEPT, DEPTNAME, GRP
         FROM cst.DEPARTMENT
        WHERE CUSTID=@custId AND ACTIVE=1 AND ISNULL(DEL,0)=0
        ORDER BY DEPT`,
      { custId: { type: sql.Int, value: Number(custId) } }
    );
  }
  if (!viewall && group != null) rows = rows.filter((d) => d.GRP === group);
  return rows;
}

module.exports = { getMain, getActive };
