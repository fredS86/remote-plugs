const express = require('express');
const router = express.Router();
const conf = require('../services/conf');
const bodyParser = require('body-parser');
const logger = require("../utils/logger");
const http = require("http");
const Sharp = require('sharp');

module.exports = router;

router.use(bodyParser.json());

router.route('/:id')
    .get([
            getConf,
            read,
            transform
        ]
    );

function getConf(req, res, next) {
    let webcam = conf.getWebcam(req.params.id);
    if (webcam) {
        res.locals.webcam = {
            ...webcam,
            options : {
                ...(webcam.options),
                crop: webcam.options && webcam.options.crop && {...webcam.options.crop},
                resize: {...((webcam.options || {}).resize)}
            }
        };
        const queryOptions = {
            grayscale: (req.query.grayscale || req.query.g) === 'true' || false,
            format: String(req.query.format || req.query.f || 'jpeg'),
            quality: Number(req.query.quality || req.query.q) || 80,
            rotate: Number(req.query.rotate || req.query.r) || 0,
            verticalFlip: (req.query.verticalFlip || req.query.vf) === 'true' || false,
            horizontalFlip: (req.query.horizontalFlip || req.query.hf) === 'true' || false,
        }
        if (req.query.width || req.query.w || req.query.height || req.query.h) {
            queryOptions.resize= {
                width: Number(req.query.width || req.query.w) || undefined,
                height: Number(req.query.height || req.query.h) || undefined,
                background : String(req.query.background || req.query.b || "#FFFFFF"),
                fit : String(req.query.fit || "contain"),
                position : String(req.query.position || req.query.p || "center")
            }
        }
        if (req.query.crop_width || req.query.cw ||
            req.query.crop_height || req.query.ch ||
            req.query.crop_top || req.query.ct ||
            req.query.crop_left || req.query.cl) {
            queryOptions.crop= {
                width: Number(req.query.crop_width || req.query.cw) || undefined,
                height: Number(req.query.crop_height || req.query.ch) || undefined,
                top: Number(req.query.crop_top || req.query.ct) || undefined,
                left: Number(req.query.crop_left || req.query.cl) || undefined
            }
        }
        // les options finales sont celles de la requete, a defaut celles de la conf.
        // a noter que l'on ne mixe pas les options de crop entre la requete et la conf. Idem pour le resize
        res.locals.webcam.options = {...res.locals.webcam.options, ... queryOptions};
        next();
    } else {
        res.sendStatus(404);
    }
}

function read(req, res, next) {
    http.get(res.locals.webcam.url, r => {
        let buffer = [];

        r.on('data', chunk => {
            buffer.push(chunk);
        });

        r.on('end', () => {
            res.locals.webcam.image = Buffer.concat(buffer);
            next();
        });
    }).on('error', err => {
        logger.debug(err.message);
        res.sendStatus(500, err.message);
    });
}

function transform(req, res) {
    let webcam = res.locals.webcam;
    sharp(webcam.image, webcam.options)
        .then(buffer => {
            webcam.image = buffer;
            res.header('Content-Type', 'image/jpeg')
            res.send(webcam.image);
        })
        .catch(err => {
            // Handle an exception.
            logger.debug(err);
            res.sendStatus(500, err);
        });
}
function sharp(image, options) {
    let sharp = Sharp(image);
    sharp
        .greyscale(options.grayscale)
        .rotate(options.rotate);
    if (options.crop)
        sharp.extract(options.crop)
    return sharp
        .resize(options.resize)
        .flip(options.verticalFlip)
        .flop(options.horizontalFlip)
        .toFormat(options.format, {quality: options.quality})
        .toBuffer();
}
