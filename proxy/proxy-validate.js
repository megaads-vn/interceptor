module.exports = ProxyValidate;
const ip2proxy = require("ip2proxy-nodejs");
const RequestHandler = use("network/request-handler");
const logger = use("util/logger");
function ProxyValidate() {
    var self = this;
    this.init = function (options) {
        if (ip2proxy.Open(options.path) != 0) {
            throw new Error("ip2proxy error on open")
        }
    }
    this.onRequest = function (req, res) {
        let result = true;
        let ip = getIp(req);
        let isProxy = ip2proxy.isProxy(ip);
        if (isProxy) {
            result = false;
            res.writeHead(500, {});
            res.end("Invalid IP. Internal Server Error");
            logger.error("Invalid IP", ip)
        }
        return result;
    }

    function getIp(req) {
        return (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || req.connection.remoteAddress
    }

}

ProxyValidate.prototype = new RequestHandler();
