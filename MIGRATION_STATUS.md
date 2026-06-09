# wMove → Node.js — Migration Status

_Living tracker of what has been migrated from the Visual FoxPro + West Wind app to `nodeWmove`._

**Last updated:** 2026-06-09
**Approach:** incremental, behavior-preserving. Each endpoint is ported by reading its legacy source (`PRGS-736/<MODULE>.PRG` at the line in `catalog/endpoint-catalog.csv`), porting logic into a service + repository, converting its `.wc` page to an EJS view, and adding a test.

## Summary

| | Count |
| --- | ---: |
| Legacy endpoint methods (raw) | 1,139 |
| Duplicate/variant copies excluded | 278 |
| **Real endpoints to migrate** | **861** |
| **Migrated so far** | **6** |
| Remaining | 855 |

> "Migrated" = implemented + tested. Stubs that return a "not yet migrated" pointer are **not** counted as migrated.

---

## ✅ Migrated

### Infrastructure / foundation
- [x] Express app skeleton (routes → controllers → services → repositories → EJS views)
- [x] `mssql` connection pool + `execProc` (reuse existing GMOVE stored procedures)
- [x] **HTTPS** via PFX bundle (`certs/localhost.pfx`), port **6000** — noms convention (`pfx` + `PFX_PASSWORD`)
- [x] Demo mode (`DATA_MODE=demo`) — runs with no database, using `data/demo/fixtures.js`
- [x] Session middleware + route guards (`requireUser`, `requirePriv`)
- [x] Static serving of the bundled legacy `web/` tree (`/zz/...`)
- [x] Endpoint catalog generator (`npm run catalog`) + smoke test suite (`npm test`)

### Endpoints

