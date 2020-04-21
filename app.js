global.__APP_DIR = __dirname;
global.use = function (packagePath) {
    return require(__APP_DIR + "/" + packagePath);
};
const fs = require("fs");
const AppConfig = use("config/app");
const HostsConfig = use("config/hosts");
const HttpServer = use("network/http-server");
const CacheEngine = use("proxy/cache-engine");
let server = new HttpServer();
let cacheEngine = new CacheEngine();
cacheEngine.init(AppConfig.backendHost, AppConfig.backendPort);
server.addHandler(cacheEngine);
server.start(buildServerOption());
function buildServerOption() {
    var serverOptions = {
        "port": AppConfig.port,
        "ssl": {
            "enable": AppConfig.ssl.enable,
            "port": 443,
            "hosts": []
        }
    };
    if (serverOptions.ssl.enable) {
        serverOptions.ssl.port = AppConfig.ssl.port;
        for (const hostname in HostsConfig) {
            const host = HostsConfig[hostname];
            if (host.ssl != null && host.ssl.enable) {
                serverOptions.ssl.hosts.push({
                    "hostname": hostname,
                    "cert": fs.readFileSync(host.ssl.cert),
                    "key": fs.readFileSync(host.ssl.key),
                    "redirectHttp": host.ssl.redirectHttp
                });
            }
        }
    }
    return serverOptions;
}