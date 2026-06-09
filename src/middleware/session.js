'use strict';

// Placeholder for West Wind session/auth interop.
// Phase 1b will: read the legacy cookie, resolve the wMove user, and load
// permissions from USERS / USERSPRIV / PRIVLGS / FUNCACCESS into req.user.
// For now it just exposes a convenience handle so views/controllers can be
// written against the final shape.

module.exports = function attachSession(req, res, next) {
  req.user = req.session.user || null;
  res.locals.user = req.user;
  next();
};
