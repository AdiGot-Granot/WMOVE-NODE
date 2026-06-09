'use strict';

require('dotenv').config();

const bool = (v, def = false) =>
  v == null ? def : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '6000', 10),

  // HTTPS via a PFX bundle (same convention as the noms app: pfx + PFX_PASSWORD).
  https: {
    enabled: bool(process.env.HTTPS_ENABLED, true),
    pfxFile: process.env.PFX_FILE || './certs/localhost.pfx',
    passphrase: process.env.PFX_PASSWORD || '',
  },

  // 'demo' = run from fixtures with no DB; 'db' = live SQL Server.
  dataMode: (process.env.DATA_MODE || 'demo').toLowerCase(),

  // Safety gate for data-mutating endpoints (e.g. creating estimates). Off by
  // default so a deploy never writes to the production DB until verified.
  estimateWrites: bool(process.env.ESTIMATE_WRITES, false),

  db: {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_DATABASE || 'GMOVE',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    options: {
      encrypt: bool(process.env.DB_ENCRYPT, false),
      trustServerCertificate: bool(process.env.DB_TRUST_SERVER_CERT, true),
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      min: parseInt(process.env.DB_POOL_MIN || '0', 10),
      idleTimeoutMillis: 30000,
    },
  },

  // Proxy trust for X-Forwarded-* headers (HAProxy/nginx). Default: loopback +
  // private ranges. Set TRUST_PROXY=1 to trust one hop, or a CIDR list.
  trustProxy: process.env.TRUST_PROXY || 'loopback, linklocal, uniquelocal',

  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret',
    cookieName: process.env.SESSION_COOKIE_NAME || 'wwWebSessionId',
    secureCookie: bool(process.env.SECURE_COOKIES, false),
  },

  webAssetDir: process.env.WEB_ASSET_DIR || './web',
};

config.isDemo = config.dataMode === 'demo';

module.exports = config;
