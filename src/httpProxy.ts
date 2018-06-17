import * as http from "http";
import * as httpProxy from "http-proxy";
import * as querystring from "querystring";

const proxy = httpProxy.createProxyServer({});
const addressMap: Map<string, string> = new Map();

const server = http.createServer((req, res) => {
  if (!req.connection.remoteAddress || !req.url) return;
  const source = req.connection.remoteAddress.replace("::ffff:", "");
  let destination = querystring.parse(req.url.replace("/?", "")).target;

  if (typeof destination !== "string") destination = addressMap.get(source);
  else addressMap.set(source, destination);

  if (destination)
    proxy.web(req, res, { target: `http://${destination}:8001` });
  else {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.write("Error: No destination address provided");
    res.end();
  }
});

server.listen(9000);
console.log("HTTP Proxy listening on port 9000");
