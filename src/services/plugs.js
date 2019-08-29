var logger = require('../utils/logger');
var wpi = require('wpi-gpio');
var conf = require('./conf');

const ON = 1;
const OFF = 0;


exports.all = function() {
  return Promise.all(conf.plugs().map(majPlug));
}

exports.read = function(id) {
    var plug = conf.getPlug(id)
    // MAJ de l'etat du plug
    return plug ? majPlug(plug) : Promise.resolve(plug);
}

exports.on = function(plug, timeleft){
  logger.debug(timeleft);
  return switchPlug(startPlug, plug, timeleft);
}

exports.off = function(plug){
  return switchPlug(stopPlug, plug);
}

var timeoutCallback;
exports.timeoutCallback = function(callback) {
  timeoutCallback = callback;
}

var switchPlug = function(action, plug, timeleft) {
    // on realise l'action et on MAJ l'etat du plug
    return action(plug, timeleft).then(majPlug);
}

var majPlug = async function (plug) {
    //plug.status = await wpi.read(plug.pin);
    return plug;
}

var startPlug = async function (plug, delayParam) {
  logger.activite("Start plug");
  var oldStatus = plug.status;

  if (  typeof plug.timer !== 'undefined' ) {
    clearTimeout(plug.timer);
  }
  var delay = delayParam || plug.delay || (plug.type === 'timer' && conf.getDefaultDelay());
  if ( delay > 0 ) {
    plug.timer = setTimeout(stopPlug, delay, plug, true);
    logger.activite("Delay :", delay);
    plug.stopTime = Date.now() + delay;
  } else {
    plug.stopTime = -1;
  }
  //await wpi.write(plug.pin, ON);
  await wpi.output(plug.pin); 
  plug.status = ON;
  if (oldStatus != ON) {
    plug.changeTime = Date.now();
  }

  return plug;
}

var stopPlug = async function (plug, timeout) {
  logger.activite("Stop plug");
  var oldStatus = plug.status;
  //await wpi.write(plug.pin, OFF);
  await wpi.input(plug.pin);
  plug.status=OFF;
  if (  typeof plug.timer !== 'undefined' ) {
    clearTimeout(plug.timer);
  }
  if (oldStatus != OFF) {
    plug.changeTime = Date.now();
  }

  if (timeout && timeoutCallback && typeof timeoutCallback === 'function') {
    timeoutCallback(plug);
  }
  
  return plug;
}
