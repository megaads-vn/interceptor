module.exports = new RuleParser();
var UrlPattern = require('url-pattern');
function RuleParser() {
    var urlPatterns = [];
    var cacheConfig;
    this.init = function (_cacheConfig) {
        cacheConfig = _cacheConfig;
        cacheConfig.routes.forEach(item => {
            let pattern = null;
            switch (item.type) {
                case 'regex':
                    pattern = new UrlPattern(new RegExp(item.pattern));
                    break;
                default:
                    pattern = new UrlPattern(item.pattern);
                    break;
            }
            item.urlPattern = pattern;
        });
    };
    this.parse = function (req) {
        let retval = null;
        if (cacheConfig.enable == true) {
            let cacheRoutes = cacheConfig.routes;
            cacheRoutes.forEach(item => {
                matches = item.urlPattern.match(req.url);
                if (matches != null) {
                    retval = {
                        "name": item.name,
                        "maxAge": item.maxAge == null ? cacheConfig.maxAge : item.maxAge,
                        "flush": item.flush
                    };
                    return;
                }
            });
        }
        return retval;
    };
}