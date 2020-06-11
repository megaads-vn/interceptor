module.exports = ProxyValidate;
const ip2proxy = require("ip2proxy-nodejs");
const RequestHandler = use("network/request-handler");
const logger = use("util/logger");

function ProxyValidate() {
    var self = this;
    var options = {};
    var moduleEnable = false;
    this.init = function (_options) {
        options = _options;
        moduleEnable = options && options.module_enable === true ? options.module_enable : false;
        if (moduleEnable === true && ip2proxy.Open(options.path) != 0) {
            throw new Error("ip2proxy error on open")
        }
    }

    this.onRequest = function (req, res) {
        let result = true;
        if (moduleEnable) {
            let ip = getIp(req);
            if (isProxy(ip)) {
                result = false;
                res.writeHead(500, {});
                res.end("Invalid IP. Internal Server Error");
                logger.error("Invalid IP", ip)
            }
        }
        return result;
    }

     function isProxy(ip) {
        let isWhiteList = false;
        let whiteList =  options.white_list ? options.white_list : [];
        if (ip && whiteList && (whiteList.includes(ip) || whiteList.includes(ip.replace('::ffff:', '')))) {
            isWhiteList = true;
        }
        let isProxy = isWhiteList ? false : ip2proxy.isProxy(ip);
        return isProxy;
    }


    function getIp(req) {
        return (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || req.connection.remoteAddress
    }

}

ProxyValidate.prototype = new RequestHandler();
