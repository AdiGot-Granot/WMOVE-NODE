'use strict';

// Estimate (job.EST) data access.
// IMPORTANT: the SQL schema is normalized vs the legacy FoxPro EST.DBF:
//   ORDNO  -> JOBID        TYPE   -> JOBTYPE
//   STATUS -> JOBSTATUS    DEPT   -> DEPTID (code via cst.DEPARTMENT)
// We alias back to the legacy names the templates expect.

const config = require('../../config');
const demo = require('../../../data/demo/fixtures');

const SELECT_COLS = `
  E.JOBID AS ORDNO, E.JOBID, E.REFNO, E.CUSTID, E.JOBTYPE AS TYPE, E.JOBSTATUS AS STATUS,
  E.DEPTID, D.DEPT, E.REF, E.RC, E.SNAME, E.SADD1, E.SADD2, E.SAPT, E.SCITY, E.SSTATE,
  E.SZIP, E.SLEVEL, E.SSUBLEVEL, E.SFLOOR, E.SCOUNTRY, E.STELH, E.STELO, E.SFAX, E.SPROXY,
  E.RNAME, E.RADD1, E.RADD2, E.RAPT, E.RCITY, E.RSTATE, E.RZIP, E.RLEVEL, E.RSUBLEVEL,
  E.RFLOOR, E.RCOUNTRY, E.RTELH, E.RTELO, E.RPROXY, E.EMAIL, E.LBOOKDTE, E.LBOOKTME,
  E.LBOOKC, E.FUDTE AS NEXTFU, E.FUTME, E.ONLINE, E.LEADS, E.CONSENT`;

// Used by the inventory page (kept minimal).
async function getByRefno(refno) {
  if (config.isDemo) {
    return demo.estimates.find((e) => String(e.REFNO).trim() === String(refno).trim()) || null;
  }
  const { query, sql } = require('../pool');
  const rows = await query(
    `SELECT TOP 1 E.JOBID AS ORDNO, E.JOBID, E.REFNO, E.CUSTID, E.SNAME, E.LBOOKDTE
       FROM job.EST E WHERE E.REFNO = @refno`,
    { refno: { type: sql.VarChar, value: String(refno) } }
  );
  return rows[0] || null;
}

// Full record for the entry form.
async function getEntryByRefno(refno) {
  if (config.isDemo) {
    return demo.estimates.find((e) => String(e.REFNO).trim() === String(refno).trim()) || null;
  }
  const { query, sql } = require('../pool');
  const rows = await query(
    `SELECT TOP 1 ${SELECT_COLS}
       FROM job.EST E LEFT JOIN cst.DEPARTMENT D ON D.DEPTID = E.DEPTID
      WHERE E.REFNO = @refno`,
    { refno: { type: sql.VarChar, value: String(refno) } }
  );
  return rows[0] || null;
}

// Create a new (blank) estimate for the entry form.
//   demo  -> in-memory record (no DB)
//   db    -> reuses cst.NextJobNo + inserts job.EST, but ONLY when
//            config.estimateWrites is enabled. Returns { disabled:true } otherwise.
async function createEntry({ custId, dept, deptId, type, user, broker }) {
  if (config.isDemo) {
    const refno = 'NEW' + Math.random().toString(36).slice(2, 9).toUpperCase();
    const est = {
      ORDNO: '_NEW', JOBID: 0, REFNO: refno, CUSTID: custId, TYPE: type || ' ',
      STATUS: 'F', DEPTID: deptId, DEPT: dept, RC: 'R', REF: '', ONLINE: false,
      SNAME: '', SADD1: '', SADD2: '', SAPT: '', SCITY: '', SSTATE: '', SZIP: '',
      SLEVEL: '', SSUBLEVEL: '', SFLOOR: '', SCOUNTRY: '', STELH: '', STELO: '',
      SFAX: '', SPROXY: '', RNAME: '', RADD1: '', RADD2: '', RAPT: '', RCITY: '',
      RSTATE: '', RZIP: '', RLEVEL: '', RSUBLEVEL: '', RFLOOR: '', RCOUNTRY: '',
      RTELH: '', RTELO: '', RPROXY: '', EMAIL: '', LBOOKDTE: null, LBOOKTME: '',
      FUTME: '', NEXTFU: null,
    };
    demo.estimates.push(est);
    return est;
  }

  // ── DB mode: guarded write ──
  if (!config.estimateWrites) return { disabled: true };

  // Reuses the existing cst.NextJobNo proc to mint a JOBID (it also creates the
  // cst.JOBS row), then inserts a minimal job.EST row. Proc contract verified on
  // DEMOPRO: OUTPUT params @JOBID, @NEXTJOBNO, @MSG.
  const { sql, getPool } = require('../pool');
  const pool = await getPool();

  const np = pool.request();
  np.input('CUSTID', sql.SmallInt, Number(custId));
  np.input('OPENUSERID', sql.Int, Number(user.userid) || 0);
  np.input('JOBSOURCE', sql.VarChar(20), 'WMOVE');
  np.output('JOBID', sql.Int);
  np.output('NEXTJOBNO', sql.Int);
  np.output('MSG', sql.VarChar(200));
  const npRes = await np.execute('cst.NextJobNo');
  const jobId = npRes.output.JOBID;
  if (!jobId) throw new Error(`cst.NextJobNo failed: ${npRes.output.MSG || 'no JOBID returned'}`);

  const refno = require('../../lib/refno').generate();
  const ins = pool.request();
  ins.input('jobId', sql.Int, jobId);
  ins.input('custId', sql.SmallInt, Number(custId));
  ins.input('refno', sql.VarChar(40), refno);
  ins.input('deptId', sql.Int, Number(deptId) || 0);
  ins.input('type', sql.Char(1), type || ' ');
  ins.input('vzid', sql.Int, broker ? 999 : 0);
  ins.input('userId', sql.Int, Number(user.userid) || 0);
  await ins.query(
    `INSERT INTO job.EST (JOBID,CUSTID,REFNO,JOBTYPE,JOBSTATUS,DEPTID,RC,ONLINE,
                          CALCCF,OPENDTE,ADDDTE,ADDUSERID,VZID)
     VALUES (@jobId,@custId,@refno,@type,'F',@deptId,'R',0,1,GETDATE(),GETDATE(),@userId,@vzid)`
  );
  return getEntryByRefno(refno);
}

module.exports = { getByRefno, getEntryByRefno, createEntry };
