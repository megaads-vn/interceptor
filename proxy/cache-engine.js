module.exports = CacheEngine;
var hostsConfig = use('config/hosts');
var RequestHandler = use("network/request-handler");
var proxyPass = use("proxy/proxy-pass");
var ruleParser = use("proxy/rule-parser");
var logger = use("util/logger");
const HybridCache = require("mega-hybrid-cache");
var hybridCache = new HybridCache({
    limit: 1024
});
const CacheCommander = use("proxy/cache-commander");
var cacheCommander = new CacheCommander();
function CacheEngine() {
    var self = this;
    this.init = function () {
        ruleParser.init(hostsConfig);
        cacheCommander.init(hostsConfig, hybridCache);
    }
    this.onRequest = function (req, res) {
        // commander
        if (req.url.indexOf("interceptor") >= 0) {
            return cacheCommander.command(req, res);
        }
        // cache response
        let startTime = process.hrtime();
        let cacheParserResult = ruleParser.parse(req);
        logger.debug("req.url", req.url);
        if (cacheParserResult != null && cacheParserResult.enable == true) {
            const cacheKey = cacheParserResult.domain + "::"
                + cacheParserResult.name + "::"
                + req.protocol + "::"
                + cacheParserResult.device + "::"
                + encodeURIComponent(req.url);
            let cacheData = hybridCache.get(cacheKey);
            if (cacheData == null) {
                logger.debug("CACHE MISS", req.url);
                proxyPass.request(cacheParserResult.domain, cacheParserResult.host, cacheParserResult.port, req, res, function (result) {
                    delete result.headers["set-cookie"];
                    result.headers["interceptor-cache"] = "MISS";
                    res.writeHead(result.statusCode, result.headers);
                    res.end(result.data);
                    hybridCache.put(cacheKey, result, cacheParserResult.maxAge);
                });
            } else {
                cacheData.headers["interceptor-cache"] = "HIT";
                res.writeHead(cacheData.statusCode, cacheData.headers);
                res.end(Buffer.from(cacheData.data));
                logger.debug("CACHE HIT", req.url);
                logger.debug("Execution time: %dms", process.hrtime(startTime)[1] / 1000000);
            }
        } else if (cacheParserResult != null) {
            proxyPass.pass(cacheParserResult.domain, cacheParserResult.host, cacheParserResult.port, req, res);
        } else {
            res.writeHead(500, {});
            res.end("Interceptor. Internal Server Error");
        }
    }
}
CacheEngine.prototype = new RequestHandler();