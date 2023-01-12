const express = require('express');
const router = express.Router();
const conf = require('../services/conf');
const bodyParser = require('body-parser');
const Jimp = require("jimp");
const logger = require("../utils/logger");
const http = require("http");
const { decode} = require("imagescript");
const { Image } = require('image-js');

module.exports = router;

router.use(bodyParser.json());
router.route('/:id')
  .get([function (req, res, next) {
    let webcam = conf.getWebcam('test');
    if (webcam) {
        req.webcam = webcam;
        next();
    } else {
        res.sendStatus(404);
    }
  },
      function (req, res, next) {
          http.get(req.webcam.url,r => {
              let buffer = [];

              r.on('data', chunk => {
                  buffer.push(chunk);
              });

              r.on('end', () => {
                  req.image = Buffer.concat(buffer);
                  next();
              });
          }).on('error', err => {
              logger.debug(err.message);
              res.sendStatus(500, err.message);
          });
      },
  transform,
      function (req, res) {
          res.header('Content-Type', 'image/jpeg')
          res.send(req.image);
      }]
  );

function transform(req, res, next) {
    const method = req.method === 'jimp' ? jimp : req.method === 'imagejs' ? image_js : imagescript;
    if (req.method === 'jimp') {
        method
    }
    method(req.image)
    .then(buffer => {
        req.image = buffer;
        next();
    })
    .catch(err => {
        // Handle an exception.
        logger.debug(err);
        res.sendStatus(500, err);
    });
}

function jimp(jpeg) {
    return Jimp.read(jpeg)
        .then(image => {
            return image
                // .greyscale()
                // .rotate(270)
                // .crop(200,120,320,240)
                // .quality(80)
                // .resize(640,480)
                .getBufferAsync(Jimp.MIME_JPEG)
        })
}

function imagescript(jpeg) {
    return decode(jpeg)
        .then(image => {
            return image
                // .rotate(180)
                // .crop(200,120,320,240)
                // .resize(640,480)
                .encodeJPEG(80)
        })
}

function image_js(jpeg) {
 return Image.load(jpeg)
     .then(image => {
         return image
             // .grey()
             // .rotate({angle: 90})
             // .crop({x:200, y:120, width:320, height:240})
             // .resize({witdh:640, height:480})
             .toBuffer({format: 'jpeg'}, {quality: 80})
     })

}
