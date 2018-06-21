import * as net from "net";
import * as querystring from "querystring";
import * as ws from "ws";
import { vncProxy as log } from "./logger";

const server = new ws.Server({ port: 5000 });
log.info("VNC proxy listening on port 5000");

server.on("connection", (socket, req) => {
  if (!req.url) return;
  const query = querystring.parse(req.url.replace("/?", ""));
  if (typeof query.port !== "string" || typeof query.ip !== "string") return;
  log.info("VNC proxy connected to client");

  const tcp = net.createConnection(parseInt(query.port, 10), query.ip, () => {
    log.info("VNC proxy connected to remote server");
  });

  tcp.on("data", data => {
    try {
      socket.send(data);
    } catch (e) {
      log.info("Client closed, cleaning up target");
      tcp.end();
    }
  });

  tcp.on("end", () => {
    log.info("VNC target disconnected");
    socket.close();
  });

  tcp.on("error", () => {
    log.info("VNC target connection error");
    tcp.end();
    socket.close();
  });

  socket.on("message", (msg: any) => tcp.write(msg));

  socket.on("close", (code: any, reason: string) => {
    log.info("VNC proxy client disconnected: " + code + " [" + reason + "]");
    tcp.end();
  });

  socket.on("error", (e: any) => {
    log.info("VNC proxy client error: " + e);
    tcp.end();
  });
});
