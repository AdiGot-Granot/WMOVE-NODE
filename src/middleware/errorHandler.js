'use strict';

const log = require('../lib/logger');

// 404
function notFound(req, res) {
  res.status(404).type('text/plain').send('Not Found');
}

// Central error handler
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  log.error({ err, url: req.originalUrl }, 'Unhandled error');
  res.status(err.status || 500).type('text/plain').send(
    process.env.NODE_ENV === 'production' ? 'Server Error' : `Server Error: ${err.message}`
  );
}

module.exports = errorHandler;
module.exports.notFound = notFound;
