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

exports.on = function(plug, params){
  logger.debug(JSON.stringify(params));
  return switchPlug(startPlug, plug, params);
}

exports.off = function(plug){
  return switchPlug(stopPlug, plug, {});
}

var timeoutCallback;
exports.timeoutCallback = function(callback) {
  timeoutCallback = callback;
}

const switchPlug = function(action, plug, params) {
    // on realise l'action et on MAJ l'etat du plug
    return action(plug, params).then(majPlug);
}

const majPlug = async function (plug) {
    //plug.status = await wpi.read(plug.pin);
    return plug;
}

const startPlug = async function (plug, {delayParam, action}) {
  logger.activite("Start plug");

  // on met a jour le timer dans tous les cas
  if (  typeof plug.timer !== 'undefined' ) {
    clearTimeout(plug.timer);
  }
  const delay = delayParam || action.delay || plug.conf.delay || (plug.conf.type === 'timer' && conf.getDefaultDelay());
  if ( delay > 0 ) {
    plug.timer = setTimeout(stopPlug, delay, plug, {timeout: true});
    logger.activite("Delay :", delay);
    plug.stopTime = Date.now() + delay;
  } else {
    plug.stopTime = -1;
  }

  // on ne met a jour le gpio que s'il a d'un cgt de status
  const newStatus = action.status || ON;
  if (plug.status !== newStatus) {
    if (plug.status !== OFF) {
      await plug.off();
    }
    await Promise.all(
        (action.pins || [action.pin]).map(actionPin => {
          const pinIdx = (plug.conf.pins || [plug.conf.pin]).findIndex(confPin => actionPin === confPin);
          return plug.pins[pinIdx].on();
        })
    );
    plug.status = newStatus;
    plug.changeTime = Date.now();
  }

  return plug;
}

const stopPlug = async function (plug, {timeout}) {
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
