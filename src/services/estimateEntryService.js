'use strict';

// Business logic for MPEST.indexwc — the customer entry/bootstrap step.
// Ported from PRGS-736/MPEST.PRG:32. Returns an outcome the controller acts on:
//   { ok:true, context, redirectTo }   — proceed (controller stores session + redirects)
//   { ok:false, error }                — show the legacy-equivalent error message
//   { ok:false, blocked:true }         — restricted IP (legacy showed util/restip page)

const companyRepo = require('../db/repositories/companyRepo');
const departmentRepo = require('../db/repositories/departmentRepo');
const restIpRepo = require('../db/repositories/restIpRepo');

async function bootstrap({ custNo, dept, entry, ip }) {
  custNo = (custNo || '').trim().toUpperCase();
  dept = (dept || '').trim().toUpperCase();
  entry = (entry || '').trim().toUpperCase();

  // 1. Resolve tenant + active check (cst.COMPANY JOIN cst.SYSTEM).
  const company = await companyRepo.getByCustNo(custNo);
  if (!company) return { ok: false, error: `Sorry no estimate file on this server ${custNo}` };
  if (!company.ACTIVE) return { ok: false, error: 'Sorry not active customer!' };

  // 2. Resolve main department if none supplied (cst.DEPARTMENT, DEPTMAIN=1).
  let group = 1;
  let deptId = 0;
  if (!dept) {
    const d = await departmentRepo.getMain(company.CUSTID);
    if (d) {
      dept = (d.DEPT || '').trim();
      deptId = d.DEPTID;
      group = d.GRP || 1;
    }
  }
  if (!dept) dept = 'W'; // legacy fallback

  // 3. IP restriction (cst.RESTIP).
  if (await restIpRepo.isBlocked(company.CUSTID, ip)) return { ok: false, blocked: true };

  // 4. Session context (replaces the legacy COOKIE record set by XNEWCOOKIE).
  const context = {
    custNo,
    custId: company.CUSTID,
    dept,
    deptId,
    group,
    coLevel: company.COLEVEL,
    cfRatio: company.CFRATIO,
    calcCf: !!company.CALCCF,
    dTariff: !!company.VZTARIFF,
    others: !!company.VZOTHERS,
  };

  // 5. Decide the redirect target (legacy DO CASE on pcENTRY).
  let redirectTo;
  switch (entry) {
    case 'INT':
      redirectTo = `/mpest/entrywc?mode=INT&dept=${encodeURIComponent(dept)}`;
      break;
    case 'ENTRYRET':
      redirectTo = `/mpest/entryret`;
      break;
    case 'ENTRY':
    default:
      redirectTo = `/mpest/entrywc?dept=${encodeURIComponent(dept)}`;
      break;
  }

  return { ok: true, context, redirectTo };
}

module.exports = { bootstrap };
