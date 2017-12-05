var logger = require('../utils/logger');
var wpi = require('../utils/wiring-pi');
var conf = require('../conf/server');

const ON = wpi.HIGH;
const OFF = wpi.LOW;

var plugs = conf.arroseurs;
logger.debug(plugs);
// initialise GPIO
wpi.setup('wpi');
//wiringPiSetup();

// Initialise tous les arroseurs.
plugs.forEach(function(plug){
  wpi.pinMode(plug.pin, wpi.OUTPUT);
  wpi.digitalWrite(plug.pin, OFF);
  plug.changeTime = Date.now();
});


exports.all = function() {
  var results = [];
  plugs.forEach(function(plug){
    // MAJ de l'etat de chaque plug
    majPlug(plug);
  });
  return plugs;
}

exports.read = function(id) {
    var plug = plugs.find(function(p) {
      return p.id === id;
    })
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
    majPlug(plug);
    return plug;
}

var majPlug = function (plug) {
    plug.status = wpi.digitalRead(plug.pin);
}

var startPlug = function (plug, delayParam) {
  logger.activite("Start plug");
  var oldStatus = plug.status;

  if (  typeof plug.timer !== 'undefined' ) {
    clearTimeout(plug.timer);
  }
  var delay = delayParam || plug.delay || conf.delay;
  if ( delay > 0 ) {
    plug.timer = setTimeout(stopPlug, delay, plug);
    logger.activite("Delay :", delay);
    plug.stopTime = Date.now() + delay;
  } else {
    plug.stopTime = -1;
  }
  wpi.digitalWrite(plug.pin, ON);
  if (oldStatus != ON) {
    plug.changeTime = Date.now();
  }
}

var stopPlug = function (plug) {
  logger.activite("Stop plug");
  var oldStatus = plug.status;
  wpi.digitalWrite(plug.pin, OFF);
  if (  typeof plug.timer !== 'undefined' ) {
    clearTimeout(plug.timer);
  }
  if (oldStatus != OFF) {
    plug.changeTime = Date.now();
  }
}
