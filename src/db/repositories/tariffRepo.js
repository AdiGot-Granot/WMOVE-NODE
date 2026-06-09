'use strict';

// Tariff data access (trf.DMAIN). Legacy selectesttype enables the
// "Booked Job from Broker (Skip Tariff)" option only when an active main
// tariff exists for the tenant.

const config = require('../../config');
const demo = require('../../../data/demo/fixtures');

async function hasActiveMain(custId) {
  if (config.isDemo) {
    return !!demo.tariffActive;
  }
  const { query, sql } = require('../pool');
  const rows = await query(
    `SELECT TOP 1 DMAINID FROM trf.DMAIN
      WHERE CUSTID=@custId AND ACTIVE=1 ORDER BY DMAINID DESC`,
    { custId: { type: sql.Int, value: Number(custId) } }
  );
  return rows.length > 0 && rows[0].DMAINID >= 1000;
}

module.exports = { hasActiveMain };
