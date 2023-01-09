const logger = require('../utils/logger');
const express = require('express');
const router = express.Router();
const plugs = require('../services/plugs')
const bodyParser = require('body-parser');

module.exports = router;

router.use(bodyParser.json());

router.get('/', function (req, res) {
  plugs.all().then((all) => {
    // construction du resultat
    const result = all.map(makeResult);
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
      const idx = notify.findIndex((val) => val === res);
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
    managePlug(req, res);
  });

// action is one of 'on', 'off' or any action id defined for the plug
router.get('/:id/:action', function (req, res) {
  managePlug(req, res);
});


const managePlug = async function(req, res) {

  const plug = await plugs.read(req.params.id);
  if (plug) {
    const actionId = req.params.action || req.body.action;
    if (actionId) {
      if (actionId === 'off') {
        sendResult(req, res, await plugs.off(plug));
      } else {
        const defaultAction = {
          id: 'on',
          status: 1,
          pin: plug.conf.pin,
          pins: plug.conf.pins
        }
        const action = (plug.conf.actions || [defaultAction]).find(action => actionId === action.id || parseInt(req.body.status) === action.status);
        if (action) {
          sendResult(req, res, await plugs.on(plug, {
            action,
            delayParam: parseInt(req.query.timeLeft || req.body.timeLeft)
          }));
        } else {
          send404(req, res);
        }
      }
    } else {
      sendResult(req, res, plug, true);
    }
  } else {
    send404(req, res);
  }
}

const sendResult = function(req, res, rawResult, ignoreNotify) {
  const result = makeResult(rawResult);
  if (!ignoreNotify) {
    notifyAll(result);
  }
  res.send(result);
  logResult(req, res, result);
};

const send404 = function(req, res) {
  res.sendStatus(404);
  logResult(req, res);
}

const makeResult = function(plug) {
  const result = {};
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

const logResult = function(req, res, result) {
  if (result) {
    logger.info(req.method + ' ' + req.path + ' returning ' + JSON.stringify(result));
  } else {
    logger.info(req.method + ' ' + req.path + ' returning ' + res.statusCode + ' - ' + res.statusMessage);
  }
};

const notify  = [];
const notifyAll = function(data) {
  const message = 'data: ' + JSON.stringify(data) + '\n\n' ;
  notify.forEach((res) => res.write(message));
};
plugs.timeoutCallback(function(plug) {
  notifyAll(makeResult(plug));
});
