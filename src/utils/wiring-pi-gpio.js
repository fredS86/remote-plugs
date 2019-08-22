const exec = require('child_process').execSync;

module.exports = {
    LOW : 0,
    HIGH : 1,
    OUTPUT : 'out',
    INPUT : 'in',
    setup : function() { },
    pinMode : function(pin, mode) {
        exec('gpio mode ' + pin + ' ' + mode);
    },
    digitalWrite : function(pin, value) {
        exec('gpio write ' + pin + ' ' + value);
    },
    digitalRead : function(pin) {
        return exec('gpio read ' + pin);
    }
}
