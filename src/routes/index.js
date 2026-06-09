'use strict';

const express = require('express');
const router = express.Router();
const config = require('../config');
const { requireUser } = require('../middleware/auth');

// Auth + module routers.
const tenant = require('../controllers/tenantController');
router.use('/mplogin', require('./mplogin'));
router.use('/mamenu', require('./mamenu'));
router.use('/mpest', require('./mpest'));

// Legacy tenant entry points (imported from admin.htm / admin.js + MP.hellonet):
//   /<CUSTNO>/admin.htm           → tenant-scoped login  (the URL users bookmark)
//   /wc.dll?mp~hellonet~<CUSTNO>  → same, legacy West Wind URL
router.get('/wc.dll', tenant.wcDll);
router.get('/:custno/admin.htm', tenant.adminEntry);

// Landing page — quick status + POC links.
router.get('/', (req, res) => {
  const u = req.user;
  res
    .type('html')
    .send(
      `<h2>nodeWmove</h2>
       <p>Phase 1 Express skeleton — DATA_MODE=<b>${config.dataMode}</b>.</p>
       <p>${u ? `Signed in as <b>${u.username}</b> · <a href="/mamenu/mainmenuwc">main menu</a> · <a href="/mplogin/logout">sign out</a>` : `<a href="/mplogin">Sign in</a> to reach the main menu`}</p>
       <h3>Public pages (token-auth, no login)</h3>
       <ul>
         <li><a href="/mpest/indexwc/DEMOMOVE/W/ENTRY">/mpest/indexwc/DEMOMOVE/W/ENTRY</a> (customer entry — redirects into the estimate flow)</li>
         <li><a href="/mpest/inventory/REF1001/12/0">/mpest/inventory/REF1001/12/0</a> (inventory sign view)</li>
         <li><a href="/mpest/inventory/REF1001/12/110">/mpest/inventory/REF1001/12/110</a> (signed variant)</li>
       </ul>
       <h3>Internal pages (require login — still stubs)</h3>
       <ul>
         <li><a href="/mpest/deleteest">/mpest/deleteest</a> (guarded; redirects to login when signed out)</li>
       </ul>`
    );
});

router.get('/healthz', (req, res) => res.json({ ok: true, mode: config.dataMode }));

// Example of a guarded area outside a module (kept simple here).
router.get('/me', requireUser, (req, res) => res.json(req.user));

module.exports = router;
