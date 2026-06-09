'use strict';

// "New Estimate" type chooser (legacy MAMENU.selectesttype + selectestret).
// Loads the departments and tariff state needed by the select-estimate page,
// and resolves which entry endpoint a chosen type routes to.

const departmentRepo = require('../db/repositories/departmentRepo');
const tariffRepo = require('../db/repositories/tariffRepo');

async function getSelectModel(user) {
  // Auto-transport companies (COLEVEL 3) skip the chooser and go straight to
  // the auto entry form.
  if (user.coLevel === 3) return { redirectAuto: true };

  const depts = await departmentRepo.getActive(user.custid, {
    viewall: user.viewall,
    group: user.group,
  });

  return {
    depts,
    plDEPT: depts.length > 1, // show the department dropdown only if there's a choice
    plDMAIN: await tariffRepo.hasActiveMain(user.custid),
    userName: (user.username || '').toUpperCase(),
  };
}

// Map a chosen estimate type to the entry-form URL (legacy selectestret).
function resolveEntry(type, dept) {
  const d = dept ? `dept=${encodeURIComponent(dept)}` : '';
  switch ((type || '').toUpperCase()) {
    case 'AUTO':
      return `/mpest/entryautowc?${d}`;
    case 'INT':
      return `/mpest/entrywc?module=INT&${d}`;
    case 'BROKER':
      return `/mpest/entrywc?module=BROKER&${d}`;
    default: // Local / Long Distance
      return `/mpest/entrywc?${d}`;
  }
}

module.exports = { getSelectModel, resolveEntry };
