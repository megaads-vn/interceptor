module.exports = CacheWorker;
var http = require('http');
http.globalAgent.keepAlive = true;
var logger = use("util/logger");
var urlUtil = use("util/url");
var userAgentUtil = use("util/user-agent-util");
var proxyPass = use("proxy/proxy-pass");
const hostsConfig = use('config/hosts');
const CACHED_STATUS_CODES = [200, 203, 300, 301, 302, 304, 307, 410, 404];
function CacheWorker() {
    var self = this;
    var isRunning = false;
    var hybridCache;
    var refreshRate = 15 * 60 * 1000;
    const INTERVAL = 30 * 1000;
    /**
     * Init workers
     * @param {interval, hybridCache} options 
     */
    this.init = function (options) {
        hybridCache = options.hybridCache;
        refreshRate = options.refreshRate || refreshRate;
        setInterval(run, INTERVAL);
    };
    async function run() {
        if (!isRunning) {
            isRunning = true;
            let now = new Date();
            now = now.getTime();
            let cacheMap = hybridCache.meta();
            for (let index = 0; index < cacheMap.length; index++) {
                const element = cacheMap[index];
                if (now - element.created_at >= refreshRate) {
                    try {
                        await sleep(300);
                        await refreshCache(element.key);
                    } catch (error) {
                        logger.error("Refresh cache failed", error);
                        logger.error("- cacheKey", element.key);
                    }
                }
            }
            isRunning = false;
        }

    }
    function refreshCache(cacheKey) {
        logger.debug("Refresh cache", cacheKey);
        return new Promise(function (resolve, reject) {
            let cacheObj = urlUtil.parseCacheKey(cacheKey);
            let requestOptions = buildRequestOptions(cacheObj);
            let req = http.request(requestOptions, function (res) {
                let contentType = res.headers["content-type"];
                if (contentType != null && contentType.indexOf("text/html") >= 0) {
                    let buffer = [];
                    res.on('data', function (chunk) {
                        buffer.push(chunk);
                    });
                    res.on('end', function () {
                        buffer = Buffer.concat(buffer);
                        let result = {
                            "statusCode": res.statusCode,
                            "headers": res.headers,
                            "data": buffer
                        };
                        delete result.headers["set-cookie"];
                        result.headers = setCacheHeaders(result.headers, {
                            "maxAge": hostsConfig[cacheObj.domain].cache.maxAge,
                            "cacheStatus": ""
                        });
                        // after: check cached status
                        if (CACHED_STATUS_CODES.indexOf(result.statusCode) > -1) {
                            hybridCache.put(cacheKey, result, hostsConfig[cacheObj.domain].cache.maxAge);
                        }
                        resolve();
                    });
                }
                resolve();
            }).on("error", (err) => {
                reject(err);
            });
            req.end();
        });
    }
    function buildRequestOptions(cacheObj) {
        var retval = null;
        let hostname = hostsConfig[cacheObj.domain].host;
        let port = hostsConfig[cacheObj.domain].port;
        let path = decodeURIComponent(cacheObj.url);
        let method = "GET";
        let userAgent = userAgentUtil.getUserAgent(cacheObj.device);
        if (userAgent != null) {
            retval = {
                "hostname": hostname,
                "port": port,
                "path": path,
                "method": method,
                "headers": {
                    "Host": hostname,
                    "User-Agent": userAgent,
                    "Accept-Encoding": "gzip, deflate, br",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "Accept-Language": "en-US,en;q=0.9,ja;q=0.8,vi;q=0.7",
                    "Connection": "keep-alive"
                },
                "gzip": true
            };
            if (cacheObj.protocol == "https") {
                retval.headers["X_FORWARDED_PROTO"] = "https";
                retval.headers["X-Forwarded-Proto"] = "https";
                retval.headers["HTTP_X_FORWARDED_PROTO"] = "https"
                retval.headers["HTTPS"] = "on";
            }
            // retval.headers["X-Forwarded-For"] = "";
            return retval;
        }
    }
    function setCacheHeaders(headers, options) {
        let currentTime = new Date();
        headers["cache-control"] = "public";
        if (options.maxAge) {
            headers["cache-control"] += ", max-age=" + options.maxAge;
        }
        delete headers["expires"];
        headers["last-modified"] = currentTime.toUTCString();
        delete headers["set-cookie"];
        headers["x-cache-engine"] = "interceptor";
        headers["x-cache-engine-refresh"] = "true";
        return headers;
    }    
    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

