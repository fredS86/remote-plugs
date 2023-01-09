const logger = require('../utils/logger');
const pigpioClient = require('pigpio-client')

const ACTIF = 0;
const INACTIF = 1;


const promisify = (fn, arg) => {
    return new Promise((resolve, reject) => {
        fn(arg, (err, res) => err ? reject(err) : resolve(res));
    });
}

const pigpios = new Map();
const gpios = new Map();

const initHost = (host) => {
    return getOrDefault(pigpios, host, () => new Promise((resolve, reject) => {
        const pigpio = pigpioClient.pigpio({host});
        pigpio.once('connected', (infos) => {
            logger.debug('Connecte au gpio ' + JSON.stringify(infos))
            resolve({
                ...pigpio,
                gpio: (gpio_pin) => {
                    let gpio = pigpio.gpio(gpio_pin);
                    return {
                        ...gpio,
                        modeSet: (mode) => promisify(gpio.modeSet, mode),
                        write: (level) => promisify(gpio.write, level),
                    }
                }
            });
        });
        pigpio.once('disconnected', () => {
            logger.debug('Deconnexion de ' + host)
            gpios.filter(plug => plug.host === host || (host === 'localhost' && !plug.host)).forEach(disconnect);
            pigpios.delete(host);
        })
        pigpio.once('error', err => {
            logger.error('impossible de se connecter à ' + host + ' : ' + err);
            reject(err);
        });
        return pigpio;
    }));
}

exports.init = async (conf) => {
    if (!gpios.has(conf.id)) {
        const hostGpio = await initHost(conf.host || 'localhost');
        const gpio = hostGpio.gpio(conf.pin);
        await gpio.modeSet('output');
        //await gpio.modeSet('input'); // like INACTIF
        await gpio.write(INACTIF);
        gpios.set(conf.id, {
            conf,
            status: 0,
            changeTime: new Date(),
            on: () => gpio.write(ACTIF),
            off: () => gpio.write(INACTIF),
        });
    }
    return gpios.get(conf.id);
}

const getOrDefault = (map, key, defaultValueProvider) => {
    if (!map.has(key)) {
        map.set(key, defaultValueProvider())
    }
    return map.get(key);
}

const disconnect = exports.disconnect = async ({id}) => {
    if (gpios.has(id)) {
        await gpios.get(id).modeSet('input');
        gpios.delete(id);
    }
}

exports.plugs = () => {
    const res = [];
    gpios.forEach(p => res.push(p));
    return res;
}

