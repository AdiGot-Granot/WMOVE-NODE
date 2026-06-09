'use strict';

const path = require('path');
const express = require('express');
const session = require('express-session');
const compression = require('compression');
const mustacheExpress = require('mustache-express');
const pinoHttp = require('pino-http');

const config = require('./config');
const log = require('./lib/logger');
const foxpro = require('./lib/foxpro');
const attachSession = require('./middleware/session');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── View engines ─────────────────────────────────────────────────────────
// EJS for converted West Wind scripted pages (.wc `<%= %>` maps 1:1).
// Mustache available for new, logic-less views.
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', require('ejs').__express);
app.engine('mustache', mustacheExpress());
app.set('view engine', 'ejs');

// FoxPro helpers available to every EJS view as `fox`.
app.locals.fox = foxpro;

// Behind HAProxy/nginx, trust the proxy so req.ip and req.protocol reflect the
// real client (X-Forwarded-For / X-Forwarded-Proto) instead of the proxy's.
// Needed for the indexwc IP-restriction check and for secure cookies.
app.set('trust proxy', config.trustProxy);

// ─── Core middleware ──────────────────────────────────────────────────────
app.use(pinoHttp({ logger: log }));
app.use(compression());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    name: config.session.cookieName,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    // secure:true when TLS terminates at the proxy (set SECURE_COOKIES=true);
    // trust proxy lets express detect the original https scheme.
    cookie: { httpOnly: true, sameSite: 'lax', secure: config.session.secureCookie },
  })
);
app.use(attachSession);

// ─── Static assets ─────────────────────────────────────────────────────────
// public/ : new node-specific assets.
// web/    : the legacy D:\web tree (copied into this repo so a clone is
//           standalone). Asset paths like /zz/js, /zz/images resolve from here.
// In production nginx/IIS may serve web/ directly; we serve it here for parity.
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.resolve(__dirname, '..', config.webAssetDir)));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/', routes);

// ─── Errors ────────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
