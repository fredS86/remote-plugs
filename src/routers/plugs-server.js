var logger = require('../utils/logger');
var express = require('express');
var router = express.Router();
var plugs = require('../services/plugs')
var bodyParser = require('body-parser');

module.exports = router;

router.use(bodyParser.json());

router.get('/', function (req, res) {
  plugs.all().then((all) => {
    // construction du resultat
    var result = all.map(makeResult);
    logger.info('GET / return list of ', result.length, ' plugs');
    res.send(result);
  });
});

router.route('/:id')
  .get(function (req, res) {
    managePlug(req, res);
  })
  .post(function (req, res) {
    managePlug(req, res, (parseInt(req.body.status) === 1 ? plugs.on : plugs.off));
  });

router.get('/:id/on', function (req, res) {
  managePlug(req, res, plugs.on);
});

router.get('/:id/off', function (req, res) {
  managePlug(req, res, plugs.off);
});

var managePlug = async function(req, res, action) {
  var plug = await plugs.read(req.params.id);
  if (plug) {
    var transform = action || function(plug) {return Promise.resolve(plug)};
    var result = makeResult(await transform(plug, parseInt(req.query.timeLeft || req.body.timeLeft)));
    res.send(result);
  } else {
    res.sendStatus(404);
  }
  logResult(req, res, result);
};

var makeResult = function(plug) {
  var result = {};
  result.id = plug.id;
  result.status = plug.status;
  result.elapsedTime = Date.now() - plug.changeTime;
  if ( plug.status && plug.stopTime !== -1) {
    result.timeLeft = plug.stopTime - Date.now();
  }
  return result;
};
  
var logResult = function(req, res, result) {
  if (result) {
    logger.info(req.method + ' ' + req.path + ' returning ' + JSON.stringify(result));
  } else {
    logger.info(req.method + ' ' + req.path + ' returning ' + res.statusCode + ' - ' + res.statusMessage);
  }
};
