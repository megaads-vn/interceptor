module.exports = new RuleParser();
var UrlPattern = require("url-pattern");
var urlParser = require("url");
var userAgentUtil = use("util/user-agent-util");
function RuleParser() {
    var cacheConfig;
    var parserCache = [];
    this.init = function (_cacheConfig) {
        cacheConfig = _cacheConfig;
        for (const domain in cacheConfig) {
            if (cacheConfig.hasOwnProperty(domain)) {
                let rules = (cacheConfig[domain].cache != null && cacheConfig[domain].cache.enable == true && cacheConfig[domain].cache.rules != null) ? cacheConfig[domain].cache.rules : [];
                rules.forEach(item => {
                    let pattern = null;
                    switch (item.type) {
                        case 'regex':
                            pattern = new UrlPattern(new RegExp(item.url));
                            break;
                        default:
                            pattern = new UrlPattern(item.url);
                            break;
                    }
                    item.urlPattern = pattern;
                });
            }
        }
    };
    this.parse = function (req) {
        const domain = req.headers.host;
        const domainCacheConfig = cacheConfig[domain];
        let retval = {
            "enable": false,
            "domain": domain
        };
        if (domainCacheConfig != null) {
            retval["host"] = domainCacheConfig.host;
            retval["port"] = domainCacheConfig.port;
            // Conditions: method, headers["accept"], url, headers['user-agent']
            // check method and accept type
            if (req.method === "GET"
                && (req.headers["accept"] != null
                    && (req.headers["accept"].indexOf("text/html") >= 0
                        || req.headers["accept"] == "*/*"))
            ) {
                // check user device
                const userDevice = userAgentUtil.detectDevice(req.headers['user-agent']);
                if (domainCacheConfig.cache.devices == null) {
                    retval["device"] = "all";
                } else if (domainCacheConfig.cache.devices.includes(userDevice)) {
                    retval["device"] = userDevice;
                }
                if (retval["device"] != null) {
                    let cacheRules = domainCacheConfig.cache != null && domainCacheConfig.cache.enable == true && domainCacheConfig.cache.rules != null ? domainCacheConfig.cache.rules : [];
                    cacheRules.forEach(item => {
                        const urlPath = urlParser.parse(req.url).pathname;
                        matches = item.urlPattern.match(urlPath);
                        if (matches != null
                            && (item.ignore == null
                                || item.ignore.routes == null
                                || item.ignore.routes.includes(urlPath) === false)
                        ) {
                            for (var property in domainCacheConfig.cache) {
                                retval[property] = domainCacheConfig.cache[property];
                            }
                            for (var property in item) {
                                retval[property] = domainCacheConfig.cache[property];
                            }
                            retval["host"] = domainCacheConfig.host;
                            retval["port"] = domainCacheConfig.port;
                            retval["domain"] = domain;
                            retval["name"] = item.name;
                            return;
                        }
                    });
                }
            }
        }
        return retval;
    };
}