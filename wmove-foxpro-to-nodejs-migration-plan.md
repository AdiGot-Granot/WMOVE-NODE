# wMove — Visual FoxPro → Node.js Migration Plan

**Project:** `/var/www/wmove` (working tree on DEV server: `D:\WMOVE`)
**Stack today:** Visual FoxPro 9 + West Wind Web Connection, IIS 10, SQL Server
**Database:** `GMOVE` (+ `GMOVELOG`, `GMOVEUTIL`, `nDEV`, `UTIL`) — retained
**Prepared for:** raphael@granot.com
**Date:** 2026-06-07
**Status:** Draft v2 (revised with source-code analysis)

---

## 1. Executive summary

wMove is a large, mature, multi-tenant moving/relocation operations platform (SaaS — system domain `gmove.granot.com`, each `CustId` is a moving company). It is built in **Visual FoxPro 9** using the **West Wind Web Connection** web framework, fronted by **IIS**, with data in **Microsoft SQL Server** (`GMOVE`: 258 tables, 29 views, 202 stored procedures, 81 functions; largest tables run into hundreds of millions of rows).

The **Phase 1 goal is a behavior-preserving rewrite of the application layer from FoxPro to Node.js (Express, server-rendered)**. The SQL Server database stays, existing stored procedures/functions are reused, the existing HTML/JS pages are preserved, and **end users see no difference**. Remaining FoxPro `.dbf` data is folded into SQL Server along the way.

This revision is grounded in the actual source tree (now accessible). Key facts that shape the plan:

- The web layer is **West Wind Web Connection process classes** (`MP*`/`MA*` programs). The application exposes roughly **950 web endpoint methods** across ~16 modules — this is the real migration surface.
- HTML is produced two ways: **`Response.Write`** (HTML built inline in FoxPro code) and **`Response.ExpandScript`** (West Wind "scripted HTML" pages — ASP-style HTML files with embedded `<%= %>`/`<% %>` FoxPro expressions).
- **The scripted HTML pages live in `D:\web` (`HtmlPagePath`), outside this repository.** They are the front-end you want to preserve and must be brought into scope.
- The repo carries heavy noise: scratch files, `(2)` duplicate copies, and full **snapshot backup folders** (`PRGS-609/670/700/736`, build tags `wm738–740`). The authoritative current source is the root set plus **`PRGS-736`** (~279K lines).

### Guiding principles

- **No visible change for users.** Same URLs, same pages, same HTML/JS, identical behavior. This re-platforms the *logic*, not the UI.
- **The database is kept.** SQL Server stays; stored procedures/functions are reused, not rewritten, in Phase 1.
- **Incremental, reversible cutover.** Migrate module by module (`MP*` class by class) behind a proxy; FoxPro and Node run side by side on the same DB; any module rolls back instantly.
- **Parity before improvement.** Reproduce behavior exactly, prove it with comparison tests, then modernize (Phase 2+).

---

## 2. Current architecture (as built)

```
Browser
   │  HTTP  (URLs like  /wc.wc?MPEST~SomeMethod  or friendly routes)
   ▼
IIS 10  ──►  wc.dll / WebConnectionModule        (West Wind ISAPI/.NET handler)
   │           routes request to a VFP server instance (pool of wMove.exe)
   ▼
wMove VFP server  (appmain.prg → wwServer)
   │  dispatches  Module ~ Method
   ▼
MP* / MA* process class  (DEFINE CLASS ... AS WWC_PROCESS)
   │  one FUNCTION per web endpoint  (~950 total)
   │  business logic in-line + calls to SQL Server sprocs/functions
   ├─ Response.Write(...)            → HTML built in code
   └─ Response.ExpandScript('page')  → scripted HTML page from D:\web
   ▼
SQL Server: GMOVE (+ GMOVELOG, GMOVEUTIL, nDEV, UTIL)
```

### Process modules (migration units)

The `WM.INI` switches and `PRGS-736` confirm the module set. Endpoint counts (FUNCTION/PROCEDURE per module) give a rough size signal:

