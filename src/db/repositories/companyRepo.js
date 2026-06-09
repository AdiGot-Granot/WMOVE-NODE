'use strict';

// Company / tenant profile used in document headers (pcCOMPANY, pcADD1, ...).
// Legacy pulls these from the tenant's system/company configuration keyed by CUSTID.

const config = require('../../config');
const demo = require('../../../data/demo/fixtures');

async function getByCustId(custId) {
  if (config.isDemo) {
    return demo.companies.find((c) => c.CUSTID === Number(custId)) || demo.companies[0];
  }
  const { query, sql } = require('../pool');
  // NOTE: address/DOT/ICC fields live in the tenant profile table; confirm exact
  // source columns during MPEST migration. cst.SYSTEM.COMPANY holds the name.
  const rows = await query(
    `SELECT TOP 1 CUSTID, COMPANY AS NAME FROM cst.SYSTEM WHERE CUSTID = @custId`,
    { custId: { type: sql.SmallInt, value: Number(custId) } }
  );
  const r = rows[0] || {};
  return {
    CUSTID: Number(custId),
    NAME: r.NAME || '',
    ADD1: r.ADD1 || '',
    ADD2: r.ADD2 || '',
    TOLLFREE: r.TOLLFREE || '',
    DOT: r.DOT || '',
    ICC: r.ICC || '',
  };
}

// Tenant bootstrap by company code (legacy MPEST.indexwc):
//   SELECT CO.CUSTID,CO.CUSTNO,CO.COLEVEL,CO.VZTARIFF,CO.VZOTHERS,CO.ACTIVE,
//          S.CFRATIO,S.CALCCF
//   FROM cst.COMPANY CO JOIN cst.SYSTEM S ON CO.CUSTID=S.CUSTID
//   WHERE CO.CUSTNO = <custno>
async function getByCustNo(custNo) {
  if (config.isDemo) {
    const c = demo.companies.find(
      (x) => String(x.CUSTNO).toUpperCase() === String(custNo).toUpperCase()
    );
    return c || null;
  }
  const { query, sql } = require('../pool');
  const rows = await query(
    `SELECT TOP 1 CO.CUSTID, CO.CUSTNO, CO.COLEVEL, CO.VZTARIFF, CO.VZOTHERS,
            CO.ACTIVE, S.CFRATIO, S.CALCCF
       FROM cst.COMPANY CO JOIN cst.SYSTEM S ON CO.CUSTID = S.CUSTID
      WHERE CO.CUSTNO = @custNo`,
    { custNo: { type: sql.VarChar, value: String(custNo) } }
  );
  return rows[0] || null;
}

module.exports = { getByCustId, getByCustNo };
