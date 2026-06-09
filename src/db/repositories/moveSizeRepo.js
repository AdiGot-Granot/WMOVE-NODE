'use strict';

// Move-size options (cst.MOVESIZE). Legacy entrywc falls back to the CustId=1000
// template list when the tenant has none of its own.

const config = require('../../config');
const demo = require('../../../data/demo/fixtures');

async function getActive(custId) {
  if (config.isDemo) return demo.moveSizes;
  const { query, sql } = require('../pool');
  return query(
    `SELECT MOVESIZEID, ROOMDESC FROM cst.MOVESIZE
      WHERE CUSTID = @custId AND ACTIVE = 1
      ORDER BY MOVESIZEID`,
    { custId: { type: sql.Int, value: Number(custId) } }
  );
}

module.exports = { getActive };
