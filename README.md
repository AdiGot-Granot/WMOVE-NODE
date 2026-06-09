# nodeWmove

Node.js (Express) rewrite of the wMove application — currently Visual FoxPro 9 + West Wind Web Connection over SQL Server (`GMOVE`).

**Phase 1 goal:** behavior-preserving migration. Same pages, same URLs, same database. Users see no difference. See `wmove-foxpro-to-nodejs-migration-plan.md` for the full plan.

## Quick start (no database needed)

```bash
npm install
cp .env.example .env      # DATA_MODE=demo, HTTPS on, PORT=6000
npm start                 # https://localhost:6000
```

### HTTPS

Serves over TLS using a PFX bundle (`certs/localhost.pfx`), same convention as the noms app: `pfx` + `PFX_PASSWORD`. Configure via `HTTPS_ENABLED`, `PFX_FILE`, `PFX_PASSWORD` in `.env`. For production, point `PFX_FILE` at the real cert (e.g. `granot2026.pfx`) and set `PFX_PASSWORD`.

> ⚠️ **Port 6000 is blocked by Chrome/Firefox** (`ERR_UNSAFE_PORT`) and won't open in a browser. It works with `curl -k https://localhost:6000/...`. For browser use, set `PORT=6443` (or any non-restricted port) in `.env`. Set `HTTPS_ENABLED=false` to fall back to plain HTTP.

### Behind HAProxy (production)

The recommended production setup: **HAProxy terminates TLS on :443 and forwards plain HTTP to Node** on an internal port. Node runs HTTP (no PFX), trusts the proxy, and sends secure cookies.

```bash
cp .env.haproxy.example .env     # HTTPS_ENABLED=false, PORT=8080, TRUST_PROXY, SECURE_COOKIES=true
pm2 start ecosystem.config.js    # or: node src/server.js
```

HAProxy config is in `ops/haproxy.cfg`. It terminates TLS, sets `X-Forwarded-For`/`X-Forwarded-Proto`, and does **strangler routing** — migrated paths go to Node, everything else to the legacy app. Add a path prefix to its `acl migrated` line each time you migrate a module.

HAProxy needs the cert as a single PEM (not PFX). Convert once:

```bash
openssl pkcs12 -in granot2026.pfx -nodes -out /etc/haproxy/certs/granot2026.pem
```

In this mode the port-6000 browser warning is irrelevant: users hit HAProxy on 443; Node is internal-only. The app sets `trust proxy` so `req.ip` (used by the `indexwc` IP check) and `secure` cookies work correctly through the proxy.


Open the proof-of-concept page:

- `/mpest/inventory/REF1001/12/0` — inventory document (sign view)
- `/mpest/inventory/REF1001/12/110` — signed/printer-friendly variant

`DATA_MODE=demo` serves built-in fixtures (`data/demo/`). Set `DATA_MODE=db` and fill the `DB_*` vars in `.env` to run against live `GMOVE`.

## Architecture

```
Browser → (nginx strangler proxy, ops/nginx.wmove.conf)
            ├─ migrated routes → this Express app
            └─ everything else → legacy wc.dll / VFP
Express:  routes/ → controllers/ (one per MP* module)
          → services/ (business logic) → db/repositories/ (mssql or fixtures)
          → views/ (EJS = converted .wc pages; Mustache for new views)
```

Layout:

| Path | Purpose |
| --- | --- |
| `src/app.js`, `src/server.js` | Express setup + entry point |
| `src/config/` | env config (replaces `WM.INI`) |
| `src/db/pool.js` | mssql connection pool (+ `execProc` for reused sprocs) |
| `src/db/repositories/` | data access, one area per schema/module |
| `src/services/` | business logic ported from `MP*` methods |
| `src/controllers/` | one file per `MP*` module, method per endpoint |
| `src/routes/` | legacy-compatible URLs |
| `src/views/` | converted pages (`.ejs`) |
| `src/lib/foxpro.js` | helpers reproducing FoxPro expression semantics (`IIF`, `ALLTRIM`, `EMPTY`, …) |
| `public/` | new node-specific static assets |
| `web/` | the legacy `D:\web` front-end tree, bundled so a clone is **standalone** (served as a static root; `/zz/...` resolves here) |
| `scripts/build-endpoint-catalog.js` | regenerate the migration backlog from legacy source |

