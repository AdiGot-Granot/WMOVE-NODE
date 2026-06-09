'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const app = require('./app');
const config = require('./config');
const log = require('./lib/logger');

function start() {
  const proto = config.https.enabled ? 'https' : 'http';

  let server;
  if (config.https.enabled) {
    // Load the PFX bundle (cert + key), mirroring the noms server_https.js setup.
    const pfxPath = path.resolve(__dirname, '..', config.https.pfxFile);
    try {
      const sslOptions = {
        pfx: fs.readFileSync(pfxPath),
        passphrase: config.https.passphrase,
        rejectUnauthorized: false,
      };
      server = https.createServer(sslOptions, app);
    } catch (err) {
      log.error({ err, pfxPath }, 'Failed to load PFX — cannot start HTTPS. Set PFX_FILE/PFX_PASSWORD or HTTPS_ENABLED=false.');
      process.exit(1);
    }
  } else {
    server = http.createServer(app);
  }

  server.listen(config.port, () => {
    log.info(
      { port: config.port, proto, mode: config.dataMode, env: config.env },
      `nodeWmove listening on ${proto}://localhost:${config.port}  (DATA_MODE=${config.dataMode})`
    );
    if (config.https.enabled && config.port === 6000) {
      log.warn(
        'Port 6000 is flagged UNSAFE by Chrome/Firefox (ERR_UNSAFE_PORT) and will not open in a browser. ' +
          'Use a different port (e.g. PORT=6443) for browser access, or reach it with curl -k.'
      );
    }
  });
}

start();
