'use strict';

// Tenant entry flow imported from the legacy admin.htm / admin.js + MP.hellonet /
// MP.NetLogonWc chain.
//
// Legacy: users open  https://host/<CUSTNO>/admin.htm
//   admin.js extracts <CUSTNO> from the path and loads /wc.dll?mp~hellonet~<CUSTNO>
//   hellonet -> NetLogonWc validates the tenant and shows the staff login.
//
// Here: /<custno>/admin.htm resolves the company code and redirects to the
// tenant-scoped login (/mplogin?co=<CUSTNO>).

const authService = require('../services/authService');

async function adminEntry(req, res, next) {
  try {
    const custNo = String(req.params.custno || '').toUpperCase();
    const tenant = await authService.resolveTenant(custNo);

    if (!tenant.ok) {
      const msg =
        tenant.reason === 'inactive_company'
          ? 'Not Active Customer!'
          : `Sorry no estimate file on this server ${custNo}`;
      return res.status(404).type('text/plain').send(msg);
    }
    return res.redirect(`/mplogin?co=${encodeURIComponent(custNo)}`);
  } catch (err) {
    next(err);
  }
}

// Legacy URL compatibility: /wc.dll?mp~hellonet~<CUSTNO> and ~NetLogonWc~<CUSTNO>.
function wcDll(req, res, next) {
  // Query has no '=' (e.g. "mp~hellonet~DEMOPRO"); parse the raw string.
  const raw = req.originalUrl.split('?')[1] || '';
  const parts = decodeURIComponent(raw).split('~');
  const method = (parts[1] || '').toLowerCase();
  if (method === 'hellonet' || method === 'netlogonwc') {
    req.params.custno = parts[2] || '';
    return adminEntry(req, res, next);
  }
  // Other wc.dll calls (menu links) are not yet migrated. In production HAProxy
  // routes /wc.dll to the legacy app; locally we report the pending pointer.
  const mod = (parts[0] || '').toLowerCase();
  return res
    .status(501)
    .type('text/plain')
    .send(`${mod}~${method}: not yet migrated (handled by the legacy app in production)`);
}

module.exports = { adminEntry, wcDll };
