module.exports = CacheEngine;
var cacheConfig = use('config/cache');
var RequestHandler = use("network/request-handler");
var proxyPass = use("proxy/proxy-pass");
var ruleParser = use("proxy/rule-parser");
const HybridCache = require("mega-hybrid-cache");
function CacheEngine() {
    var self = this;
    var hybridCache = new HybridCache({
        limit: 1024
    });
    this.init = function () {
        ruleParser.init(cacheConfig);
    }
    this.onRequest = function (req, res) {
        let startTime = process.hrtime();
        let cacheParserResult = ruleParser.parse(req);
        console.log("req.url", req.url);
        if (cacheParserResult != null && cacheParserResult.enable == true) {
            const cacheKey = cacheParserResult.domain + "::"
                + cacheParserResult.name + "::"
                + cacheParserResult.device + "::"
                + req.url;
            let cacheData = hybridCache.get(cacheKey);
            if (cacheData == null) {
                console.log("CACHE MISS", req.url);
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
                console.log("CACHE HIT", req.url);
                console.log("Execution time: %dms", process.hrtime(startTime)[1] / 1000000);
            }
        } else if (req.method === "POST"
            && cacheParserResult != null
            && req.headers.host === cacheParserResult.domain
            && req.url === cacheParserResult.dataChangeRoute) {
            let dataBuffer = "";
            req.on("data", function (data) {
                dataBuffer += data;
            });
            req.on("end", function () {
                onDataChange(JSON.parse(dataBuffer));
            });
        } else if (cacheParserResult != null) {
            proxyPass.pass(cacheParserResult.domain, cacheParserResult.host, cacheParserResult.port, req, res);
        } else {
            res.writeHead(500, {});
            res.end("Interceptor. Internal Server Error");
        }
    }
    function onDataChange(domain, data) {
        // cacheConfig.routes.forEach(route => {
        //     if (route.flush != null && route.flush.data.indexOf(data.table) >= 0) {
        //         hybridCache.tags([domain + "::" + route]).flush();
        //     }
        // });
    }
}
CacheEngine.prototype = new RequestHandler();