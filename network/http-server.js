module.exports = HttpServer;
var http = require('http');
var logger = use("util/logger");
function HttpServer() {
    let handers = [];
    this.start = function (options) {
        http.createServer(onRequest).listen(options.port);
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