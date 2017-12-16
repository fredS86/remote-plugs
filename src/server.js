var logger = require('./utils/logger');
var express = require('express');
var serveStatic = require('serve-static');
var plugs = require('./routers/plugs-server');
var conf = require('./routers/conf-server');
var app = express();


// use command-line arg for port if passed
var port = process.argv[2] || '8080';

app.use(serveStatic(__dirname + '/public'));
logger.debug(__dirname + '/public')

app.use('/plugs', plugs);

app.use('/conf', conf);

logger.debug('LogDir : ' + logger.logDir);
app.listen(port, function () {
logger.info('Express server listening on port %s', port);

});

