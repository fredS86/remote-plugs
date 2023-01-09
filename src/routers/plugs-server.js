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

router.route('/activity')
.all(function (req, res) {
  if (req.headers.accept && req.headers.accept==="text/event-stream") {
    // let request last as long as possible
    //req.socket.setTimeout(Infinity);

    // register the response to notify
    notify.push(res);

    //send headers for event-stream connection
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    res.write('\n');

    // The 'close' event is fired when a user closes their browser window.
    // In that situation we want to make sure our redis channel subscription
    // is properly shut down to prevent memory leaks...and incorrect subscriber
    // counts to the channel.
    req.on("close", function() {
      let idx = notify.findIndex((val) => val === res);
      notify.splice(idx, 1);
    });
  } else {
    res.send();
  }

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
    notifyAll(result);
    res.send(result);
  } else {
    res.sendStatus(404);
  }
  logResult(req, res, result);
};

var makeResult = function(plug) {
  var result = {};
  result.id = plug.conf.id;
  result.status = plug.status;
  result.type = plug.conf.type;
  result.label = plug.conf.label;
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

var notify  = [];
var notifyAll = function(data) {
  let message = 'data: ' + JSON.stringify(data) + '\n\n' ;
  notify.forEach((res) => res.write(message));
};
plugs.timeoutCallback(function(plug) {
  notifyAll(makeResult(plug));
})
