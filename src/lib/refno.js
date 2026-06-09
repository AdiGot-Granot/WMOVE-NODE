'use strict';

// Reproduces the legacy XNEWREFNO (MPPROC.PRG): a 10-char unique-ish code with
// the ambiguous characters substituted (O -> 5, 0 -> 4). Uniqueness against
// existing REFNOs is enforced by the caller / a unique index.
function generate() {
  const base = (Date.now().toString(36) + Math.random().toString(36).slice(2))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10)
    .padEnd(10, 'X');
  return base.replace(/O/g, '5').replace(/0/g, '4');
}

module.exports = { generate };
