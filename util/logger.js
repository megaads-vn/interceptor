module.exports = new Logger();
const AppConfig = use("config/app");
var fs = require("fs");
const colors = {
    normal: "\033[0m",
    info: "\033[0m",
    debug: "\033[32m",
    warning: "\033[33m",
    error: "\033[31m"
};
function Logger() {
    this.info = function (msg, outputData) {
        log(this, "info", msg, outputData);
    };

    this.debug = function (msg, outputData) {
        log(this, "debug", msg, outputData);
    };

    this.warning = function (msg, outputData) {
        log(this, "warning", msg, outputData);
    };

    this.error = function (msg, outputData) {
        log(this, "error", msg, outputData);
    };

    function log(obj, type, msg, outputData) {
        if (type === "debug" && AppConfig.debug === false) {
            return;
        }
        msg = msg == null ? "" : msg;
        outputData = outputData == null ? "" : outputData;
        if (type !== "info") {
            msg = "[" + new Date() + "] [" + type + "]: " + msg;
        }
        console.log(colors[type] + msg + colors.normal, outputData);
        var outputDataStr = "";
        try {
            outputDataStr = JSON.stringify(outputData);
        } catch (exc) {
        }
        fs.appendFile(__APP_DIR + "/storage/logs/interceptor.log", msg + " " + (outputData != "" ? outputDataStr : "") + " \r\n", function (err) { });
    }
}