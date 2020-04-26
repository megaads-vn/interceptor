module.exports = new ProxyPass();
var http = require('http');
var logger = use("util/logger");
function ProxyPass() {
    this.pass = function (domain, host, port, req, res) {
        let options = buildRequestOptions(domain, req, host, port);
        let proxy = http.request(options, function (proxyRes) {
            res.writeHead(proxyRes.statusCode, proxyRes.headers)
            proxyRes.pipe(res, {
                end: true
            });
        }).on("error", (err) => {
            logger.error("ProxyPass pass exception: " + err.message);
            logger.error("- domain: ", domain);
            logger.error("- host: ", host);
            logger.error("- port: ", port);
            logger.error("- url: ", req.url);
        });
        req.pipe(proxy, {
            end: true
        });
    };
    this.request = function (domain, host, port, req, res, callBackFn) {
        let options = buildRequestOptions(domain, req, host, port);
        let proxy = http.request(options, function (proxyRes) {
            let contentType = proxyRes.headers["content-type"];
            if (contentType != null && contentType.indexOf("text/html") >= 0) {
                let buffer = [];
                proxyRes.on('data', function (chunk) {
                    buffer.push(chunk);
                });
                proxyRes.on('end', function () {
                    buffer = Buffer.concat(buffer);
                    callBackFn({
                        "statusCode": proxyRes.statusCode,
                        "headers": proxyRes.headers,
                        "data": buffer
                    });
                });
            } else {
                res.writeHead(proxyRes.statusCode, proxyRes.headers)
                proxyRes.pipe(res, {
                    end: true
                });
            }
        }).on("error", (err) => {
            logger.error("ProxyPass request exception: " + err.message);
            logger.error("- domain: ", domain);
            logger.error("- host: ", host);
            logger.error("- port: ", port);
            logger.error("- url: ", req.url);
        });
        req.pipe(proxy, {
            end: true
        });
    }
    function buildRequestOptions(domain, req, host, port) {
        let options = {
            "hostname": host || req.headers.host,
            "port": port || 80,
            "path": req.url,
            "method": req.method,
            "headers": req.headers,
            "gzip": true
        };
        options.headers["host"] = domain;
        if (req.protocol == "https") {
            //options.headers["X-Forwarded-Host"] = domain;
            options.headers["X-Forwarded-For"] = req.connection.remoteAddress;
            options.headers["X_FORWARDED_PROTO"] = "https";
            options.headers["X-Forwarded-Proto"] = "https";
            options.headers["HTTP_X_FORWARDED_PROTO"] = "https"
            options.headers["HTTPS"] = "on";
        }
        return options;
    }
}