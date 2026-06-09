'use strict';

// Authentication logic (legacy MPLOGIN / West Wind login equivalent).
//
// ⚠️ SECURITY NOTE — Phase 1 parity only:
// The legacy arn.USERS table stores passwords in PLAINTEXT (varchar(20)).
// We reproduce that comparison here to preserve exact login behavior during
// migration. Phase 2 MUST migrate to hashed passwords (e.g. bcrypt) with a
// transparent re-hash on next successful login. Do NOT log passwords.

const userRepo = require('../db/repositories/userRepo');

const companyRepo = require('../db/repositories/companyRepo');

// Resolve a tenant from a company code (legacy CUSTNO) or numeric custid.
// Mirrors NetLogonWc's tenant validation.
async function resolveTenant(company) {
  if (company == null || company === '') return { ok: true, custId: null };
  if (/^\d+$/.test(String(company))) return { ok: true, custId: Number(company) };
  const co = await companyRepo.getByCustNo(String(company));
  if (!co) return { ok: false, reason: 'unknown_company' };
  if (!co.ACTIVE) return { ok: false, reason: 'inactive_company' };
  return { ok: true, custId: co.CUSTID, company: co };
}

// Returns { ok, user } or { ok:false, reason }. `company` may be a CUSTNO code
// (e.g. 'DEMOPRO') or a numeric custid.
async function login(username, password, company) {
  if (!username || !password) return { ok: false, reason: 'missing_credentials' };

  const tenant = await resolveTenant(company);
  if (!tenant.ok) return { ok: false, reason: tenant.reason };
  const custId = tenant.custId;

  const u = await userRepo.findByUsername(username.trim(), custId);
  if (u && u._ambiguous) return { ok: false, reason: 'ambiguous_tenant' };
  if (!u) return { ok: false, reason: 'invalid' };

  // Legacy plaintext comparison (see security note above).
  if (String(u.password) !== String(password)) return { ok: false, reason: 'invalid' };

  const privs = await userRepo.getPrivCodes(u.userid);

  const user = {
    userid: u.userid,
    custid: u.custid,
    username: u.username,
    name: `${(u.firstname || '').trim()} ${(u.lastname || '').trim()}`.trim(),
    levelid: u.levelid,
    posid: u.posid,
    dept: u.dept,
    viewall: !!u.viewall,
    estimator: !!u.estimator,
    // tenant/company context for the main menu (COLEVEL drives the OMS product label)
    coLevel: tenant.company ? tenant.company.COLEVEL : null,
    custno: tenant.company ? tenant.company.CUSTNO : null,
    privs,
  };
  return { ok: true, user };
}

module.exports = { login, resolveTenant };
