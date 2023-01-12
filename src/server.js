const logger = require('./utils/logger');
const express = require('express');
const router = express.Router;
const serveStatic = require('serve-static');
const plugs = require('./routers/plugs-server');
const webcams = require('./routers/webcams-server');
const conf = require('./routers/conf-server');
const app = express();


// use command-line arg for port if passed
var port = process.argv[2] || '8090';

app.use(serveStatic(__dirname + '/public'));
logger.debug(__dirname + '/public')

let apiRouter = router()
    .use('/plugs', plugs)
    .use('/webcams', webcams)
    .use('/conf', conf);
app.use('/api', apiRouter);

logger.debug('LogDir : ' + logger.logDir);
app.listen(port, function () {
logger.info('Express server listening on port %s', port);

});

