module.exports = {
    LOW : 0,
    HIGH : 1,
    OUTPUT : 0,
    INPUT : 1,
    setup : function() { this.gpio = []},
    pinMode : function(pin, mode) {
        this.gpio[pin] = {mode : mode};
    },
    digitalWrite : function(pin, value) {
        if (this.gpio[pin].mode === this.OUTPUT) {
            this.gpio[pin].value = value;
        } 
    },
    digitalRead : function(pin) {
        if (this.gpio[pin].mode === this.OUTPUT) {
            return this.gpio[pin].value;
        } else {
            return (new Date().getSeconds) % 2;
        }
    }
}
