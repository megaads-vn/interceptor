module.exports = new UserAgentUtil();
var MobileDetect = require('mobile-detect');
var detectionCache = {};
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
            detectionCache[userAgent] = retval;
        }
        return retval;
    }
}