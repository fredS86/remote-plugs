const logger = require('../utils/logger');
const fs = require('fs');
const confFile = fs.realpathSync(process.env.CONF_FILE || __dirname + '/../conf/server.json');
logger.debug('Using conf : ' + confFile);
const conf = require(confFile);

var wpi = require('wpi-gpio');

var initPlug = exports.init = async function(plug){
  //await wpi.output(plug.pin, 0);
  await wpi.input(plug.pin);
  await wpi.write(plug.pin, 0);
  plug.status = 0;
  plug.changeTime = Date.now();
};


var plugs = conf.plugs;
logger.debug(plugs);

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
