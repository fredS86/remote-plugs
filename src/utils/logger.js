'use strict';

const winston = require('winston');
const fs = require('fs');
const logDir = process.env.LOG_DIR || (process.platform === "win32" ? './logs' : '/var/log/RemotePlugs');

//
// Logging levels
//
const config = {
  levels: {
    activite: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  },
  colors: {
    activite: 'grey',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
  }
};

const formatTimestamp = function () {
  // yyyy-MM-dd DD hh:mm:ss.SSS
  let _ndigit = (i, n) => ('00' + String(i)).slice(n ? -n : -2)
  let now = new Date();
  return now.getFullYear() + '-' +
      _ndigit(now.getMonth() + 1) + '-' +
      _ndigit(now.getDate()) + ' ' +
      ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][now.getDay()] + ' ' +
      _ndigit(now.getHours()) + ':' +
      _ndigit(now.getMinutes()) + ':' +
      _ndigit(now.getSeconds()) + '.' +
      _ndigit(now.getMilliseconds(), 3)
      ;
}

const logger = new (winston.Logger)({
  levels: config.levels,
  colors: config.colors,
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      timestamp: formatTimestamp,
      level: 'debug',
      handleExceptions: true,
      humanReadableUnhandledException: true
    }),
    new (winston.transports.File)({
      name: 'activite',
      filename: logDir + '/activite.log',
      json: false,
      timestamp: formatTimestamp,
      level: 'activite'
    }),
    new (winston.transports.File)({
      name: 'full',
      filename: logDir + '/full.log',
      json: false,
      timestamp: formatTimestamp,
      colorize: true,
      level: 'info',
      handleExceptions: true,
      humanReadableUnhandledException: true
    })
  ]

});

// Creation du repertoire pour le logs si besoin
fs.access(logDir, undefined, (err) => {
  if (err) {
    fs.mkdir(logDir, undefined, (err) => {
      if (err) throw err;
      console.log(logDir + ' created');
    });
  }
});

logger.logDir = logDir;
module.exports = logger;
