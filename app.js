global.__homedir = __dirname;
global.use = function (packagePath) {
    return require(__homedir + "/" + packagePath);
};
const AppConfig = use("config/app");
const HttpServer = use("network/http-server");
const CacheEngine = use("proxy/cache-engine");
const CacheCommander = use("command/cache-commander");
let server = new HttpServer();
let cacheEngine = new CacheEngine();
let cacheCommander = new CacheCommander();
cacheEngine.init(AppConfig.backendHost, AppConfig.backendPort);
server.addHandler(cacheEngine);
server.addHandler(cacheCommander);
server.start({
    port: AppConfig.port
});