#!/usr/bin/env node
const program = require('commander');
const HybridCache = require("mega-hybrid-cache");
var hybridCache = new HybridCache({
    limit: 1024
});
program
    .command("get <domain>")
    .option('-r, --route <route>', 'Route Name')
    .option('-d, --device <device>', 'Device')
    .option('-u, --url <url>', 'URL')
    .option('-k, --key <key>', 'URL')
    .description("Monitor cache data")
    .action((domain, cmd) => {
        const routeName = cmd.route;
        const device = cmd.device;
        const url = cmd.url;
        const key = cmd.key;
        if (key != null) {
            console.log(hybridCache.get(key));
        } else if (device != null && url != null) {
            console.log(hybridCache.get(domain + "::" + routeName + "::" + device + "::" + url));
        } else if (routeName != null) {
            console.log(hybridCache.keys(domain + "::" + routeName + "::*"));
        } else {
            console.log(hybridCache.keys());
        }
    });
program
    .command("flush <domain>")
    .option('-r, --route <route>', 'Route Name')
    .option('-d, --device <device>', 'Device')
    .option('-u, --url <url>', 'URL')
    .option('-k, --key <key>', 'URL')
    .description("Monitor cache data")
    .action((domain, cmd) => {
        const routeName = cmd.route;
        const device = cmd.device;
        const url = cmd.url;
        const key = cmd.key;
        if (key != null) {
            console.log(hybridCache.get(key));
        } else if (device != null && url != null) {
            console.log(hybridCache.get(domain + "::" + routeName + "::" + device + "::" + url));
        } else if (routeName != null) {
            console.log(hybridCache.keys(domain + "::" + routeName + "::*"));
        } else {
            console.log("get all cache keys");
            console.log(hybridCache.keys());
        }

    });
program.parse(process.argv);