| Module (`MP*`) | Domain | ~Endpoints |
| --- | --- | ---: |
| `MPDIR` | Directory / distance | 3 |
| `MPINV` | Inventory | 14 |
| `MPSTG` | Storage | 25 |
| `MPAGENT` | Agents | 26 |
| `MPUTIL` | Utilities / config | 35 |
| `MPEST` | Estimates | 36 |
| `MPCHARGE` | Billing / card & e-check processing | 65 |
| `MPOPR` | Operations / jobs | 79 |
| `MPLEADS`, `MPLOGIN`, `MPMENU`, `MPADMIN`, `MPMAINTEN`, `MPREP`, `MPAUTO`, `MPXML` | leads, auth, menu, admin, maintenance, reports, automation, XML/API | remainder |
| **All modules (`MP*`/`MA*`)** | | **≈ 951** |

Counterpart `MA*` programs ("Ma…" switches in `WM.INI`) are the admin/agent-facing variants of several modules.

### Rendering: what "keep the HTML" actually means

- **`Response.Write`** — pages assembled as strings in FoxPro. These become Express handlers that render a view (the HTML moves into a Mustache/EJS template, the data into the model).
- **`Response.ExpandScript(HtmlPagePath + 'name', …)`** — West Wind scripted pages such as `entry`, `entrycust`, `entryauto`, `navest`, `restip`, `index`. These `.htm`/`.wc` files contain the markup + embedded FoxPro expressions and **live in `D:\web`, not in this repo**. They are the closest thing to existing templates and convert most directly to server-rendered views — but **we must obtain `D:\web` to migrate them.**

### Source-tree reality (cleanup required)

- ~1,044 `.prg`, 45 forms (`.scx`), 16 class libs (`.vcx`), plus West Wind framework folders (`wwthreads`, `wwreader`, `wwDevRegistry`, `wwIPStuff`).
- Noise to triage out before/while migrating: scratch programs (`TT*.PRG`, single/double-letter dupes like `AAD/AAF/PPP/ZZZ`), `(2)` copies, `-yossi`/`X`/`_FIX` variants, and the **snapshot folders** `PRGS-609/670/700/736`. Authoritative source ≈ root + `PRGS-736`.
- Build/runtime config: `WM.INI` (module switches, paths), `config.fpw`, `WCONNECT.H`. Working tree `D:\WMOVE`; HTML under `D:\web`; temp `d:\temp\wc`. SQL connection configured outside the repo.

---

## 3. Recommended target architecture

A server-rendered Node.js app that serves the **same pages** to users while talking to the **same SQL Server database**.

```
                 ┌──────────────────────────────────────────────┐
   Browser ───►  │  Reverse proxy (nginx / IIS ARR)             │
                 │   migrated module routes ──► Node.js (Express)│
                 │   not-yet-migrated       ──► legacy wc.dll →  │
                 │                              VFP wMove server │
                 └──────────────────────────────────────────────┘
                              │                         │
                              ▼                         ▼
                ┌───────────────────────────┐   ┌──────────────────┐
                │ Node.js / Express          │   │ VFP + West Wind  │
                │  routes/   (per MP* module)│   │ (shrinking)      │
                │  controllers/ (per method) │   └────────┬─────────┘
                │  services/  (business logic)│           │
                │  data/      (mssql + sprocs)│           │
                │  views/     (Mustache/EJS)  │           │
                │   = converted D:\web pages  │           │
                └─────────────┬──────────────┘           │
                              └────────────┬─────────────┘
                                           ▼
                              ┌──────────────────────────┐
                              │ SQL Server — GMOVE etc.   │
                              └──────────────────────────┘
```

### Recommended stack

| Concern | Recommendation | Why |
| --- | --- | --- |
| Runtime | Node.js LTS | Stability, long support. |
| Web framework | **Express** | Your preference; minimal, ideal for route-by-route migration mirroring legacy URLs. |
| Templating | **Mustache** (`mustache-express`), with **EJS** fallback | Mustache matches your preference and keeps logic out of views. EJS is the faster path for converting West Wind scripted pages (`<%= %>` maps almost 1:1). Express can run both. |
| DB driver | **`mssql`** (Tedious) | Standard SQL Server client; parameterized queries, stored-proc calls, pooling. |
| Sessions/auth | `express-session` + shared store; port `USERS`/`USERSPRIV`/`PRIVLGS`/`FUNCACCESS` checks | Interop with the legacy app during cutover (see §8). |
| Config | `dotenv` | Replaces `WM.INI`; keep the per-module on/off switch concept. |
| Logging | `pino`, plus persist to the `log` schema where the app does today | Preserve audit trails. |
| Process mgr | PM2 (or Windows service) | Clustering, zero-downtime reloads. |
| Testing | Jest + Supertest + golden-page parity harness | Prove page-for-page parity vs the VFP app (see §9). |