| # | Module | Endpoint | Type | Source | Notes |
| --- | --- | --- | --- | --- | --- |
| 0 | MP | `hellonet` / `NetLogonWc` + `admin.htm` | entry | `MP.PRG:32/45` | Tenant entry: `/<CUSTNO>/admin.htm` (and `/wc.dll?mp~hellonet~`) resolve the company code → tenant-scoped login. Imported from `admin.js`. |
| 1 | MPLOGIN | login / logout | auth | `MP.PRG:440` | Validates user within tenant (company code → custid), loads privileges (`USERSPRIV`→`PRIVLGS`). Lands on the main menu. |
| 2 | MAMENU | `mainmenuwc` | page | `MAMENU.PRG:75` | Faithful conversion of `mainmenu.wc` (GRANOT header, quick search, level-gated bullet menu, OMS bar). |
| 2b | MAMENU | `selectesttype` / `selectestret` | page+route | `MAMENU.PRG:400/479` | New Estimate type chooser (`selectest.wc`): dept + tariff gating; routes Local/Intl/Auto/Broker to the entry form. |
| 3 | MPEST | `indexwc` | logic/redirect | `MPEST.PRG:32` | Customer entry: tenant + dept + IP checks → session → redirect. |
| 3b | MPEST | `entrywc` | form | `MPEST.PRG:444` | Estimate entry form (`entry.wc`, Local/LD + International + Broker). Read/render + lookups (TREF, MOVESIZE) done & tested. **Create path verified on DEMOPRO** (job #578106 via `cst.NextJobNo` OUTPUT params). Write stays gated by `ESTIMATE_WRITES` (set true in db mode to enable). |
| 3c | MPEST | `entryautowc` | form | `MPEST.PRG:235` | Auto Transport entry form (`entryauto.wc`). Renders the AUTO branch of `selectestret`; creates a `TYPE='T'` estimate (write-gated by `ESTIMATE_WRITES` in db mode) and binds the auto-transport location options (Residence/Business/Dealership/Port/Terminal/Auction). Department picker shown only when `COLEVEL=3` and the tenant has multiple active departments. |
| 4 | MPEST | `inventory` | page | (DOCS/inventory) | Inventory list + e-sign document (first POC). |
| 5 | MPEST | `esigndocret` | handler | `MPEST.PRG:7083` | Route wired; signature persistence is a Phase-1b stub. |

---

## ⏳ Pending (by module)

Counts are deduped real endpoints. Customer/public-facing **MP\*** modules:

| Module | Domain | Endpoints | Migrated | Remaining |
| --- | --- | ---: | ---: | ---: |
| MPDIR | Directory / distance | 3 | 0 | 3 |
| MPXML | XML / API | 1 | 0 | 1 |
| MPINV | Inventory | 14 | 0 | 14 |
| MPAUTO | Auto transport | 14 | 0 | 14 |
| MPLEADS | Leads | 15 | 0 | 15 |
| MPSTG | Storage | 25 | 0 | 25 |
| MPAGENT | Agents | 26 | 0 | 26 |
| MPUTIL | Utilities / config | 35 | 0 | 35 |
| **MPEST** | **Estimates** | **36** | **3** | **33** |
| MPREP | Reports | 43 | 0 | 43 |
| MPCHARGE | Billing / card & e-check ⚠️ | 65 | 0 | 65 |
| MPOPR | Operations / jobs | 79 | 0 | 79 |
| MPPROC | Shared estimate processing | 117 | 0 | 117 |
| MPMAINTEN | Maintenance | 127 | 0 | 127 |
| MPADMIN, MPSYS, MPSCRIPTS, MP | Admin / system / misc | 29 | 0 | 29 |

Admin-facing **MA\*** modules (MAMENU, MAREP, MAPROC, MAUTIL, MACHARGE, MAOPR, …) make up the remainder of the 861. `MAMENU.mainmenuwc` is the only one done so far.

⚠️ **MPCHARGE** (billing, credit-card, e-check) is the highest-risk module — migrate late, with gateway sandbox testing and reconciliation against `CCPROCESS`/`ECHKPROCESS`.

### MPEST endpoint detail (3 of 36 done)

Done: `indexwc`, `entrywc`, `entryautowc`, `inventory`. Remaining stubs (each returns its source line):
`entryret`, `emailin`, `emaildocs`, `emailindocs`, `printautowc`, `emailauto`, `prnestwc`, `EmailEst`, `emailcenterwc`, `emailcenterret`, `ClaimsCenterWc`, `thankswc`, `thanksret`, `deleteest`, `cancelest`, `exitmenu`, `logfilewc`, `recurringlist`, `extstopwc`, `extstopret`, `remagentwc`, `remagentret`, `ESIGNWC`, `ESIGNRET`, `EMAILSLOG`, `EMAILSLOGEID`, `FriendlyIn`, `bolin`, `QA_VIEWEMAIL`, `emailsentmsg`, `bolwc`, `ESIGNBOLRET`, `ESIGNDOCRET`.

**Suggested next (customer estimate flow):** `entryret` → `thankswc`/`thanksret`, completing the journey `indexwc`/`entrywc`/`entryautowc` feed into.

---

## ⚠️ Known simplifications & gaps to revisit

- **Menu permission gating** is approximated using the privilege codes in `req.user.privs` + a coarse role. The legacy menu uses `arn.vw_UsersPrm` flags (`ADMIN`, `VIEWALL`, `ACCT`, `CLAIMS`, `STORAGE`, `LEADDIST`, …) and a 1–5 `pnLEVEL`. Wire these in as the supporting endpoints are migrated.
- **Menu badge counts** `jobTasks` is not yet computed (the level-scoped WHERE from `MAMENU` ~line 230 needs porting); `followUps` and `userTasks` queries are in `menuRepo` but only exercised against a live DB.
- **Passwords are plaintext** in `arn.USERS`; we reproduce the legacy comparison for parity. Phase 2: bcrypt + transparent re-hash on login.
- **Mixed-case asset paths** (`/ZZ/...` vs `/zz/...`) 404 on Linux (case-sensitive). Normalize during page conversion.
- **Level mapping**: `USERS.levelid` (e.g. 9, 13) differs from the legacy 1–5 `pnLEVEL`; the exact mapping (likely via `utl.USERLEVELS`) is not yet resolved.
- **Tenant resolution**: `indexwc` resolves the tenant by company code; multi-tenant edge cases (ambiguous logins) are handled minimally.
- **`job.EST` is normalized vs FoxPro `EST.DBF`**: `ORDNO→JOBID`, `TYPE→JOBTYPE`, `STATUS→JOBSTATUS`, `DEPT→DEPTID`. Repos alias back to the legacy names. The booked-vs-quote distinction (`VAL(ORDNO)>99999`) is approximated via `isBooked`.
- **Estimate creation writes to production** (`cst.JOBS` via `cst.NextJobNo`, then `job.EST`). Gated behind `ESTIMATE_WRITES`; the insert reuses `cst.NextJobNo` and must be verified on DEMOPRO before enabling. The full submit (`entryret` — saving form edits) is not yet migrated.

---

## How to update this file

When you migrate an endpoint: move it from Pending to the Migrated table, bump the Summary counts, and note any new simplifications. Keep "Migrated" honest — implemented **and** tested only.
