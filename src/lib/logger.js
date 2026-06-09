'use strict';

const pino = require('pino');
const config = require('../config');

module.exports = pino({
  level: config.env === 'production' ? 'info' : 'debug',
  transport:
    config.env === 'production'
      ? undefined
      : { target: 'pino/file', options: { destination: 1 } },
});
