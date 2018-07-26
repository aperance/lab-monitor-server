/** @module httpProxy */

import * as http from "http";
import * as httpProxy from "http-proxy";
import * as querystring from "querystring";
import { httpProxy as log } from "./logger";

const addressMap: Map<string, string> = new Map();
const proxyServer = httpProxy.createProxyServer({});

/**
 *
 */
const server = http.createServer((req, res) => {
  try {
    if (!req.connection.remoteAddress || !req.url)
      throw new Error("Unable to parse request data");

    const source = req.connection.remoteAddress.replace("::ffff:", "");

    let destination = querystring.parse(req.url.replace("/?", "")).target;

    if (typeof destination === "string") addressMap.set(source, destination);
    else destination = addressMap.get(source);

    if (!destination) throw new Error("No destination address provided");

    proxyServer.web(req, res, { target: `http://${destination}:8001` });
    log.info(`Proxying http from ${source} to ${destination}`);
  } catch (err) {
    log.error(err);

    res.writeHead(500, { "Content-Type": "text/plain" });
    res.write(err.message);
    res.end();
  }
});

server.listen(9000);
log.info("HTTP Proxy listening on port 9000");
