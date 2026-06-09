'use strict';

// Main-menu badge counts (legacy MAMENU.mainmenuwc).
// Follow-ups: open estimates in follow-up status owned by the user.
// Job tasks: jobs with tasks needing attention, scoped by level.

const config = require('../../config');

async function getCounts(user) {
  if (config.isDemo) {
    return { followUps: 3, jobTasks: 5, userTasks: 2 };
  }
  const { query, sql } = require('../pool');
  const params = {
    custId: { type: sql.Int, value: Number(user.custid) },
    userId: { type: sql.Int, value: Number(user.userid) },
  };

  // Follow-up estimates owned by (or assigned to) the user.
  const fu = await query(
    `SELECT COUNT(*) AS cnt FROM job.EST
      WHERE CUSTID=@custId AND JOBSTATUS='F'
        AND (USERID=@userId AND (ESTIMID=0 OR ESTIMID IS NULL) OR ESTIMID=@userId)`,
    params
  );

  // Tasks assigned to the user on active jobs.
  const ut = await query(
    `SELECT COUNT(T.TUSERID) AS cnt
       FROM job.JOBTASK T JOIN cst.JOBS J ON J.JOBID=T.JOBID
      WHERE J.JOBSTATUS<>'C' AND J.JOBSTATUS<>'D' AND T.CONFIRM=0 AND T.TUSERID=@userId`,
    params
  );

  return {
    followUps: fu[0] ? fu[0].cnt : 0,
    jobTasks: 0, // level-scoped count; port full WHERE from MAMENU:~230 when needed
    userTasks: ut[0] ? ut[0].cnt : 0,
  };
}

module.exports = { getCounts };
