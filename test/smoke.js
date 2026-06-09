'use strict';
// In-process smoke test (no background server). Run: NODE_ENV=production DATA_MODE=demo node test/smoke.js
process.env.DATA_MODE = process.env.DATA_MODE || 'demo';
process.env.NODE_ENV = 'production'; // logger: no worker-thread transport

const http = require('http');
const app = require('../src/app');

const server = app.listen(0);
const base = () => `http://127.0.0.1:${server.address().port}`;

function req(method, path, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? new URLSearchParams(body).toString() : null;
    const u = new URL(base() + path);
    const r = http.request(
      u,
      {
        method,
        headers: {
          ...(data ? { 'content-type': 'application/x-www-form-urlencoded', 'content-length': Buffer.byteLength(data) } : {}),
          ...(cookie ? { cookie } : {}),
        },
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () =>
          resolve({ status: res.statusCode, location: res.headers.location, setCookie: res.headers['set-cookie'], body: b })
        );
      }
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  (cond ? pass++ : fail++);
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`);
}

(async () => {
  try {
    let r = await req('GET', '/healthz');
    check('healthz 200', r.status === 200, r.body);

    r = await req('GET', '/mpest/deleteest');
    check('guarded internal endpoint redirects when logged out', r.status === 302 && r.location === '/mplogin', `status=${r.status}`);

    r = await req('GET', '/mplogin');
    check('login page renders', r.status === 200 && /Sign in to wMove/.test(r.body));

    r = await req('POST', '/mplogin', { body: { username: 'demo', password: 'wrong' } });
    check('bad password 401', r.status === 401);

    r = await req('POST', '/mplogin', { body: { username: 'demo', password: 'demo123' } });
    const cookie = (r.setCookie || []).map((c) => c.split(';')[0]).join('; ');
    check('login success redirects to main menu', r.status === 302 && r.location === '/mamenu/mainmenuwc', `status=${r.status} loc=${r.location}`);

    r = await req('GET', '/me', { cookie });
    let me = {};
    try { me = JSON.parse(r.body); } catch (_) {}
    check('/me returns user with privs', r.status === 200 && me.username === 'demo' && Array.isArray(me.privs), r.body);

    r = await req('GET', '/mpest/deleteest', { cookie });
    check('guarded internal endpoint 501 stub when logged in', r.status === 501 && /MPEST\.deleteest/.test(r.body), `status=${r.status}`);

    r = await req('GET', '/mamenu/mainmenuwc');
    check('main menu requires login', r.status === 302 && r.location === '/mplogin');

    r = await req('GET', '/mamenu/mainmenuwc', { cookie });
    check('main menu renders for logged-in user', r.status === 200 && /Administrator Menu|Main Menu|Salesman Menu/.test(r.body) && /Welcome/.test(r.body), `status=${r.status}`);

    // ── New Estimate flow (selectesttype/selectestret) ──
    r = await req('GET', '/mamenu/selectesttype');
    check('select-estimate requires login', r.status === 302 && r.location === '/mplogin');

    r = await req('GET', '/mamenu/selectesttype', { cookie });
    check('select-estimate page renders types', r.status === 200 && /Select Estimate/.test(r.body) && /Local \/ Long Distance/.test(r.body) && /International/.test(r.body) && /Auto Transport/.test(r.body) && /Booked Job from Broker/.test(r.body));

    r = await req('GET', '/mamenu/selectesttype', { cookie });
    check('select-estimate shows department dropdown', /name="DEPT"/.test(r.body) && /Sales A/.test(r.body));

    r = await req('POST', '/mamenu/selectestret', { cookie, body: { DEPT: 'A' } });
    check('local/LD -> entrywc', r.status === 302 && /\/mpest\/entrywc/.test(r.location || ''), `loc=${r.location}`);

    r = await req('POST', '/mamenu/selectestret/AUTO', { cookie, body: { DEPT: 'A' } });
    check('auto -> entryautowc', r.status === 302 && /\/mpest\/entryautowc/.test(r.location || ''), `loc=${r.location}`);

    r = await req('POST', '/mamenu/selectestret/INT', { cookie, body: { DEPT: 'A' } });
    check('international -> entrywc?module=INT', r.status === 302 && /module=INT/.test(r.location || ''), `loc=${r.location}`);

    // ── Entry form (entrywc, Local/LD) ──
    r = await req('GET', '/mpest/entrywc', { cookie });
    check('entry form renders (Moving From/To)', r.status === 200 && /Moving From/.test(r.body) && /Moving To/.test(r.body) && /Entry Form/.test(r.body) && /Continue to Inventory/.test(r.body), `status=${r.status}`);

    r = await req('GET', '/mpest/entrywc', { cookie });
    check('entry form has referral + move-size options', /How did you hear about us/.test(r.body) && /Returning Customer/.test(r.body) && /2 Bedroom/.test(r.body));

    r = await req('GET', '/mpest/entrywc?module=INT', { cookie });
    check('international entry shows Country + title', /International Entry Form/.test(r.body) && /name="SCOUNTRY"/.test(r.body));

    r = await req('GET', '/mpest/inventory/REF1001/12/0');
    check('public inventory 200 + totals', r.status === 200 && /6 Items 34 Pieces/.test(r.body));

    r = await req('GET', '/mpest/inventory/REF1001/12/110');
    check('inventory signed variant shows signature block', r.status === 200 && /Signature Date/.test(r.body));

    r = await req('GET', '/mpest/ESIGNWC');
    check('public ESIGNWC reachable without login (501 not 302)', r.status === 501, `status=${r.status}`);

    // ── Tenant entry (imported admin.htm flow) ──
    r = await req('GET', '/DEMOPRO/admin.htm');
    check('admin.htm entry -> tenant login', r.status === 302 && /\/mplogin\?co=DEMOPRO/.test(r.location || ''), `loc=${r.location}`);

    r = await req('GET', '/NOSUCHCO/admin.htm');
    check('admin.htm unknown tenant -> legacy error', r.status === 404 && /no estimate file/i.test(r.body));

    r = await req('GET', '/wc.dll?mp~hellonet~DEMOPRO');
    check('legacy wc.dll hellonet -> tenant login', r.status === 302 && /\/mplogin\?co=DEMOPRO/.test(r.location || ''), `loc=${r.location}`);

    r = await req('GET', '/mplogin?co=DEMOPRO');
    check('login page shows company', r.status === 200 && /Company:/.test(r.body) && /DEMOPRO/.test(r.body));

    r = await req('POST', '/mplogin', { body: { username: 'demo', password: 'demo123', company: 'DEMOPRO' } });
    check('tenant login success -> menu', r.status === 302 && r.location === '/mamenu/mainmenuwc', `loc=${r.location}`);

    r = await req('POST', '/mplogin', { body: { username: 'demo', password: 'demo123', company: 'NOSUCHCO' } });
    check('login with bad company -> error', r.status === 401 && /company code was not found/i.test(r.body));

    // ── indexwc (worked example) ──
    r = await req('GET', '/mpest/indexwc/DEMOMOVE/W/ENTRY');
    check('indexwc valid tenant -> redirect to entrywc', r.status === 302 && /\/mpest\/entrywc/.test(r.location || ''), `status=${r.status} loc=${r.location}`);

    r = await req('GET', '/mpest/indexwc/DEMOMOVE');
    check('indexwc resolves main dept when none given', r.status === 302 && /dept=A/.test(r.location || ''), `loc=${r.location}`);

    r = await req('GET', '/mpest/indexwc/NOSUCHCO');
    check('indexwc unknown tenant -> legacy error', r.status === 400 && /no estimate file/i.test(r.body), `status=${r.status}`);

    r = await req('GET', '/mpest/indexwc/DEMOMOVE/W/ENTRYRET');
    check('indexwc ENTRYRET -> entryret', r.status === 302 && /\/mpest\/entryret/.test(r.location || ''), `loc=${r.location}`);

    console.log(`\n${pass} passed, ${fail} failed`);
    server.close(() => process.exit(fail ? 1 : 0));
  } catch (e) {
    console.error('ERROR', e);
    server.close(() => process.exit(1));
  }
})();
