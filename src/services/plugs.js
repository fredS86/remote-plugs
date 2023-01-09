const logger = require('../utils/logger');
const gpio = require('./gpio');
const conf = require('./conf');

const ON = 1;
const OFF = 0;


exports.all = function() {
  return Promise.all(gpio.plugs().map(majPlug));
}

exports.read = function(id) {
    var plug = gpio.plugs().find(plug => plug.conf.id === id)
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

const switchPlug = function(action, plug, timeleft) {
    // on realise l'action et on MAJ l'etat du plug
    return action(plug, timeleft).then(majPlug);
}

const majPlug = async function (plug) {
    //plug.status = await wpi.read(plug.pin);
    return plug;
}

const startPlug = async function (plug, delayParam) {
  logger.activite("Start plug");
  var oldStatus = plug.status;

  if (  typeof plug.timer !== 'undefined' ) {
    clearTimeout(plug.timer);
  }
  var delay = delayParam || plug.conf.delay || (plug.conf.type === 'timer' && conf.getDefaultDelay());
  if ( delay > 0 ) {
    plug.timer = setTimeout(stopPlug, delay, plug, true);
    logger.activite("Delay :", delay);
    plug.stopTime = Date.now() + delay;
  } else {
    plug.stopTime = -1;
  }
  await plug.on();
  plug.status = ON;
  if (oldStatus !== ON) {
    plug.changeTime = Date.now();
  }

  return plug;
}

const stopPlug = async function (plug, timeout) {
  logger.activite("Stop plug");
  var oldStatus = plug.status;
  await plug.off();
  plug.status=OFF;
  if (  typeof plug.timer !== 'undefined' ) {
    clearTimeout(plug.timer);
  }
  if (oldStatus !== OFF) {
    plug.changeTime = Date.now();
  }

  if (timeout && timeoutCallback && typeof timeoutCallback === 'function') {
    timeoutCallback(plug);
  }

  return plug;
}
