'use strict';

// Inventory (job.INV) data access.
// Legacy merged cursors _T1/_T2/_T3 (room/auto/added items) into _T; here we
// fetch the live inventory rows for a job in one query (DEL = 0 excludes
// soft-deleted lines, matching the legacy filter).

const config = require('../../config');
const demo = require('../../../data/demo/fixtures');

async function getByJob(jobId) {
  if (config.isDemo) {
    return demo.inventory.filter((i) => i.JOBID === Number(jobId));
  }
  const { query, sql } = require('../pool');
  return query(
    `SELECT ITEM, QTY, BULKY, NEEDPACK, ROOMCODE
       FROM job.INV
      WHERE JOBID = @jobId AND ISNULL(DEL, 0) = 0
      ORDER BY INVROOMID, INVID`,
    { jobId: { type: sql.Int, value: Number(jobId) } }
  );
}

module.exports = { getByJob };
