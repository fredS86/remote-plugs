var CONF_FILE = '../conf/server.json';

var logger = require('../utils/logger');
var wpi = require('../utils/wiring-pi');
var fs = require('fs');
var conf = require(CONF_FILE);
var confFile = __dirname + '/' + CONF_FILE;

const OFF = wpi.LOW;
var initPlug = exports.init = function(plug){
  wpi.pinMode(plug.pin, wpi.OUTPUT);
  wpi.digitalWrite(plug.pin, OFF);
  plug.changeTime = Date.now();
};


var plugs = conf.plugs;
logger.debug(plugs);

// initialise GPIO
wpi.setup('wpi');
//wiringPiSetup();

// Initialise toutes les prises.
plugs.forEach(initPlug);

exports.plugs = function() {
  return plugs;
}

exports.getPlug = function(id) {
    return plugs.find(function(p) {
      return p.id === id;
    })
}

exports.setPlug=function(plug) {
    //remove plug.id from collection et si il n'y etait pas l'initialiser
    if (!removePlug(plug.id)) {
      initPlug(plug)
    }
    plugs.push(plug);
    saveConf();
}

exports.removePlug = function (id) {
  removePlugs(id);
  saveconf();
}

exports.getDefaultDelay = function() {
  return conf.delay;
}

exports.setDefaultDelay = function(delay) {
  conf.delay = delay;
  saveConf();
}

var removePlug = function (id) {
  var oldPlugs = plugs;
  conf.plugs = plugs = plugs.filter(function(plug) {
    //TODO eteindre le plug
    return id !== plug.id;
  });
  return oldPlugs.length !== plugs.length;
}

var saveConf = function() {
  fs.writeFileSync(confFile, JSON.stringify(conf));
}
