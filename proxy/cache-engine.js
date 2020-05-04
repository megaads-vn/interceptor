module.exports = CacheEngine;
const hostsConfig = use('config/hosts');
const RequestHandler = use("network/request-handler");
const CacheWorker = use("proxy/cache-worker");
var cacheWorker = new CacheWorker();
const RuleParser = use("proxy/rule-parser");
var proxyPass = use("proxy/proxy-pass");
var logger = use("util/logger");
var urlUtil = use("util/url");
const HybridCache = require("mega-hybrid-cache");
var hybridCache = new HybridCache({
    limit: 1024
});
const CacheCommander = use("proxy/cache-commander");
var cacheCommander = new CacheCommander();
var ruleParser = new RuleParser();
const CACHED_STATUS_CODES = [200, 203, 300, 301, 302, 304, 307, 410, 404];
var options;
function CacheEngine() {
    var self = this;
    this.init = function (_options) {
        options = _options;
        ruleParser.init(hostsConfig);
        cacheCommander.init(hostsConfig, hybridCache);
        if (options.refresh.enable) {
            cacheWorker.init({
                "hybridCache": hybridCache,
                "refreshRate": options.refresh.rate
            });
        }
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
        logger.debug("cacheParserResult", cacheParserResult);
        if (cacheParserResult != null && cacheParserResult.enable == true) {
            const cacheUrl = urlUtil.removeParams(cacheParserResult.strippedQueryParams, req.url);
            const cacheKey = urlUtil.buildCacheKey({
                "domain": cacheParserResult.domain,
                "routeName": cacheParserResult.name,
                "protocol": req.protocol,
                "device": cacheParserResult.device,
                "url": encodeURIComponent(cacheUrl)
            });
            let cacheData = hybridCache.get(cacheKey);
            if (cacheData == null) {
                logger.debug("CACHE MISS", req.url);
                fetchAndCache(cacheKey, cacheParserResult, req, res, function (result) {
                    res.writeHead(result.statusCode, result.headers);
                    res.end(result.data);
                });

            } else {
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
    function setCacheHeaders(result, cacheParserResult) {
        let currentTime = new Date();
        result.headers["x-cache-engine"] = "interceptor";
        result.headers["cache-control"] = "public, max-age=" + cacheParserResult.maxAge;
        delete result.headers["expires"];
        result.headers["last-modified"] = currentTime.toUTCString();
        delete result.headers["set-cookie"];
        return result.headers;
    }
    function fetchAndCache(cacheKey, cacheParserResult, req, res, callBackFn) {
        proxyPass.request(cacheParserResult.domain,
            cacheParserResult.host,
            cacheParserResult.port,
            req,
            res,
            function (result) {
                result.headers = setCacheHeaders(result, cacheParserResult);
                if (callBackFn != null) {
                    callBackFn(result);
                }
                // after: check cached status
                if (CACHED_STATUS_CODES.indexOf(result.statusCode) > -1) {
                    hybridCache.put(cacheKey, result, cacheParserResult.maxAge);
                }
            }
        );
    }
}
CacheEngine.prototype = new RequestHandler();