module.exports = HttpServer;
var http = require('http');
function HttpServer() {
    let handers = [];
    this.start = function (options) {
        http.createServer(onRequest).listen(options.port);
        console.log("Server is listening on port: ", options.port);
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