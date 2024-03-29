const logger = require('../utils/logger');
const fs = require('fs');
const confFile = fs.realpathSync(process.env.CONF_FILE || __dirname + '/../conf/server.json');
logger.debug('Using conf : ' + confFile);
const conf = require(confFile);

const gpio = require('./gpio')

logger.debug(conf);

// Initialise every active plug
conf.plugs.filter(plug => !plug.disabled).forEach(gpio.init);

exports.listPlugs = function() {
    return conf.plugs;
}

exports.getPlug = function(id) {
    return conf.plugs.find(p => p.id === id);
}

exports.setPlug=function(plug) {
    removePlug(plug.id);
    plug.disabled || gpio.init(plug);
    conf.plugs.push(plug);
    saveConf();
}

exports.removePlug = function (id) {
    let removed = removePlug(id);
    saveConf();
    return removed;
}

const removePlug = function (id) {
    const oldPlugs = conf.plugs;
    conf.plugs.find((plug) =>  id === plug.id).forEach(gpio.disconnect)
    conf.plugs = conf.plugs.filter((plug) =>  id !== plug.id);
    return oldPlugs.length !== conf.plugs.length;
}

exports.listWebcams = function() {
    return conf.webcams;
}

exports.getWebcam = function(id) {
    return conf.webcams.find(p => p.id === id);
}

exports.setWebcam=function(webcam) {
    removeWebcam(webcam.id);
    conf.webcams.push(webcam);
    saveConf();
}

exports.removeWebcam = function (id) {
    let removed = removeWebcam(id);
    saveConf();
    return removed;
}

const removeWebcam = function (id) {
    const oldWebcams = conf.webcams;
    conf.webcams = conf.webcams.filter((webcam) =>  id !== webcam.id);
    return oldWebcams.length !== conf.webcams.length;
}

exports.getDefaultDelay = function() {
    return conf.delay;
}

exports.setDefaultDelay = function(delay) {
    conf.delay = delay;
    saveConf();
}

const saveConf = function() {
    fs.writeFileSync(confFile, JSON.stringify(conf));
}
