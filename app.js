global.__homedir = __dirname;
const AppConfig = require(__homedir + "/config/app");
const HttpServer = require(__homedir + "/network/http-server");
const CacheEngine = require(__homedir + "/proxy/cache-engine");
let server = new HttpServer();
let cacheEngine = new CacheEngine();
cacheEngine.init(AppConfig.backendHost, AppConfig.backendPort);
server.addHandler(cacheEngine);
server.start({
    port: AppConfig.port
});