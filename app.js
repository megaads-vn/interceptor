global.__APP_DIR = __dirname;
global.use = function (packagePath) {
    return require(__APP_DIR + "/" + packagePath);
};
const cluster = require('cluster');
const logger = use("util/logger");
const AppConfig = use("config/app");
const fs = require("fs");
const HostsConfig = use("config/hosts");
const HttpServer = use("network/http-server");
const CacheEngine = use("proxy/cache-engine");
if (cluster.isMaster) {
    masterProcess();
} else {
    childProcess();
}
cluster.on('exit', function (worker) {
    logger.info('Worker %d died :(', worker.id);
    cluster.fork();
});
function masterProcess() {
    logger.info(`Master ${process.pid} is running`);
    for (let i = 0; i < AppConfig.clusters; i++) {
        logger.info(`Forking process number ${i}...`);
        var worker = cluster.fork();
        worker.send({
            task: 'boot',
            data: {}
        });
    }
}
function childProcess() {
    process.on('message', function (msg) {
        if (msg.task === 'boot') {
            let server = new HttpServer();
            let cacheEngine = new CacheEngine();
            cacheEngine.init(AppConfig.cache);
            server.addHandler(cacheEngine);
            server.start(buildServerOption());
        }
    });
}
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
                    "ca": fs.readFileSync(host.ssl.ca),
                    "redirectHttp": host.ssl.redirectHttp
                });
            }
        }
    }
    return serverOptions;
}