'use strict';

// Routes for the MPEST module. URLs kept compatible with the legacy West Wind
// scheme so existing links/bookmarks keep working.
//
// PUBLIC endpoints are customer-facing documents authenticated by tokens in the
// URL (REFNO/TEMAILID) — no login, matching legacy behavior.
// INTERNAL endpoints are staff pages and require an authenticated session.

const express = require('express');
const router = express.Router();
const est = require('../controllers/estController');
const { requireUser } = require('../middleware/auth');

// Customer-facing document/estimate pages (token-auth, no login).
const PUBLIC = [
  'indexwc', 'inventory', 'entrywc', 'entryautowc', 'entryret', 'thankswc', 'thanksret',
  'prnestwc', 'printautowc', 'ESIGNWC', 'ESIGNRET', 'ESIGNBOLRET', 'ESIGNDOCRET',
  'bolwc', 'bolin', 'FriendlyIn',
];

// Implemented convenience routes (friendly params form).
router.get('/entrywc', est.entrywc);
router.get('/entryautowc', est.entryautowc);
router.get('/indexwc/:custno/:dept?/:entry?', est.indexwc);
router.get('/inventory/:refno/:custid?/:temailid?', est.inventory);
router.post('/esigndocret/:refno/:custid?/:temailid?', est.ESIGNDOCRET);

// Wire every MPEST endpoint by name; guard internal ones with requireUser.
const allNames = ['inventory', ...Object.keys(est.PENDING)];
for (const name of allNames) {
  const handler = est[name];
  if (!handler) continue;
  const guard = PUBLIC.includes(name) ? [] : [requireUser];
  router.all(`/${name}`, ...guard, handler);
}

// Legacy tilde-style compatibility:  /mpest~METHOD~ARG1~ARG2~...
router.all(/^\/~?([A-Za-z_0-9]+)~(.+)$/, (req, res, next) => {
  const method = req.params[0];
  const args = req.params[1].split('~');
  const handler = est[method] || est[method.toLowerCase()];
  if (!handler) return next();
  req.params = { refno: args[0], custid: args[1], temailid: args[2], args };
  if (!PUBLIC.includes(method)) return requireUser(req, res, () => handler(req, res, next));
  return handler(req, res, next);
});

module.exports = router;
