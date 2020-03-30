global.__dir = __dirname;
const AppConfig =  require(__dir + "/config/app");
const HttpServer =  require(__dir + "/network/http-server");
const CacheEngine =  require(__dir + "/proxy/cache-engine");
let server = new HttpServer();
let cacheEngine = new CacheEngine();
cacheEngine.init(AppConfig.backendHost, AppConfig.backendPort);
server.addHandler(cacheEngine);
server.start({
    port: AppConfig.port
});