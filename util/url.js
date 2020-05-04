module.exports = new UrlUtil();
const CACHE_KEY_SAMPLE = ["domain", "routeName", "protocol", "device", "url"];
function UrlUtil() {
    this.buildCacheKey = function (obj) {
        var retval = "";
        CACHE_KEY_SAMPLE.forEach(key => {
            if (retval !== "") {
                retval += "::";
            }
            retval += obj[key];
        });
        return retval;
    }
    this.parseCacheKey = function (keyString) {
        var retval = {};
        let keySpliter = keyString.split("::");
        for (let index = 0; index < CACHE_KEY_SAMPLE.length; index++) {
            const key = CACHE_KEY_SAMPLE[index];
            retval[key] = keySpliter[index];
        }
        return retval;
    }
    this.removeParams = function (paramNames, url) {
        let retval = url;
        if (paramNames != null) {
            paramNames.forEach(paramName => {
                retval = retval.replace(buildParamRegExp(paramName), "");
            });
        }
        return retval;
    }
    var regExpStore = {};
    function buildParamRegExp(paramName) {
        let retval = regExpStore[paramName];
        if (retval == null) {
            retval = new RegExp("((&)*" + paramName + "=([^&]*))", "g");
            regExpStore[paramName] = retval;
        }
        return retval;
    }
}