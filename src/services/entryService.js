'use strict';

// Estimate entry form (legacy MPEST.entrywc + entry.wc).
// Loads an existing estimate or creates a new one, plus the referral and
// move-size lookups, and builds the model the entry view binds to.

const estimateRepo = require('../db/repositories/estimateRepo');
const referralRepo = require('../db/repositories/referralRepo');
const moveSizeRepo = require('../db/repositories/moveSizeRepo');
const departmentRepo = require('../db/repositories/departmentRepo');

const RC_NAME = { R: 'Residential', C: 'Commercial', M: 'Military', O: 'Obstacle' };
const STATUS_NAME = { F: 'Follow-Up', O: 'Operation', C: 'Cancel', D: 'Closed', S: 'Storage' };

async function getEntryForm(user, { module = '', dept = '', refno = '' } = {}) {
  const type = module.toUpperCase() === 'INT' ? 'I' : ' ';
  const broker = module.toUpperCase() === 'BROKER';
  const intl = type === 'I';

  let est;
  if (refno) {
    est = await estimateRepo.getEntryByRefno(refno);
    if (!est) return { notFound: true };
  } else {
    // Resolve a valid DEPTID for the new estimate (legacy XX_GET_DEPTID).
    let deptId = user.deptId || 0;
    if (!deptId) {
      const main = await departmentRepo.getMain(user.custid);
      deptId = main ? main.DEPTID : 0;
    }
    est = await estimateRepo.createEntry({
      custId: user.custid,
      dept: dept || user.dept,
      deptId,
      type,
      user,
      broker,
    });
    if (est && est.disabled) return { writeDisabled: true };
  }

  const [referrals, moveSizes] = await Promise.all([
    referralRepo.getActive(user.custid, est.DEPTID),
    moveSizeRepo.getActive(user.custid),
  ]);

  const ordno = String(est.ORDNO || '');
  const isBooked = /^\d+$/.test(ordno) && Number(ordno) > 99999;

  return {
    est,
    title: intl ? 'International Entry Form' : 'Entry Form',
    intl,
    referrals,
    moveSizes,
    rcName: RC_NAME[est.RC] || 'Residential',
    statusName: STATUS_NAME[est.STATUS] || ' ',
    slevel: est.SLEVEL || '',
    rlevel: est.RLEVEL || '',
    isBooked,
    showMoveSize: !isBooked,
    level: typeof user.levelid === 'number' ? user.levelid : 0,
    flags: { blkSname: false, blkRefer: false },
    msg: '',
    scr: user._scr || 'SID',
    custNo: user.custno || '',
  };
}

module.exports = { getEntryForm };
