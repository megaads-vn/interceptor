module.exports = HttpServer;
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const { constants } = require('crypto');
const http = require('http');
const https = require('vhttps');
const logger = use("util/logger");
function HttpServer() {
    let handers = [];
    let redirectHttpHosts = [];
    this.start = function (options) {
        if (cluster.isMaster) {
            masterProcess();
        } else {
            childProcess();
        }
        cluster.on('exit', function (worker) {
            logger.info('Worker %d died :(', worker.id);
            cluster.fork();
        });
        function masterProcess() {
            logger.info(`Master ${process.pid} is running`);

            for (let i = 0; i < numCPUs; i++) {
                logger.info(`Forking process number ${i}...`);
                cluster.fork();
            }
        }
        function childProcess() {
            logger.info(`Worker ${process.pid} started...`);
            if (options.ssl.enable) {
                options.ssl.hosts.forEach(sslHost => {
                    if (sslHost.redirectHttp) {
                        redirectHttpHosts.push(sslHost.hostname);
                    }
                });
                if (options.ssl.hosts.length > 0) {
                    let defaultOption = options.ssl.hosts.shift();
                    defaultOption.secureOptions = constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1
                    https.createServer(defaultOption, options.ssl.hosts, function (req, res) {
                        req.protocol = "https";
                        onRequest(req, res);
                    }).listen(options.ssl.port);
                    logger.info("SSL Server is listening on port: ", options.ssl.port);
                }
            }
            http.createServer(function (req, res) {
                if (redirectHttpHosts.indexOf(req.headers.host) > -1) {
                    res.writeHead(301, {
                        "Location": "https://" + req.headers['host'].replace(options.port, options.ssl.port) + req.url
                    });
                    res.end(`<html>
                    <head><title>301 Moved Permanently</title></head>
                    <body>
                    <center><h1>301 Moved Permanently</h1></center>
                    <hr><center>Interceptor</center>
                    </body>
                    </html>`);
                } else {
                    req.protocol = "http";
                    onRequest(req, res);
                }

            }).listen(options.port);
            logger.info("Server is listening on port: ", options.port);
        }
    }
    this.addHandler = function (handler) {
        if (handler.__proto__.constructor.name === "RequestHandler") {
            handers.push(handler);
        }
    }
    function onRequest(req, res) {
        handers.forEach(hander => {
            hander.onRequest(req, res);
        });
    }
}