module.exports = CacheEngine;
var cacheConfig = require(__dir + '/config/cache');
var appConfig = require(__dir + '/config/app');
var RequestHandler = require(__dir + "/network/request-handler");
var proxyPass = require(__dir + "/proxy/proxy-pass");
var ruleParser = require(__dir + "/proxy/rule-parser");
function CacheEngine() {
    var self = this;
    var hybridCache = {};
    this.backendHost;
    this.backendPort;
    this.init = function (backendHost, backendPort) {
        self.backendHost = backendHost;
        self.backendPort = backendPort;
        ruleParser.init(cacheConfig);
    }
    this.onRequest = function (req, res) {
        let cacheParserResult = ruleParser.parse(req);
        if (req.method === "GET" && cacheParserResult != null) {
            let cacheData = hybridCache[req.url];
            if (cacheData == null) {
                proxyPass.request(self.backendHost, self.backendPort, req, res, function (result) {
                    result.headers["Interceptor-Cache"] = "MISS";
                    delete result.headers["set-cookie"];
                    delete result.headers["Set-Cookie"];
                    res.writeHead(result.statusCode, result.headers);
                    res.end(result.data);
                    hybridCache[req.url] = result;
                });
            } else {
                console.log("cache hit", req.url);
                cacheData.headers["Interceptor-Cache"] = "HIT";
                res.writeHead(cacheData.statusCode, cacheData.headers);
                res.end(cacheData.data);
            }
        } else if (req.method === "POST" && req.url === appConfig.dataChangeRoute) {
            let dataBuffer = "";
            req.on("data", function (data) {
                dataBuffer += data;
            });
            req.on("end", function () {
                onDataChange(JSON.parse(dataBuffer));
            });
        } else {
            proxyPass.pass(self.backendHost, self.backendPort, req, res);
        }
    }
    function onDataChange(data) {
        cacheConfig.routes.forEach(route => {
            if (route.flush != null && route.flush.data.indexOf(data.table) >= 0) {
                hybridCache.forgetLabel(route.name);
            }
        });
    }
}
CacheEngine.prototype = new RequestHandler();