## Front-end assets (standalone)

The legacy `D:\web` tree is bundled into `web/` (≈14 MB, 989 files) so cloning this repo is self-contained — no dependency on the sibling `wmove` repo at runtime. It's served as a static root, so absolute paths like `/zz/js/...` and `/zz/images/...` resolve directly. Override the location with `WEB_ASSET_DIR` if you serve it from disk (nginx/IIS) in production.

Two portability notes carried over from the Windows original:

- A few pages reference assets with **mixed case** (`/ZZ/IMAGES/...` vs `/zz/images/...`). Windows is case-insensitive; Linux is not, so those specific refs 404 until normalized. Track this during page conversion.
- A couple of refs point outside the tree (e.g. `/granot/mystyle.css`); add those assets or rewrite the paths as you migrate the affected pages.

> The `web/` files are the legacy `.wc`/`.htm` **source** for view conversion plus the static JS/CSS/images. As pages are converted to EJS views under `src/views/`, the static assets stay in `web/`; the `.wc` source files can be pruned once their page is migrated.

## Authentication (MPLOGIN)

- `GET /mplogin` — sign-in form; `POST /mplogin` — validate; `GET /mplogin/logout`.
- Validates against `arn.USERS` (active, non-deleted), scoped by tenant `custid`, and loads privilege codes from `inf.USERSPRIV` → `inf.PRIVLGS` into `req.user`.
- Route guards: `requireUser` (logged in) and `requirePriv(code)` in `src/middleware/auth.js`.
- Internal MPEST endpoints require login; customer-facing document pages (e-sign links) are token-authenticated by URL and stay public — matching legacy behavior.
- Demo login: `demo` / `demo123` (demo mode).

> ⚠️ **Security:** the legacy `arn.USERS.password` column is **plaintext**. `authService.js` reproduces that comparison for Phase 1 parity only. Phase 2 must move to hashed passwords (bcrypt) with transparent re-hash on next login. Passwords are never logged.

## Tests

```bash
npm test     # in-process smoke test: auth flow, route guards, POC page
```

## Proof of concept: inventory document

The legacy page `WEB/DEMOMOVE/DOCS/inventory.wc` (rendered by `MPEST` via `Response.ExpandScript`) was converted as the reference example:

- Markup is preserved verbatim; only embedded FoxPro expressions were translated.
  - `<%=pcCOMPANY%>` → `<%= company.NAME %>`
  - `<%=IIF(BULKY=1,'✓','')%>` → `<%- fox.isTrue(it.BULKY) ? fox.CHECK : '' %>`
  - `ALLT/LEFT/AT` name logic → `fox.firstName(est.SNAME)`
  - `<%SELECT … INTO CURSOR%>` data prep → moved to `services/inventoryService.js`
- Data comes from `job.EST`, `job.INV`, and the tenant company profile.

This establishes the pattern (route → controller → service → repository → EJS view) for migrating the remaining modules.

## Endpoint catalog (migration backlog)

```bash
npm run catalog     # scans ../wmove/PRGS-736 for MP*/MA* endpoints → catalog/endpoint-catalog.csv
```

## Conventions for migrating a module

1. List the module's endpoints from the catalog.
2. For each: add a controller method, port logic into a service, add a repository call (reuse the GMOVE sproc where one exists), convert the `.wc`/`Response.Write` output to an EJS view.
3. Verify parity against the legacy page (golden-page diff), then enable its route in `ops/nginx.wmove.conf`.
