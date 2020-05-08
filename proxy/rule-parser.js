module.exports = RuleParser;
var UrlPattern = require("url-pattern");
var urlParser = require("url");
var userAgentUtil = use("util/user-agent-util");
function RuleParser() {
    var hostsConfig;
    var parserCache = [];
    this.init = function (_hostsConfig) {
        hostsConfig = _hostsConfig;
        for (const domain in hostsConfig) {
            if (hostsConfig.hasOwnProperty(domain)) {
                let rules = (hostsConfig[domain].cache != null && hostsConfig[domain].cache.enable == true && hostsConfig[domain].cache.rules != null) ? hostsConfig[domain].cache.rules : [];
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
        let retval = null;
        const domain = req.headers.host;
        const domainConfig = hostsConfig[domain];
        if (domainConfig != null) {
            retval = {
                "enable": false,
                "domain": domain,
                "host": domainConfig.host,
                "port": domainConfig.port
            };
            // Conditions: method, headers["cookie"], headers["accept"], url, headers['user-agent']
            // check method and accept type
            if (domainConfig.cache != null
                && domainConfig.cache.enable == true
                && req.method === "GET"
                && (req.headers["accept"] != null
                    && (req.headers["accept"].indexOf("text/html") >= 0))
            ) {
                const urlPath = urlParser.parse(req.url).pathname;
                // check passes conditions
                let isPassed = false;
                if (domainConfig.cache.passes != null) {
                    // pass routes
                    if (domainConfig.cache.passes.routes != null
                        && domainConfig.cache.passes.routes.includes(urlPath) === true) {
                        isPassed = true;
                    }
                    // pass cookies
                    if (!isPassed
                        && domainConfig.cache.passes.cookies != null
                        && cookieIsContainAnyNames(req, domainConfig.cache.passes.cookies)) {
                        isPassed = true;
                    }
                }
                if (!isPassed) {
                    // check user device
                    const userDevice = userAgentUtil.detectDevice(req.headers['user-agent']);
                    if (domainConfig.cache.devices == null) {
                        retval["device"] = "all";
                    } else if (domainConfig.cache.devices.includes(userDevice)) {
                        retval["device"] = userDevice;
                    }
                    if (retval["device"] != null) {
                        let cacheRules = domainConfig.cache.rules != null ? domainConfig.cache.rules : [];
                        cacheRules.forEach(item => {
                            matches = item.urlPattern.match(urlPath);
                            if (matches != null) {
                                for (var property in domainConfig.cache) {
                                    retval[property] = domainConfig.cache[property];
                                }
                                for (var property in item) {
                                    retval[property] = domainConfig.cache[property];
                                }
                                retval["host"] = domainConfig.host;
                                retval["port"] = domainConfig.port;
                                retval["domain"] = domain;
                                retval["name"] = item.name;
                                return;
                            }
                        });
                    }
                }
            }
        }
        return retval;
    };
    function cookieIsContainAnyNames(req, names) {
        for (var i = 0; i < names.length; i++) {
            if (req.headers["cookie"] != null && req.headers["cookie"].indexOf(" " + names[i] + "=") > -1) {
                return true;
            }
        }
        return false;
    }
}