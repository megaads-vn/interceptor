module.exports = HttpServer;
const http = require('http');
const https = require('vhttps');
const logger = use("util/logger");
function HttpServer() {
    let handers = [];
    let redirectHttpHosts = [];
    this.start = function (options) {
        if (options.ssl.enable) {
            options.ssl.hosts.forEach(sslHost => {
                if (sslHost.redirectHttp) {
                    redirectHttpHosts.push(sslHost.hostname);
                }
            });
            https.createServer({}, options.ssl.hosts, function (req, res) {
                req.protocol = "https";
                onRequest(req, res);
            }).listen(options.ssl.port);
            logger.info("SSL Server is listening on port: ", options.ssl.port);
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