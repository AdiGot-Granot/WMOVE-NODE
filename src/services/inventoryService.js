'use strict';

// Business logic for the inventory document page (legacy: MPEST inventory method).
// Assembles the estimate, the company header, the inventory lines, and totals
// (ITEMS = line count, PCS = sum of quantities) — matching the legacy _T4 cursor.

const estimateRepo = require('../db/repositories/estimateRepo');
const inventoryRepo = require('../db/repositories/inventoryRepo');
const companyRepo = require('../db/repositories/companyRepo');

async function getInventoryDocument(refno) {
  const est = await estimateRepo.getByRefno(refno);
  if (!est) return null;

  const [company, items] = await Promise.all([
    companyRepo.getByCustId(est.CUSTID),
    inventoryRepo.getByJob(est.JOBID),
  ]);

  const totals = items.reduce(
    (acc, it) => {
      acc.items += 1;
      acc.pcs += Number(it.QTY) || 0;
      return acc;
    },
    { items: 0, pcs: 0 }
  );

  return { est, company, items, totals };
}

module.exports = { getInventoryDocument };
