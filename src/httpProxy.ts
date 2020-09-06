import http from "http";
import httpProxy from "http-proxy";
import { URL } from "url";
import { httpProxy as log } from "./logger.js";

/** Cache target IP addresses */
const addressMap: Map<string, string> = new Map();

/**
 * HTTP proxy to be used in situations that the client and device are on isolated networks.
 * Requests are made to this server with IP address of target device in query string.
 */
function proxyHandler(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  try {
    if (!req.connection.remoteAddress || !req.url)
      throw Error("Unable to parse request data");

    const src = req.connection.remoteAddress.replace("::ffff:", "");
    let dst = new URL(req.url, `http://${src}`).searchParams.get("target");

    if (dst) addressMap.set(src, dst);
    else dst = addressMap.get(src) || null;

    if (dst === null) throw Error("No destination address provided");

    httpProxy
      .createProxyServer()
      .on("proxyRes", (proxyRes, req, res) => {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      })
      .web(req, res, { target: `http://${dst}:8001` });

    log.info(`Proxying http from ${src} to ${dst}`);
  } catch (err) {
    log.error(err);

    res.writeHead(500, { "Content-Type": "text/plain" });
    res.write(err.message);
    res.end();
  }
}

export default proxyHandler;
