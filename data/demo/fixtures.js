'use strict';

// Demo fixtures so the app runs with DATA_MODE=demo and NO database.
// Shapes mirror the GMOVE columns the inventory page uses.

module.exports = {
  // Demo users only — fake credentials, NOT real accounts. Plaintext here
  // mirrors the legacy schema for the demo path; never put real passwords here.
  users: [
    {
      userid: 1,
      custid: 12,
      username: 'demo',
      password: 'demo123',
      firstname: 'Demo',
      lastname: 'User',
      levelid: 2,
      posid: 1,
      dept: '',
      viewall: true,
      estimator: true,
      email: 'demo@example.com',
      privs: ['EST', 'INV', 'OPR', 'REP'],
    },
  ],

  companies: [
    {
      CUSTID: 12,
      CUSTNO: 'DEMOPRO',
      NAME: 'Demo Pro Movers',
      ADD1: '1234 Moving Way',
      ADD2: 'Dallas, TX 75201',
      TOLLFREE: '1-800-555-0142',
      DOT: '1234567',
      ICC: '987654',
      ACTIVE: true,
      COLEVEL: 4,
      CFRATIO: 7,
      CALCCF: true,
      VZTARIFF: false,
      VZOTHERS: false,
    },
    {
      CUSTID: 12,
      CUSTNO: 'DEMOMOVE',
      NAME: 'Top Nation Relocation',
      ADD1: '1234 Moving Way',
      ADD2: 'Dallas, TX 75201',
      TOLLFREE: '1-800-555-0142',
      DOT: '1234567',
      ICC: '987654',
      // bootstrap (indexwc) fields
      ACTIVE: true,
      COLEVEL: 2,
      CFRATIO: 7,
      CALCCF: true,
      VZTARIFF: false,
      VZOTHERS: false,
    },
  ],

  departments: [
    { CUSTID: 12, DEPT: 'A', DEPTID: 100, GRP: 1, DEPTNAME: 'Sales A' },
    { CUSTID: 12, DEPT: 'B', DEPTID: 101, GRP: 1, DEPTNAME: 'Sales B' },
  ],

  // Active main tariff exists for the demo tenant (enables the Broker option).
  tariffActive: true,

  // Referral sources ("How did you hear about us?") and move-size options.
  referrals: [{ RNAME: 'Google' }, { RNAME: 'Referral' }, { RNAME: 'Returning Customer' }, { RNAME: 'Yelp' }],
  moveSizes: [
    { MOVESIZEID: 1, ROOMDESC: 'Studio' },
    { MOVESIZEID: 2, ROOMDESC: '1 Bedroom' },
    { MOVESIZEID: 3, ROOMDESC: '2 Bedroom' },
    { MOVESIZEID: 4, ROOMDESC: '3 Bedroom' },
    { MOVESIZEID: 5, ROOMDESC: '4 Bedroom' },
  ],

  restIp: [
    // Example block rule; the demo client IP won't match it.
    { CUSTID: 12, IP: '203.0.113.50', BLKIPSEQ: false },
  ],

  estimates: [
    {
      ORDNO: '100482',
      REFNO: 'REF1001',
      JOBID: 5001,
      CUSTID: 12,
      SNAME: 'John Q Customer',
      LBOOKDTE: '2026-07-15T00:00:00',
    },
  ],

  inventory: [
    { JOBID: 5001, ITEM: 'Sofa, 3-seat', QTY: 1, BULKY: 1, NEEDPACK: 0, ROOMCODE: 'LR' },
    { JOBID: 5001, ITEM: 'Dining Table', QTY: 1, BULKY: 1, NEEDPACK: 0, ROOMCODE: 'DR' },
    { JOBID: 5001, ITEM: 'Dining Chairs', QTY: 6, BULKY: 0, NEEDPACK: 0, ROOMCODE: 'DR' },
    { JOBID: 5001, ITEM: 'Mattress, Queen', QTY: 1, BULKY: 1, NEEDPACK: 1, ROOMCODE: 'BR1' },
    { JOBID: 5001, ITEM: 'Boxes, Medium', QTY: 24, BULKY: 0, NEEDPACK: 1, ROOMCODE: 'KIT' },
    { JOBID: 5001, ITEM: 'TV, 55in', QTY: 1, BULKY: 0, NEEDPACK: 1, ROOMCODE: 'LR' },
  ],
};
