'use strict';

// Route guard. Public customer-facing document pages (e-sign links, etc.) are
// token-authenticated by REFNO/TEMAILID in the URL, so they are NOT guarded
// here — that mirrors the legacy behavior. Internal MP* admin routes WILL use
// this guard once MPLOGIN is migrated (Phase 1a/1b).

function requireUser(req, res, next) {
  if (req.user) return next();
  return res.redirect('/mplogin');
}

function requirePriv(privCode) {
  return function (req, res, next) {
    if (req.user && req.user.privs && req.user.privs.includes(privCode)) return next();
    return res.status(403).render('errors/403', { privCode });
  };
}

module.exports = { requireUser, requirePriv };
