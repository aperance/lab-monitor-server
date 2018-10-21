/** @module vncProxy */

import * as net from "net";
import * as querystring from "querystring";
import * as ws from "ws";
import { vncProxy as log } from "./logger";

const server = new ws.Server({ port: 5000 });
log.info("VNC proxy listening on port 5000");

/**
 * On WebSocket connection, establish VNC (TCP) connection to target device,
 * begin passing data between the WebSocket and VNC connections.
 */
server.on("connection", (socket, req) => {
  if (!req.url) return;
  const { port, ip } = querystring.parse(req.url.replace("/?", ""));
  if (typeof port !== "string" || typeof ip !== "string") return;

  const tcp = net.createConnection(parseInt(port, 10), ip, () => {
    log.info("VNC proxy established");
  });

  socket.on("message", data => tcp.write(data));
  tcp.on("data", data =>
    socket.send(data, err => {
      if (err) {
        log.error("WS send error: " + err);
        tcp.end();
        socket.close();
      }
    })
  );

  /**
   * Disconnection and Error Handling
   */

  socket.on("close", () => {
    log.info("WS client disconnected");
    tcp.end();
  });

  tcp.on("end", () => {
    log.info("VNC target disconnected");
    socket.close();
  });

  socket.on("error", err => {
    log.error("WS client error: " + err);
    tcp.end();
    socket.close();
  });

  tcp.on("error", err => {
    log.error("VNC target error: " + err);
    tcp.end();
    socket.close();
  });
});
