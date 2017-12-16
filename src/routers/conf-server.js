var logger = require('../utils/logger');
var express = require('express');
var router = express.Router();
var conf = require('../services/conf')
var bodyParser = require('body-parser');

module.exports = router;

router.use(bodyParser.json());

router.get('/', function (req, res) {
  var config = {delay : conf.getDefaultDelay(), plugs : conf.plugs()};
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
  res.send(conf.plugs());
});

router.route('/plugs/:id')
  .get(function (req, res) {
    res.send(conf.getPlug(req.params.id));
  })
  .put(function (req, res) {
    var plug = req.body;
    plug.id = req.params.id;
    res.send(conf.setPlug(plug));
  })
  .delete(function(req, res) {
    res.send(conf.removePlug(req.params.id));
  });
    
