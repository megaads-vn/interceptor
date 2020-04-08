module.exports = new ProxyPass();
var http = require('http');
function ProxyPass() {
    this.pass = function (domain, host, port, req, res) {
        let options = {
            "hostname": host || req.headers.host,
            "port": port || 80,
            "path": req.url,
            "method": req.method,
            "headers": req.headers,
            "gzip": true
        };
        options.headers.host = domain;
        let proxy = http.request(options, function (proxyRes) {
            res.writeHead(proxyRes.statusCode, proxyRes.headers)
            proxyRes.pipe(res, {
                end: true
            });
        });
        req.pipe(proxy, {
            end: true
        });
    };
    this.request = function (domain, host, port, req, res, callBackFn) {
        let options = {
            hostname: host,
            port: port,
            path: req.url,
            method: req.method,
            headers: req.headers,
            gzip: true
        };
        options.headers["host"] = domain;
        http.get(options, function (proxyRes) {
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
            console.log("Error: " + err.message);
        });
    }
}