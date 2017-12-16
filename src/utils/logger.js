'use strict';

var winston = require('winston');
var moment = require('moment');
var fs = require('fs');

var logDir = '/var/log/RemotePlugs';
//logDir = './logs';

//
// Logging levels
//
var config = {
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

var formatTimestamp = function () {
   return moment().format('YYYY-MM-DD ddd hh:mm:ss:SSS');
}

var logger = new (winston.Logger)({
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