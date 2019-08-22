var logger = require('../utils/logger');
var wpi = require('../utils/wiring-pi');
var conf = require('./conf');

const ON = wpi.HIGH;
const OFF = wpi.LOW;


exports.all = function() {
//  return conf.plugs().map(function(plug){
//    // MAJ de l'etat de chaque plug
//    return majPlug(plug);
//  });
  return conf.plugs();
}

exports.read = function(id) {
    var plug = conf.getPlug(id)
    // MAJ de l'etat du plug
    if (plug) {
      majPlug(plug);
    }
    return plug;
}

exports.on = function(plug, timeleft){
  logger.debug(timeleft);
  return switchPlug(startPlug, plug, timeleft);
}

exports.off = function(plug){
  return switchPlug(stopPlug, plug);
}

var switchPlug = function(action, plug, timeleft) {
    action(plug, timeleft);
    // MAJ de l'etat du plug
    return majPlug(plug);
}

var majPlug = function (plug) {
    //plug.status = wpi.digitalRead(plug.pin);
    return plug;
}

var startPlug = function (plug, delayParam) {
  logger.activite("Start plug");
  var oldStatus = plug.status;

  if (  typeof plug.timer !== 'undefined' ) {
    clearTimeout(plug.timer);
  }
  var delay = delayParam || plug.delay || conf.getDefaultDelay();
  if ( delay > 0 ) {
    plug.timer = setTimeout(stopPlug, delay, plug);
    logger.activite("Delay :", delay);
    plug.stopTime = Date.now() + delay;
  } else {
    plug.stopTime = -1;
  }
  //wpi.digitalWrite(plug.pin, ON);
  wpi.pinMode(plug.pin, wpi.OUTPUT); 
  plug.status = ON;
  if (oldStatus != ON) {
    plug.changeTime = Date.now();
  }
}

var stopPlug = function (plug) {
  logger.activite("Stop plug");
  var oldStatus = plug.status;
  //wpi.digitalWrite(plug.pin, OFF);
  wpi.pinMode(plug.pin, wpi.INPUT);
  plug.status=OFF;
  if (  typeof plug.timer !== 'undefined' ) {
    clearTimeout(plug.timer);
  }
  if (oldStatus != OFF) {
    plug.changeTime = Date.now();
  }
}
