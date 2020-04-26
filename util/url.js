module.exports = new UrlUtil();
function UrlUtil() {
    var regExps = {};
    this.removeParams = function (paramNames, url) {
        let retval = url;
        if (paramNames != null) {
            paramNames.forEach(paramName => {
                retval = retval.replace(buildParamRegExp(paramName), "");
            });
        }
        return retval;
    }
    function buildParamRegExp(paramName) {
        let retval = regExps[paramName];
        if (retval == null) {
            retval = new RegExp("((&)*" + paramName + "=([^&]*))", "g");
            regExps[paramName] = retval;
        }
        return retval;
    }
}