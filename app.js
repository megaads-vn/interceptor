global.__homedir = __dirname;
global.use = function (packagePath) {
    return require(__homedir + "/" + packagePath);
};
const AppConfig = use("config/app");
const HttpServer = use("network/http-server");
const CacheEngine = use("proxy/cache-engine");
let server = new HttpServer();
let cacheEngine = new CacheEngine();
cacheEngine.init(AppConfig.backendHost, AppConfig.backendPort);
server.addHandler(cacheEngine);
server.start({
    port: AppConfig.port
});