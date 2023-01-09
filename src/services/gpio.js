const logger = require('../utils/logger');
const pigpioClient = require('pigpio-client')

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
            resolve(pigpio);
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
        const pins = (conf.pins || [conf.pin]).map((p, i) => {
            const pin = hostGpio.gpio(p);
            const offState = (conf.offStates && conf.offStates[i]) || conf.offState;
            return {
                on: () => promisify(pin.write,offState ? 0 : 1),
                off: () => promisify(pin.write,offState ? 1 : 0),
                in: () => promisify(pin.modeSet,'input'),
                out: () => promisify(pin.modeSet,'output'),
            };
        });
        gpios.set(conf.id, {
            conf,
            status: 0,
            changeTime: new Date(),
            pins,
            disconnect: () => Promise.all([...pins].reverse().map(pin => Promise.all([pin.off(), pin.in()]))),
            off: () => Promise.all([...pins].reverse().map(pin => pin.off()))
    });
        await Promise.all(pins.map(async pin => {
            await pin.off();
            await pin.out();
        }));
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
        await gpios.get(id).disconnect();
        gpios.delete(id);
    }
}

exports.plugs = () => {
    const res = [];
    gpios.forEach(p => res.push(p));
    return res;
}

