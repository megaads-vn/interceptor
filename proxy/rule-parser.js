module.exports = new RuleParser();
var UrlPattern = require('url-pattern');
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
            let cacheRules = domainCacheConfig.rules;
            cacheRules.forEach(item => {
                matches = item.urlPattern.match(req.url);
                if (matches != null) {
                    retval = {
                        "enable": req.method === "GET" ? domainCacheConfig.enable : false,
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
        return retval;
    };
}