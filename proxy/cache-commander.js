module.exports = CacheCommander;
var UrlPattern = require('url-pattern');
var allCachePattern = new UrlPattern("/interceptor/cache");
var routeCachePattern = new UrlPattern("/interceptor/cache/:routeName");
var deviceCachePattern = new UrlPattern("/interceptor/cache/:routeName/:device");
var urlCachePattern = new UrlPattern("/interceptor/cache/:routeName/:device/:url");
function CacheCommander(hybridCache) {
    this.command = function (req, res) {
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
        }
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Connection": "close"
        });
        res.end(JSON.stringify(retval));
    }
}