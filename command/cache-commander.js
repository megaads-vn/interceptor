module.exports = CacheCommander;
var UrlPattern = require('url-pattern');
var RequestHandler = use("network/request-handler");
const HybridCache = require("mega-hybrid-cache");
var hybridCache = new HybridCache({
    limit: 24 * 60 * 60
});
var allCachePattern = new UrlPattern("/interceptor/cache");
var routeCachePattern = new UrlPattern("/interceptor/cache/:routeName");
var urlCachePattern = new UrlPattern("/interceptor/cache/:routeName/:url");
function CacheCommander() {
    this.onRequest = function (req, res) {
        let retval = {
            "status": "success"
        }
        let domain = req.headers.host;
        if (req.method === "DELETE") {
            if (allCachePattern.match(req.url) != null) {
                console.log("command - delete all caches");
                retval["result"] = hybridCache.flush();
            } else if (routeCachePattern.match(req.url) != null) {
                let patternMatch = routeCachePattern.match(req.url);
                let routeName = patternMatch.routeName;
                console.log("command - delete route cache", routeName);
                retval["result"] = hybridCache.tags[domain, routeName].flush();
            } else if (urlCachePattern.match(req.url) != null) {
                let patternMatch = urlCachePattern.match(req.url);
                let routeName = patternMatch.routeName;
                let url = patternMatch.url;
                console.log("command - delete url cache", routeName, url);
                retval["result"] = hybridCache.tags[domain, routeName].forget(url);
            }
        } else if (req.method === "GET") {
            if (routeCachePattern.match(req.url) != null) {
                let patternMatch = routeCachePattern.match(req.url);
                let routeName = patternMatch.routeName;
                console.log("command - get route cache", routeName);
                retval["result"] = hybridCache.tags[domain, routeName].keys("*");
            } else if (urlCachePattern.match(req.url) != null) {
                let patternMatch = urlCachePattern.match(req.url);
                let routeName = patternMatch.routeName;
                let url = patternMatch.url;
                console.log("command - get url cache", routeName, url);
                retval["result"] = hybridCache.tags[domain, routeName].get(url);
            }
        }
        if (retval["result"] != null) {
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Connection": "close"
            });
            res.end(JSON.stringify(retval));
        }
    }
}
CacheCommander.prototype = new RequestHandler();