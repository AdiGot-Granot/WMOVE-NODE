'use strict';
// In-process HTTPS check: loads the PFX, serves the app over TLS on PORT, hits it.
process.env.DATA_MODE = 'demo';
process.env.NODE_ENV = 'production';
process.env.HTTPS_ENABLED = 'true';

const fs = require('fs');
const path = require('path');
const https = require('https');
const config = require('../src/config');
const app = require('../src/app');

const pfx = fs.readFileSync(path.resolve(__dirname, '..', config.https.pfxFile));
const server = https.createServer({ pfx, passphrase: config.https.passphrase, rejectUnauthorized: false }, app);

function get(p) {
  return new Promise((res, rej) => {
    https
      .get({ host: '127.0.0.1', port: server.address().port, path: p, rejectUnauthorized: false }, (r) => {
        let b = '';
        r.on('data', (c) => (b += c));
        r.on('end', () => res({ status: r.statusCode, location: r.headers.location, body: b }));
      })
      .on('error', rej);
  });
}

server.listen(6000, async () => {
  let pass = 0, fail = 0;
  const check = (n, c, x = '') => { (c ? pass++ : fail++); console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`); };
  try {
    check('TLS port = 6000', server.address().port === 6000);
    let r = await get('/healthz');
    check('https /healthz 200', r.status === 200, r.body);
    r = await get('/mpest/indexwc/DEMOMOVE/W/ENTRY');
    check('https indexwc 302 redirect', r.status === 302 && /entrywc/.test(r.location || ''), `status=${r.status}`);
    r = await get('/mpest/inventory/REF1001/12/0');
    check('https inventory 200', r.status === 200 && /6 Items 34 Pieces/.test(r.body));
    console.log(`\n${pass} passed, ${fail} failed`);
    server.close(() => process.exit(fail ? 1 : 0));
  } catch (e) { console.error('ERR', e.message); server.close(() => process.exit(1)); }
});