**TypeScript (recommended, optional in Phase 1):** strong typing pays off across a 258-table schema and ~950 endpoints. Can start in JS and introduce TS at module boundaries — flag as a conscious tradeoff.

### Why Express + Mustache fits

Your goal is to reproduce existing pages, not build a SPA. The West Wind model (URL → process method → render) maps almost 1:1 onto Express (route → controller → view), so the rewrite is mechanical and auditable, and legacy URLs can be preserved exactly. **One caveat:** West Wind scripted pages use `<%= %>`/`<% %>` and may include JS that uses `{{ }}`; Mustache's `{{ }}` can collide. Mitigation: use **EJS for converted scripted pages** (delimiters already match) and Mustache for new/clean views, or set custom Mustache delimiters.

---

## 4. Discovery phase (prerequisite)

1. **Obtain `D:\web`** (the scripted HTML/JS/CSS page tree) and any other runtime assets referenced via `ExpandScript`/`HtmlPagePath`. Without these, the front-end cannot be preserved.
2. **Establish the authoritative source set.** Confirm root + `PRGS-736` as current; archive the snapshot folders (`PRGS-609/670/700`) and scratch/`(2)` files out of the migration scope.
3. **Build the endpoint catalog.** Enumerate every `FUNCTION`/`PROCEDURE` in each `MP*`/`MA*` class → URL, inputs (`Request.Form/QueryString`), SQL/sprocs touched, outputs (`Response.Write`/`ExpandScript` target), side effects (email/SMS, card charges, file writes). ~950 rows; this is the master migration backlog.
4. **Inventory `.dbf` files still in use** and map each to a target SQL Server table/schema (see §6.3).
5. **Catalog cross-cutting concerns:** West Wind session/auth + the app's `USERS`/`USERSPRIV`/`PRIVLGS`/`FUNCACCESS`; card/e-check gateways (`wwcharge.prg`, `CCPROCESS`, `ECHKPROCESS`); email/SMS; scheduled/batch jobs (`spRUNALLTASKS`, `spRUNALLCYCLES`, recurring jobs); XML/SOAP/API endpoints (`MPXML`, `SoapSamples`, `wwSOAP`).
6. **Define parity** and capture golden pages from the live app for regression comparison.

---

## 5. Migration approach (recommended): incremental "strangler"

**Recommendation: incremental strangler, not big-bang.** For a system this large and revenue-critical, big-bang is unacceptably risky.

