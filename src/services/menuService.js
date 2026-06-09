'use strict';

// Main-menu model (legacy MAMENU.mainmenuwc + mainmenu.wc). Produces the exact
// fields the faithful view needs: title, OMS product label, badge counts, and
// the level/permission flags that gate each menu item.
//
// pnLEVEL (user level 1-5) == USERS.levelid for normal users.
// pnCOLEVEL (company/product level) == cst.COMPANY.COLEVEL.
// Permission flags come from arn.vw_UsersPrm + cst.COMPANY; in demo mode we use
// sensible defaults. (DB-mode flag loading is a TODO — see MIGRATION_STATUS.md.)

const config = require('../db/repositories/companyRepo');
const menuRepo = require('../db/repositories/menuRepo');

function titleFor(level, coLevel) {
  if (coLevel > 5) {
    return { 1: 'Salesman Menu', 3: 'Dispatcher Menu', 4: 'Supervisor Menu', 5: 'Administrator Menu' }[level] || 'Menu';
  }
  return level === 2 ? 'Administrator Menu' : 'Salesman Menu';
}

function omsTitleFor(coLevel) {
  return { 1: 'OMS Basic', 2: 'OMS Jr.', 3: 'Auto Transport', 4: 'OMS Pro', 6: 'OMS Advanced', 7: 'OMS Supreme' }[coLevel] || '';
}

const paren = (n) => (n ? `(${n})` : '');

async function getMenu(user) {
  const counts = await menuRepo.getCounts(user);

  // Permission/company flags. Demo defaults approximate an active Pro tenant;
  // DB mode should load these from arn.vw_UsersPrm + cst.COMPANY.
  const coLevel = user.coLevel || 4;
  const flags = {
    hosting: false,
    blkCald: false,
    blkLod: false,
    coAgents: true,
    blkAgents: false,
    coStorage: true,
    storageMng: user.levelid === 5,
    assignNew: user.levelid === 2 || user.levelid > 3,
    blkFuopr: false,
    blkPerform: false,
    leadDist: false,
  };

  const properName = (user.name || user.username || '')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const now = new Date();
  const dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;

  return {
    repName: properName,
    userName: (user.username || '').toUpperCase(),
    deptUser: (user.dept || 'A').toUpperCase(),
    level: user.levelid,
    coLevel,
    title: titleFor(user.levelid, coLevel),
    omsTitle: omsTitleFor(coLevel),
    dow,
    dateStr,
    scr: user._scr || 'SID',
    custNo: user.custno || '',
    // badge strings (legacy pcFUCNT / pcTASKS / pcUSERTASK)
    fuCnt: paren(counts.followUps),
    tasks: paren(counts.jobTasks),
    userTask: paren(counts.userTasks),
    flags,
    copyright: `© 2000 - ${now.getFullYear()} Granot Inc. All rights reserved`,
  };
}

module.exports = { getMenu };
