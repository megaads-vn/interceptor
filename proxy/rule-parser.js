module.exports = new RuleParser();
var UrlPattern = require("url-pattern");
var urlParser = require("url");
function RuleParser() {
    var urlPatterns = [];
    var cacheConfig;
    this.init = function (_cacheConfig) {
        cacheConfig = _cacheConfig;
        for (const domain in cacheConfig) {
            if (cacheConfig.hasOwnProperty(domain)) {
                const rules = cacheConfig[domain].rules;
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
            if (req.method === "GET"
                && (req.headers["Accept"] != null && req.headers["Accept"].indexOf("text/html") >= 0)
                || (req.headers["accept"] != null && req.headers["accept"].indexOf("text/html") >= 0)) {
                let cacheRules = domainCacheConfig.rules;
                cacheRules.forEach(item => {
                    const urlPath = urlParser.parse(req.url).pathname;
                    matches = item.urlPattern.match(urlPath);
                    if (matches != null
                        && (item.ignore == null || item.ignore.routes == null || item.ignore.routes.includes(urlPath) === false)) {
                        retval = {
                            "enable": true,
                            "domain": domain,
                            "host": domainCacheConfig.host,
                            "port": domainCacheConfig.port,
                            "name": item.name,
                            "maxAge": item.maxAge == null ? domainCacheConfig.maxAge : item.maxAge,
                            "flush": item.flush,
                            "ignore": item.ignore,
                            "dataChangeRoute": domainCacheConfig.dataChangeRoute
                        };                        
                        return;
                    }
                });
            }
        }
        return retval;
    };
}