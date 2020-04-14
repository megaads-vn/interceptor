module.exports = CacheCommander;
var UrlPattern = require('url-pattern');
var allCachePattern = new UrlPattern("/interceptor/cache");
var routeCachePattern = new UrlPattern("/interceptor/cache/:routeName");
var deviceCachePattern = new UrlPattern("/interceptor/cache/:routeName/:device");
var urlCachePattern = new UrlPattern("/interceptor/cache/:routeName/:device/:url");
var cacheConfig = null;
var hybridCache = null;
function CacheCommander() {
    this.init = function (_cacheConfig, _hybridCache) {
        cacheConfig = _cacheConfig;
        hybridCache = _hybridCache;
    }
    this.command = function (req, res, cacheParserResult) {
        let retval = {
            "status": "success"
        }
        let domain = req.headers.host;
        if (req.method === "DELETE") {
            if (allCachePattern.match(req.url) != null) {
                retval["message"] = "delete all caches";
                retval["result"] = hybridCache.delTag(domain);
            } else if (routeCachePattern.match(req.url) != null) {
                let patternMatch = routeCachePattern.match(req.url);
                let routeName = patternMatch.routeName;
                let tag = domain + "::" + routeName;
                retval["message"] = "delete route caches: " + tag;
                retval["result"] = hybridCache.delTag(tag);
            } else if (deviceCachePattern.match(req.url) != null) {
                let patternMatch = deviceCachePattern.match(req.url);
                let routeName = patternMatch.routeName;
                let device = patternMatch.device;
                let tag = domain + "::" + routeName + "::" + device;
                retval["message"] = "delete device caches: " + tag;
                retval["result"] = hybridCache.delTag(tag);
            } else if (urlCachePattern.match(req.url) != null) {
                let patternMatch = urlCachePattern.match(req.url);
                let routeName = patternMatch.routeName;
                let url = patternMatch.url;
                let device = patternMatch.device;
                let cachekey = domain + "::" + routeName + "::" + device + "::" + url;
                retval["message"] = "delete url cache: " + cachekey;
                retval["result"] = hybridCache.forget(cachekey);
            }
        } else if (req.method === "GET") {
            if (allCachePattern.match(req.url) != null) {
                retval["message"] = "get all cache keys: " + domain;
                retval["result"] = hybridCache.keys(domain + "::*");
            } else if (routeCachePattern.match(req.url) != null) {
                let patternMatch = routeCachePattern.match(req.url);
                let routeName = patternMatch.routeName;
                let tag = domain + "::" + routeName;
                retval["message"] = "get route cache keys: " + tag;
                retval["result"] = hybridCache.keys(tag + "::*");
            } else if (deviceCachePattern.match(req.url) != null) {
                let patternMatch = deviceCachePattern.match(req.url);
                let routeName = patternMatch.routeName;
                let device = patternMatch.device;
                let tag = domain + "::" + routeName + "::" + device;
                retval["message"] = "get device cache keys: " + tag;
                retval["result"] = hybridCache.keys(tag + "::*");
            } else if (urlCachePattern.match(req.url) != null) {
                console.log("command - get url cache data");
                let patternMatch = urlCachePattern.match(req.url);
                let routeName = patternMatch.routeName;
                let device = patternMatch.device;
                let url = patternMatch.url;
                let cachekey = domain + "::" + routeName + "::" + device + "::" + url;
                console.log("command - get url cache data", cachekey);
                retval["result"] = hybridCache.get(cachekey);
            }
        } else if (req.method === "POST") {
            for (const cacheDomain in cacheConfig) {
                const cacheDomainConfig = cacheConfig[cacheDomain];
                if (cacheDomain === domain
                    && cacheDomainConfig.cache != null
                    && cacheDomainConfig.cache.enable === true
                    && cacheDomainConfig.cache.dataChangeRoute === req.url) {
                    let dataBuffer = "";
                    req.on("data", function (data) {
                        dataBuffer += data;
                    });
                    req.on("end", function () {
                        onDataChange(domain, cacheDomainConfig, JSON.parse(dataBuffer));
                    });
                    break;
                }
            }
        }
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Connection": "close"
        });
        res.end(JSON.stringify(retval));
    }
    function onDataChange(domain, cacheDomainConfig, data) {
        var retval = false;
        console.log("onDataChange", domain, data);
        cacheDomainConfig.cache.rules.forEach(rule => {
            if (rule.flush != null && rule.flush.data.indexOf(data.table) >= 0) {
                let tag = domain + "::" + rule.name;
                console.log("delete route caches: " + tag);
                hybridCache.delTag(tag);
                retval = true;
                return;
            }
        });
        return retval;
    }
}