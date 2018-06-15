const http_proxy = require("http-proxy");
const querystring = require("querystring");

exports.createHttpProxy = http => {
  const proxy = http_proxy.createProxyServer({});
  const addressMap = new Map();
  const server = http.createServer((req, res) => {
    const source = req.connection.remoteAddress.replace("::ffff:", "");
    let destination = querystring.parse(req.url.replace("/?", "")).target;

    if (destination) addressMap.set(source, destination);
    else destination = addressMap.get(source);

    if (destination)
      proxy.web(req, res, { target: `http://${destination}:8001` });
    else {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.write("Error: No destination address provided");
      res.end();
    }
  });
  console.log("HTTP Proxy listening on port 9000");
  server.listen(9000);
};
