var logger = require('./logger');

try {
//  var wpi = require('wiring-pi');
  var wpi = require('./wiring-pi-gpio');
} catch(e) {
  logger.info('Wiring-Pi not available, using mock');
  wpi = require('./wiring-pi-mock');
}

module.exports = wpi;
