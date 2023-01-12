const logger = require('../utils/logger');
const express = require('express');
const router = express.Router();
const conf = require('../services/conf')
const bodyParser = require('body-parser');

module.exports = router;

router.use(bodyParser.json());

router.get('/', function (req, res) {
  var config = {delay : conf.getDefaultDelay(), plugs : conf.listPlugs(), webcams : conf.listWebcams()};
  logger.info('GET / return conf ', config);
  res.send(config);
});

router.route('/delay')
  .get(function (req, res) {
    res.send("delay : " + conf.getDefaultDelay());
  })
  .put(function (req, res) {
    conf.setDefaultDelay(parseInt(req.body));
    res.send();
  });

router.get('/plugs', function (req, res) {
  res.send(conf.listPlugs());
});

router.route('/plugs/:id')
  .get(function (req, res) {
    res.send(conf.getPlug(req.params.id));
  })
  .put(function (req, res) {
    const plug = req.body;
    plug.id = req.params.id;
    conf.setPlug(plug);
    res.ok();
  })
  .delete(function(req, res) {
    res.send(conf.removePlug(req.params.id));
  });

router.get('/webcams', function (req, res) {
  res.send(conf.listWebcams());
});

router.route('/webcams/:id')
  .get(function (req, res) {
    res.send(conf.getWebcam(req.params.id));
  })
  .put(function (req, res) {
    const webcam = req.body;
    webcam.id = req.params.id;
    conf.setWebcam(webcam);
    res.ok();
  })
  .delete(function(req, res) {
    res.send(conf.removeWebcam(req.params.id));
  });
