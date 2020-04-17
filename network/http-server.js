module.exports = HttpServer;
const http = require('http');
const https = require('vhttps');
const logger = use("util/logger");
function HttpServer(HostsConfig) {
    let handers = [];
    this.start = function (options) {
        http.createServer(onRequest).listen(options.port);
        logger.info("Server is listening on port: ", options.port);
        if (options.ssl.enable) {
            https.createServer({}, options.ssl.hosts, onRequest).listen(options.ssl.port);
            logger.info("SSL Server is listening on port: ", options.ssl.hosts);
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