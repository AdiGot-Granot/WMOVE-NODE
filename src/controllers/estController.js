'use strict';

// MPEST module controller — one handler per legacy web endpoint.
//
// Status:
//   ✓ implemented  — inventory document (proof of concept)
//   ▢ pending      — scaffolded stub; port logic from PRGS-736/MPEST.PRG at the
//                    referenced line. Stubs return HTTP 501 with that reference
//                    so the module's full surface is wired and trackable.

const inventoryService = require('../services/inventoryService');
const estimateEntryService = require('../services/estimateEntryService');
const entryService = require('../services/entryService');

// Estimate entry form (legacy MPEST.entrywc). Local/Long-Distance, International
// and Broker all land here (differ by ?module=). Renders entry.ejs.
async function entrywc(req, res, next) {
  try {
    const module = req.query.module || '';
    const dept = req.query.dept || '';
    const refno = req.query.refno || (req.session.est && req.session.est.refno) || '';

    const model = await entryService.getEntryForm(req.user || { custid: null, levelid: 0 }, { module, dept, refno });

    if (model.notFound) return res.status(404).type('text/plain').send('Estimate not found');
    if (model.writeDisabled) {
      return res
        .status(503)
        .type('text/plain')
        .send('New estimate creation is disabled (ESTIMATE_WRITES=false). Verify on DEMOPRO, then enable to write to the database.');
    }

    // remember the estimate for continuity (entryret, inventory, etc.)
    req.session.est = { refno: model.est.REFNO, jobId: model.est.JOBID };
    res.render('mpest/entry', model);
  } catch (err) {
    next(err);
  }
}

// ─── Implemented ────────────────────────────────────────────────────────────

// Customer entry / bootstrap (legacy MPEST.PRG:32).
// Accepts /mpest/indexwc/:custno/:dept?/:entry? or ?custno=&dept=&entry=
async function indexwc(req, res, next) {
  try {
    const custNo = req.params.custno || req.query.custno || req.query[3];
    const dept = req.params.dept || req.query.dept || req.query[4] || '';
    const entry = req.params.entry || req.query.entry || req.query[5] || '';
    const ip = req.ip;

    const result = await estimateEntryService.bootstrap({ custNo, dept, entry, ip });

    if (!result.ok) {
      if (result.blocked) return res.status(403).type('text/plain').send('Access restricted.');
      return res.status(400).type('text/plain').send(result.error);
    }

    // Store the entry context in the session (replaces the legacy COOKIE record).
    req.session.est = result.context;
    return res.redirect(result.redirectTo);
  } catch (err) {
    next(err);
  }
}

// Inventory list + e-sign document (legacy ExpandScript 'DOCS/inventory').
async function inventory(req, res, next) {
  try {
    const refno = req.params.refno || req.query.refno;
    const temailid = parseInt(req.params.temailid || req.query.temailid || '0', 10);

    const doc = await inventoryService.getInventoryDocument(refno);
    if (!doc) return res.status(404).type('text/plain').send('Estimate not found');

    res.render('mpest/inventory', {
      company: doc.company,
      est: doc.est,
      items: doc.items,
      totals: doc.totals,
      temailid,
      refno,
      custid: doc.est.CUSTID,
      sig: { data: '', date: '', name: '', ip: '' },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Pending (scaffolded from PRGS-736/MPEST.PRG) ───────────────────────────
// name → legacy source line. Public (token-auth) vs internal (login) is
// enforced in routes/mpest.js.
const PENDING = {
  entryautowc: 235, entryret: 726, emailin: 1572,
  emaildocs: 1910, emailindocs: 1989, printautowc: 2268, emailauto: 2497,
  prnestwc: 2867, EmailEst: 3386, emailcenterwc: 4099, emailcenterret: 4208,
  ClaimsCenterWc: 4731, thankswc: 4832, thanksret: 4911, deleteest: 4964,
  cancelest: 5011, exitmenu: 5087, logfilewc: 5104, recurringlist: 5174,
  extstopwc: 5283, extstopret: 5314, remagentwc: 5349, remagentret: 5379,
  ESIGNWC: 5413, ESIGNRET: 5614, EMAILSLOG: 5800, EMAILSLOGEID: 5900,
  FriendlyIn: 6022, bolin: 6250, QA_VIEWEMAIL: 6308, emailsentmsg: 6392,
  bolwc: 6409, ESIGNBOLRET: 6948, ESIGNDOCRET: 7083,
};

const handlers = { inventory, indexwc, entrywc };
for (const [name, line] of Object.entries(PENDING)) {
  handlers[name] = (req, res) =>
    res
      .status(501)
      .type('text/plain')
      .send(`MPEST.${name}: not yet migrated — port from PRGS-736/MPEST.PRG:${line}`);
}

handlers.PENDING = PENDING;
module.exports = handlers;
