'use strict';

// Builds the migration backlog by scanning the legacy VFP process classes
// (MP*/MA*.PRG) for endpoint methods (FUNCTION / PROCEDURE) and emitting CSV.
//
//   node scripts/build-endpoint-catalog.js [SOURCE_DIR] [OUT_CSV]
//
// Default SOURCE_DIR points at the authoritative snapshot (PRGS-736) in the
// sibling legacy repo. Output is consumed by the xlsx catalog.

const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] || path.join(__dirname, '..', '..', 'wmove', 'PRGS-736');
const OUT = process.argv[3] || path.join(__dirname, '..', 'catalog', 'endpoint-catalog.csv');

const MODULE_DOMAIN = {
  MPLOGIN: 'Auth / login', MPMENU: 'Menu / navigation', MPLEADS: 'Leads',
  MPEST: 'Estimates', MPINV: 'Inventory', MPOPR: 'Operations / jobs',
  MPCHARGE: 'Billing / card & e-check', MPSTG: 'Storage', MPAGENT: 'Agents',
  MPDIR: 'Directory / distance', MPUTIL: 'Utilities / config', MPADMIN: 'Admin',
  MPMAINTEN: 'Maintenance', MPREP: 'Reports', MPAUTO: 'Auto transport', MPXML: 'XML / API',
};

function moduleOf(file) {
  const base = path.basename(file).replace(/\s*\(\d+\)/, '').replace(/\.PRG$/i, '').toUpperCase();
  return base;
}

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const rows = [];
  const re = /^\s*(FUNCTION|PROCEDURE)\s+([A-Za-z_]\w*)/i;
  lines.forEach((line, i) => {
    const m = line.match(re);
    if (m) {
      rows.push({ kind: m[1].toUpperCase(), method: m[2], line: i + 1 });
    }
  });
  return rows;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Source dir not found:', SRC);
    process.exit(1);
  }
  const files = fs
    .readdirSync(SRC)
    .filter((f) => /^M[PA].*\.PRG$/i.test(f) && !/\(\d+\)/.test(f));

  const out = [['module', 'domain', 'method', 'kind', 'sourceFile', 'line', 'status', 'priority', 'notes']];
  let total = 0;
  for (const f of files) {
    const mod = moduleOf(f);
    const domain = MODULE_DOMAIN[mod] || '';
    for (const r of scanFile(path.join(SRC, f))) {
      out.push([mod, domain, r.method, r.kind, f, r.line, 'todo', '', '']);
      total++;
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    out.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  );
  console.log(`Wrote ${total} endpoints from ${files.length} modules -> ${OUT}`);
}

main();
