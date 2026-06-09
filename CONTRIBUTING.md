# Contributing — Migrating routes from legacy wMove

This guide is for developers helping port the legacy **Visual FoxPro + West Wind Web Connection** wMove app to this Node.js (Express) project. The migration is **incremental and behavior-preserving**: we reproduce each legacy page exactly, one endpoint at a time, against the existing `GMOVE` SQL Server database.

Read these first for context: [`wmove-foxpro-to-nodejs-migration-plan.md`](wmove-foxpro-to-nodejs-migration-plan.md) (the plan) and [`MIGRATION_STATUS.md`](MIGRATION_STATUS.md) (what's done / pending).

---

## 1. What you need

- **Node.js 18+** and **git**.
- **A checkout of the legacy `wmove` repo placed next to this one** (i.e. `../wmove`). You read the original logic and HTML there:
  - `../wmove/PRGS-736/` — the authoritative snapshot of the VFP process classes (`MP*.PRG`, `MA*.PRG`). This is the **source of truth for behavior**.
  - `../wmove/WEB/` — the legacy scripted HTML pages (`.wc`), the templates you convert. (A copy of the served assets also lives in this repo under `web/`.)
- **Optional, for live data:** SQL Server access to `GMOVE` (and a non-production tenant such as `DEMOPRO`). Most work can be done in **demo mode with no database**.

## 2. Setup

```bash
git clone git@github-work:admin-granot/wmove-node.git
cd wmove-node
npm install
cp .env.example .env        # DATA_MODE=demo by default — runs with NO database
npm start                   # https://localhost:6443  (see README for the port/HTTPS notes)
npm test                    # in-process smoke suite — keep this green
```

Demo mode serves built-in fixtures from `data/demo/fixtures.js`, so you can build and test most pages without a DB. Switch to `DATA_MODE=db` (and fill `DB_*` in `.env`) to run against `GMOVE`.

## 3. Architecture — the layers

Every request flows through the same layers. Mirror this when you add a route:

```
URL  ─►  routes/        legacy-compatible path, picks PUBLIC vs login-guarded
     ─►  controllers/   one file per MP* module; reads the request, renders
     ─►  services/      the business logic ported from the .prg function
     ─►  db/repositories/   data access (SQL or demo fixtures); reuse GMOVE sprocs
     ─►  views/         EJS = converted .wc page  (Mustache for brand-new views)
```

- `src/lib/foxpro.js` — helpers that reproduce FoxPro expression semantics (`ALLTRIM`, `IIF`, `EMPTY`, date formatting, the `✓` entity). Use these in views so output matches the original.
- `src/config/` — env config (replaces `WM.INI`).
- `web/` — static assets + legacy `.wc` source. Asset URLs are absolute (`/zz/...`).

## 4. The recipe — porting one route

This is the core workflow. Pick an endpoint, then:

1. **Pick from the backlog.** Open `catalog/wmove-endpoint-catalog.xlsx` (regenerate with `npm run catalog`). Each row is an endpoint with its `sourceFile` + `line`. Pick one with `status = todo`. Unmigrated routes already return a pointer like `MPEST.entrywc: not yet migrated — port from PRGS-736/MPEST.PRG:444`.

2. **Read the legacy function** at that file/line. Identify three things:
   - **Inputs** — `Request.QueryString(n)` / `Request.Form("X")`.
   - **Data** — the SQL it runs and any stored procs it calls.
   - **Output** — `Response.Write(...)` (HTML built in code) or `Response.ExpandScript('<page>')` (a `.wc` page under `web/`).

3. **Add repository methods** for each data read in `src/db/repositories/`. One query per method, parameterized only. **Reuse existing GMOVE stored procedures** via `db/pool.execProc(...)` instead of reimplementing logic. Always add a demo-data branch (`config.isDemo`).

4. **Put the logic in a service** (`src/services/`) — the body of the `.prg` function, rewritten in JS, calling the repositories.

5. **Convert the page to a view.** Copy the `.wc` markup into `src/views/<module>/<name>.ejs`, keep it verbatim, and replace only the embedded FoxPro expressions with model values (`<%=pcCOMPANY%>` → `<%= company.NAME %>`, `<%=IIF(BULKY=1,'✓','')%>` → `<%- fox.isTrue(it.BULKY) ? fox.CHECK : '' %>`). Use **absolute** `/zz/...` asset paths.

6. **Add a controller method** that reads the request, calls the service, and renders the view.

7. **Wire the route** in `routes/<module>.js`. Keep the legacy URL working. Decide visibility: customer/document pages are **PUBLIC** (token-auth in the URL); staff pages use `requireUser`.

8. **Add a smoke test** in `test/smoke.js` asserting the new behavior (status, redirect, key content).

9. **Update `MIGRATION_STATUS.md`** — move the endpoint to the Migrated table, bump the counts.

### Worked examples to copy from

| Pattern | Endpoint | Files |
| --- | --- | --- |
| Logic + redirect | `MPEST.indexwc` | `services/estimateEntryService.js`, `controllers/estController.js` |
| Rendered document page | `MPEST.inventory` | `views/mpest/inventory.ejs`, `services/inventoryService.js` |
| Lookups + routing | `selectesttype` | `services/estimateTypeService.js`, `views/mamenu/selectest.ejs` |
| Full page that hits the DB | `mainmenuwc` | `services/menuService.js`, `views/mamenu/mainmenu.ejs` |
| Form + (gated) DB write | `MPEST.entrywc` | `services/entryService.js`, `db/repositories/estimateRepo.js`, `views/mpest/entry.ejs` |

## 5. Conventions & gotchas (read before writing SQL)

- **The SQL schema is normalized vs the FoxPro DBF.** e.g. `job.EST`: `ORDNO→JOBID`, `TYPE→JOBTYPE`, `STATUS→JOBSTATUS`, `DEPT→DEPTID`. **Always confirm real column names against the DB** before writing a query; alias back to the legacy names the template expects.
- **Some stored procs use OUTPUT parameters** (e.g. `cst.NextJobNo` returns `@JOBID`, `@NEXTJOBNO`, `@MSG`). Verify the contract; don't assume a recordset.
- **Writes are gated.** Any endpoint that mutates data must respect `config.estimateWrites` (`ESTIMATE_WRITES`, default **off**). Verify on a non-prod tenant (`DEMOPRO`) before enabling. Never enable writes by default.
- **Multi-tenant everywhere.** All data is scoped by `custid`. Login resolves a company code (`CUSTNO`) → `custid`; carry it through services.
- **Legacy `/wc.dll?mod~method~args` URLs** for not-yet-migrated links return a pointer locally; in production HAProxy routes `/wc.dll` to the legacy app (the strangler pattern). Don't break these links — keep them pointing at `/wc.dll?...` until the target is migrated.
- **Templating:** EJS for converted `.wc` pages (its `<%= %>`/`<% %>` matches West Wind). Mustache is available for brand-new views.
- **Static assets:** mixed-case legacy paths (`/ZZ/...` vs `/zz/...`) 404 on Linux (case-sensitive) — normalize to lowercase during conversion.
- **Auth:** passwords in `arn.USERS` are plaintext; we reproduce that for parity (Phase 2 → bcrypt). Never log passwords.
- **Sessions** are in-memory — run a **single** PM2 instance until a shared session store (SQL Server/Redis) is added.

## 6. Branching, PRs, secrets

- Work on a feature branch; open a PR; keep `npm test` green.
- **Never commit secrets.** `.env` is gitignored. Do **not** add production certificates/keys (e.g. `*.pfx` other than the localhost dev cert) to the repo.
- Update `MIGRATION_STATUS.md` in the same PR as the endpoint you migrate.

## 7. Handy commands

```bash
npm start            # run (reads .env)
npm run dev          # run with auto-reload
npm test             # smoke suite
npm run catalog      # regenerate the endpoint backlog from ../wmove/PRGS-736
```

## 8. Reference

- [`wmove-foxpro-to-nodejs-migration-plan.md`](wmove-foxpro-to-nodejs-migration-plan.md) — overall strategy, architecture, phased roadmap.
- [`MIGRATION_STATUS.md`](MIGRATION_STATUS.md) — live tracker of migrated vs pending endpoints.
- [`README.md`](README.md) — run/HTTPS/HAProxy/deployment details.
- `catalog/wmove-endpoint-catalog.xlsx` — the ~860-endpoint backlog.
