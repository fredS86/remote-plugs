const wpi = require('./wiring-pi-gpio');
const {execSync} = require('child_process');


console.debug('START');
wpi.pinMode(23, 'out');
execSync('sleep 1');

wpi.pinMode(23, 'in');
console.debug('READ 23 : ' + wpi.digitalRead(23)); 
console.debug('READ 27 : ' + wpi.digitalRead(27)); 

wpi.pinMode(23, 'out');
wpi.digitalWrite(23, 1);
execSync('sleep 1');
console.debug('READ : ' + wpi.digitalRead(23)); 

wpi.digitalWrite(23, 0);
execSync('sleep 1');
console.debug('READ : ' + wpi.digitalRead(23));

wpi.digitalWrite(23, 1);
wpi.pinMode(23, 'in');

console.debug('END');
