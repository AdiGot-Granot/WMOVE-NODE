'use strict';

// Helpers that reproduce the Visual FoxPro expression semantics used in the
// legacy .wc scripted pages, so converted EJS views stay faithful to the
// original output. Keep these tiny and well-tested — many pages depend on them.

// ALLTRIM(x) — trim both ends; FoxPro treats null/empty as ''.
function allt(x) {
  return (x == null ? '' : String(x)).trim();
}

// EMPTY(x) — true for '', null, undefined, 0, whitespace-only strings.
function empty(x) {
  if (x == null) return true;
  if (typeof x === 'number') return x === 0;
  return String(x).trim() === '';
}

// IIF(cond, a, b) — FoxPro inline if.
function iif(cond, a, b) {
  return cond ? a : b;
}

// First name: ALLT(LEFT(ALLTRIM(name), AT(' ', name) )) — text up to the first space.
function firstName(name) {
  const n = allt(name);
  const i = n.indexOf(' ');
  return i > 0 ? n.slice(0, i) : n;
}

// FoxPro logical/tinyint truthiness (1 / true / 'T').
function isTrue(v) {
  return v === 1 || v === true || v === 'T' || v === 't';
}

// Date formatting roughly matching the legacy short date shown on documents.
function fmtDate(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return String(d);
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

const CHECK = '&#10003;'; // ✓ entity used by the legacy inventory page

module.exports = { allt, empty, iif, firstName, isTrue, fmtDate, CHECK };
