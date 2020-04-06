module.exports = CacheEngine;
var cacheConfig = require(__homedir + '/config/cache');
var RequestHandler = require(__homedir + "/network/request-handler");
var proxyPass = require(__homedir + "/proxy/proxy-pass");
var ruleParser = require(__homedir + "/proxy/rule-parser");
var ruleParser = require(__homedir + "/proxy/rule-parser");
const HybridCache = require("mega-hybrid-cache");
function CacheEngine() {
    var self = this;
    var hybridCache = new HybridCache({
        limit: 24 * 60 * 60
    });
    this.init = function () {
        ruleParser.init(cacheConfig);
    }
    this.onRequest = function (req, res) {
        let cacheParserResult = ruleParser.parse(req);
        if (cacheParserResult != null && cacheParserResult.enable == true) {
            let cacheData = hybridCache.get(req.url);
            if (cacheData == null) {
                proxyPass.request(cacheParserResult.host, cacheParserResult.port, req, res, function (result) {
                    result.headers["Interceptor-Cache"] = "MISS";
                    delete result.headers["set-cookie"];
                    delete result.headers["Set-Cookie"];
                    res.writeHead(result.statusCode, result.headers);
                    res.end(result.data);
                    hybridCache.put(req.url, JSON.stringify(result), cacheParserResult.maxAge);
                });
            } else {
                console.log("CACHE HIT", req.url);
                cacheData = JSON.parse(cacheData);
                cacheData.headers["Interceptor-Cache"] = "HIT";
                res.writeHead(cacheData.statusCode, cacheData.headers);
                res.end(Buffer.from(cacheData.data));
            }
        } else if (req.method === "POST" 
            && req.headers.host === cacheParserResult.domain
            && req.url === cacheParserResult.dataChangeRoute) {
            let dataBuffer = "";
            req.on("data", function (data) {
                dataBuffer += data;
            });
            req.on("end", function () {
                onDataChange(JSON.parse(dataBuffer));
            });
        } else {
            if (cacheParserResult == null) {
                proxyPass.pass(null, null, req, res);
            } else {
                proxyPass.pass(cacheParserResult.host, cacheParserResult.port, req, res);
            }
        }
    }
    function onDataChange(domain, data) {
        // cacheConfig.routes.forEach(route => {
        //     if (route.flush != null && route.flush.data.indexOf(data.table) >= 0) {
        //         hybridCache.tags([route.name]).flush();
        //     }
        // });
    }
}
CacheEngine.prototype = new RequestHandler();