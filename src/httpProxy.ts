import * as http from "http";
import * as httpProxy from "http-proxy";
import * as querystring from "querystring";
import { httpProxy as log } from "./logger";

const proxy = httpProxy.createProxyServer({});
const addressMap: Map<string, string> = new Map();

const server = http.createServer((req, res) => {
  if (!req.connection.remoteAddress || !req.url) {
    log.error("Unable to parse request data");
    return;
  }

  const source = req.connection.remoteAddress.replace("::ffff:", "");
  let destination = querystring.parse(req.url.replace("/?", "")).target;

  if (typeof destination !== "string") destination = addressMap.get(source);
  else addressMap.set(source, destination);

  if (destination) {
    log.info(`Proxying http from ${source} to ${destination}`);
    proxy.web(req, res, { target: `http://${destination}:8001` });
  } else {
    log.warn(
      `Error proxying http from ${source}, no destination address provided`
    );
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.write("Error: No destination address provided");
    res.end();
  }
});

server.listen(9000);
log.info("HTTP Proxy listening on port 9000");