- A **reverse proxy** (nginx, or IIS ARR since you're already on IIS) fronts both apps. Migrated module routes go to Express; everything else continues to `wc.dll` → the VFP server. Both hit the same database, so data stays consistent.
- Migrate **one `MP*` module at a time**: catalog its endpoints, port logic to services, convert its pages to views, verify parity, flip its routes, monitor. Instant rollback by flipping the route back.
- The VFP server **shrinks** module by module until it can be retired.

**Recommended order** (smaller/lower-risk first to build the framework and parity tooling; revenue-critical last):

1. **`MPLOGIN` + session/auth + permissions** (`USERS`, `USERSPRIV`, `PRIVLGS`, `FUNCACCESS`) — needed by everything; do early, carefully (§8).
2. **`MPDIR` (3)** and **read-only utility/reference pages (`MPUTIL`, 35)** — prove the framework, proxy, and golden-page harness on low-risk endpoints.
3. **`MPLEADS`** — high value, relatively self-contained.
4. **`MPAGENT` (26)**, then customer-facing entry pages.
5. **`MPEST` (36)** + **`MPINV` (14)** + tariffs.
6. **`MPOPR` (79)** — operations/jobs; large, do once patterns are proven.
7. **`MPSTG` (25)**.
8. **`MPCHARGE` (65)** — billing, card & e-check processing; **highest risk, migrate late** with gateway sandbox testing and reconciliation against `CCPROCESS`/`ECHKPROCESS`.
9. **`MPXML`/API/SOAP** and **batch/scheduled jobs** (port schedulers off FoxPro).
10. **Decommission the VFP server and `wc.dll`.**

---

## 6. Data layer strategy

### 6.1 Keep SQL Server, reuse server-side logic
In Phase 1, Node calls existing stored procedures/functions via `mssql` rather than reimplementing them — preserving behavior and cutting the rewrite surface. Use a single connection pool, parameterized queries only, explicit transactions where the FoxPro code used them, and wrap each sproc in a small typed data-access function.

### 6.2 Repository/service layering
Even while reusing sprocs, route all DB access through a thin repository layer per module so that, in Phase 2, individual procedures can be reimplemented in Node without touching controllers or views.

### 6.3 `.dbf` → SQL Server migration
For data still in FoxPro tables: profile each `.dbf` (columns, types, code page, row counts) → design the target SQL Server table (FoxPro→T-SQL type mapping; `Character`→`varchar/nvarchar`, `Numeric`→`decimal`, `Date`→`date`, `Logical`→`bit`, `Memo`→`*max`) → build a repeatable ETL (Node/Python or `bcp`/SSIS) → validate (counts, checksums, FK integrity) → switch the owning module's reads/writes to SQL Server when that module migrates. Handle legacy code pages carefully (normalize to the DB collation/UTF-8).

---

## 7. View / template conversion

This is how "keep the HTML/JS" is delivered concretely:

- **`ExpandScript` scripted pages (from `D:\web`)** → port to **EJS** views (the `<%= %>`/`<% %>` syntax matches), preserving markup and JS verbatim; replace FoxPro expressions with Node model values. This is the bulk of the user-visible HTML.
- **`Response.Write` inline HTML** → extract the markup into a view (EJS/Mustache) and pass a model from the controller; do not keep building HTML by string concatenation in Node.
- **Static JS/CSS/images** → served unchanged from Express `public/` (mirror `D:\web` asset paths so references don't break).
- Preserve URLs and form field names exactly so existing client-side JS and bookmarks keep working.

---

## 8. Authentication & session interoperability

During cutover a user may cross between Express-served and VFP-served pages in one session, so login state must be shared.

- Determine how West Wind + wMove authenticate today (cookie name/contents, server-side session, the `USERS`/`USERSPRIV` model).
- Make Express **honor the same session cookie / shared store** (a SQL Server session table or Redis) so a login in either app is recognized by both.
- Re-implement permission checks against `USERSPRIV`/`PRIVLGS`/`FUNCACCESS` exactly; add tests comparing allow/deny decisions per user and endpoint.
- Review password hashing: keep the legacy scheme for parity in Phase 1; schedule a transparent re-hash-on-login upgrade for Phase 2 if it's weak.

---

## 9. Testing & parity verification

- **Golden-page comparison:** capture rendered HTML from the live VFP app for a representative set of endpoints + inputs; diff vs Express output, normalizing known-irrelevant differences (timestamps, tokens) and asserting equality on the rest.
- **Endpoint parity from the catalog:** drive tests from the ~950-row endpoint catalog so coverage is measurable per module.
- **Data-access tests:** assert each sproc wrapper returns what the FoxPro path relied on (run against a restored copy of `GMOVE`, never production).
- **Integration tests** (Supertest) for routes, permission boundaries, error pages.
- **Shadow testing:** in staging, mirror real traffic to both apps and diff responses before flipping any production route.
- **Per-module smoke + rollback drill** before each go-live.

---

## 10. Suggested project structure

```
wmove-node/
├── src/
│   ├── app.js                # Express, middleware, view engines (ejs + mustache)
│   ├── config/               # env (replaces WM.INI), db config, gateway keys, module switches
│   ├── db/
│   │   ├── pool.js           # mssql connection pool
│   │   └── repositories/     # one per schema/module (job, cst, lid, trf, ...)
│   ├── services/             # business logic ported from MP* methods
│   ├── controllers/          # one per MP* module; method-per-endpoint
│   ├── routes/               # legacy-compatible URLs per module
│   ├── views/                # converted D:\web pages (ejs) + new (mustache)
│   ├── middleware/           # auth, permissions, sessions, error handling
│   └── jobs/                 # ported scheduled/batch tasks
├── public/                   # JS/CSS/images mirrored from D:\web (unchanged)
├── etl/                      # .dbf → SQL Server loaders & validation
├── catalog/                  # endpoint catalog (the ~950-row migration backlog)
├── test/ { parity/ integration/ unit/ }
├── ops/  { nginx-or-iis-arr/  pm2/ }
└── .env.example
```

---

## 11. Risks & mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| `D:\web` scripted pages not yet in scope | Can't preserve front-end | Acquire `D:\web` in discovery before view conversion. |
| ~950 endpoints, ~279K LOC active | Large effort, easy to lose track | Endpoint catalog as backlog; migrate per module with measurable coverage. |
| Source-tree noise (snapshots, dupes) | Migrating dead/wrong code | Lock authoritative set (root + `PRGS-736`); archive the rest first. |
| West Wind session/auth interop | Logouts / security gaps during cutover | Shared session store; honor existing cookie; permission-parity tests. |
| Card/e-check parity (`MPCHARGE`) | Financial errors | Migrate late; gateway sandbox; reconcile vs `CCPROCESS`/`ECHKPROCESS`. |
| Hidden logic in `Response.Write`/sprocs | Behavior drift | Golden-page parity + instant proxy rollback. |
| Huge tables (100M+ rows) | Performance regressions | Keep indexes/sprocs; load-test migrated read paths; no schema changes in Phase 1. |
| Mustache `{{ }}` vs page JS collisions | Broken pages | Use EJS for converted pages / custom delimiters. |
| Scheduled/batch jobs missed mid-transition | Silent data gaps | Inventory all; run old+new in parallel briefly, diff, then cut over. |
| Scope creep into redesign | Timeline blowup, visible change | Hard rule: Phase 1 = parity only; improvements deferred to Phase 2. |

---

## 12. Phased roadmap (summary)

| Phase | Goal | Key outputs |
| --- | --- | --- |
| **0. Discovery** | Acquire `D:\web`; lock authoritative source; build endpoint catalog; `.dbf` inventory; define parity | Endpoint backlog, route↔data map, baseline goldens |
| **1a. Foundation** | Express skeleton (ejs+mustache), proxy, mssql pool, session interop, parity harness; migrate `MPLOGIN` + 1–2 read-only pages | Running Node app behind proxy for first routes |
| **1b. Module migration** | Migrate `MP*` modules in ranked order, reusing sprocs, converting pages; fold in `.dbf` data as needed | Each module live on Node, parity-verified, rollback-tested |
| **1c. API + batch** | Port `MPXML`/SOAP/API and schedulers off FoxPro | All background/integration work on Node |
| **1d. Decommission** | Retire VFP server + `wc.dll` once all routes migrated | Node serves 100% |
| **2. Modernize (later)** | Reimplement sprocs in Node, add TypeScript, refactor UI/security | Incremental, non-user-visible until ready |

Phase 1 deliberately changes nothing the user sees; modernization is deferred to Phase 2 so it never competes with parity.

---

## 13. Immediate next steps

1. Provide **`D:\web`** (scripted pages/JS/CSS) and confirm any other `HtmlPagePath`/`Datapath` locations from `WM.INI`.
2. Confirm **root + `PRGS-736`** as the authoritative source; archive snapshot/scratch/`(2)` files out of scope.
3. Restore a **non-production copy of `GMOVE`** for development and the parity harness.
4. Generate the **endpoint catalog** from the `MP*`/`MA*` classes (the migration backlog).
5. Stand up the **Express skeleton + proxy**, then migrate `MPLOGIN` and one read-only `MPDIR`/`MPUTIL` page end-to-end as a proof of concept (validates auth interop, view conversion, and parity testing together).

---

*Revised after analysis of the live `GMOVE` schema (258 tables across `utl`, `job`, `cst`, `log`, `lid`, `arn`, `inf`, `trf`, `api`, `dbo`; 202 sprocs; 81 functions) and the source tree at `/var/www/wmove` (VFP 9 + West Wind Web Connection; ~16 `MP*`/`MA*` process modules; ≈951 endpoint methods; ~279K lines of active code in `PRGS-736`; HTML via `Response.Write` + `Response.ExpandScript` against `D:\web`). The `D:\web` page tree is the main remaining unknown and should be brought into scope first.*
