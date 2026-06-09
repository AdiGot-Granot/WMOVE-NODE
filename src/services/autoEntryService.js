'use strict';

// Auto Transport entry form (legacy MPEST.entryautowc + entryauto.wc, PRGS-736/MPEST.PRG:235).
// Loads an existing estimate or creates a new transport-type (TYPE='T') one,
// plus the referral and department lookups, and builds the model the auto
// entry view binds to.

const estimateRepo = require('../db/repositories/estimateRepo');
const referralRepo = require('../db/repositories/referralRepo');
const departmentRepo = require('../db/repositories/departmentRepo');

const STATUS_NAME = { F: 'Follow-Up', O: 'Operation', C: 'Cancel', D: 'Closed' };

async function getAutoEntryForm(user, { dept = '', refno = '' } = {}) {
  let est;
  if (refno) {
    est = await estimateRepo.getEntryByRefno(refno);
    if (!est) return { notFound: true };
  } else {
    let deptId = user.deptId || 0;
    if (!deptId) {
      const main = await departmentRepo.getMain(user.custid);
      deptId = main ? main.DEPTID : 0;
    }
    est = await estimateRepo.createEntry({
      custId: user.custid,
      dept: dept || user.dept,
      deptId,
      type: 'T',
      user,
      broker: false,
    });
    if (est && est.disabled) return { writeDisabled: true };
  }

  // Departments: per legacy, only an auto-transport tenant (COLEVEL=3) shows
  // a picker when there are multiple active departments; non-3 levels just
  // resolve the main department silently.
  const coLevel = user.coLevel || 0;
  const depts = await departmentRepo.getActive(user.custid, {
    viewall: user.viewall,
    group: user.group,
  });
  const showDeptPicker = coLevel === 3 && depts.length > 1;

  const referrals = await referralRepo.getActive(user.custid, est.DEPTID);

  const ordno = String(est.ORDNO || '');
  const isBooked = /^\d+$/.test(ordno) && Number(ordno) > 99999;

  const bookDte = est.LBOOKDTE ? new Date(est.LBOOKDTE) : null;
  const bookDtePast = !!(bookDte && !isNaN(bookDte) && bookDte < new Date(new Date().toDateString()));

  return {
    est,
    title: 'Auto Transport Entry Form',
    referrals,
    depts,
    coLevel,
    showDeptPicker,
    statusName: STATUS_NAME[est.STATUS] || ' ',
    slevel: est.SLEVEL || '',
    rlevel: est.RLEVEL || '',
    isBooked,
    bookDtePast,
    level: typeof user.levelid === 'number' ? user.levelid : 0,
    flags: { blkSname: false, blkRefer: false },
    msg: '',
    scr: user._scr || 'SID',
    custNo: user.custno || '',
  };
}

module.exports = { getAutoEntryForm };
