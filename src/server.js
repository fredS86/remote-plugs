var logger = require('./utils/logger');
var express = require('express');
const router = express.Router;
var serveStatic = require('serve-static');
var plugs = require('./routers/plugs-server');
var conf = require('./routers/conf-server');
var app = express();


// use command-line arg for port if passed
var port = process.argv[2] || '8090';

app.use(serveStatic(__dirname + '/public'));
logger.debug(__dirname + '/public')

let apiRouter = router()
    .use('/plugs', plugs)
    .use('/conf', conf);
app.use('/api', apiRouter);

logger.debug('LogDir : ' + logger.logDir);
app.listen(port, function () {
logger.info('Express server listening on port %s', port);

});

