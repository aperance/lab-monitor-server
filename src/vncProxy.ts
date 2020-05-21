/** @module vncProxy */

import * as net from "net";
import * as querystring from "querystring";
import * as ws from "ws";
import {vncProxy as log} from "./logger";

const port =
  process.env.DEMO_ROLE === "vnc" ? process.env.PORT || "5000" : "5000";

/**
 * Create new WebSocket server.
 */
const server = new ws.Server({port: parseInt(port)});
console.log("VNC proxy listening on port " + port);
log.info("VNC proxy listening on port " + port);

/**
 * On WebSocket connection, establish VNC (TCP) connection to target device,
 * begin passing data between the WebSocket and VNC connections.
 */
server.on("connection", (socket, req) => {
  if (!req.url) return;
  const {port, ip} = querystring.parse(req.url.replace("/?", ""));
  if (typeof port !== "string" || typeof ip !== "string") return;

  const tcp = net.createConnection(parseInt(port, 10), ip, () => {
    log.info("VNC proxy established");
  });

  socket.on("message", data => tcp.write(data as string));
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
