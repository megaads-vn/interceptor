global.__homedir = __dirname;
const AppConfig = require(__homedir + "/config/app");
const HttpServer = require(__homedir + "/network/http-server");
const CacheEngine = require(__homedir + "/proxy/cache-engine");
const CacheCommander = require(__homedir + "/command/cache-commander");
let server = new HttpServer();
let cacheEngine = new CacheEngine();
let cacheCommander = new CacheCommander();
cacheEngine.init(AppConfig.backendHost, AppConfig.backendPort);
server.addHandler(cacheEngine);
server.addHandler(cacheCommander);
server.start({
    port: AppConfig.port
});