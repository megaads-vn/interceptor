module.exports = new UserAgentUtil();
var MobileDetect = require('mobile-detect');
var detectionCache = {};
var userAgentStorage = {};
function UserAgentUtil() {
    this.detectDevice = function (userAgent) {
        var retval = detectionCache[userAgent];
        if (retval == null) {
            let mobileDetect = new MobileDetect(userAgent);
            if (mobileDetect.tablet() != null) {
                retval = "tablet";
            } else if (mobileDetect.phone() != null || mobileDetect.mobile() != null) {
                retval = "mobile";
            } else {
                retval = "desktop";
            }
            if (mobileDetect.is('bot') === true) {
                retval += "_bot";
            }
            detectionCache[userAgent] = retval;
            userAgentStorage[retval] = userAgent;
        }
        return retval;
    }
    this.getUserAgent = function (device) {
        var retval = null;
        switch (device) {
            case "desktop": {
                retval = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36";
            }
            case "mobile": {
                retval = "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1";
            }
            case "table": {
                retval = "Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1";
            }
            default: {
                retval = userAgentStorage[device];
            }
        }
        return retval;
    }
}