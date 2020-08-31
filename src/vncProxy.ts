import { IncomingMessage } from "http";
import net from "net";
import querystring from "querystring";
import ws from "ws";
import { vncProxy as log } from "./logger.js";

/**
 * Create new WebSocket server.
 */
const server = new ws.Server({ noServer: true });

/**
 * On WebSocket connection, establish VNC (TCP) connection to target device,
 * begin passing data between the WebSocket and VNC connections.
 */
function connectionHandler(
  request: IncomingMessage,
  socket: net.Socket,
  head: Buffer
): void {
  server.handleUpgrade(request, socket, head, function done(socket) {
    //server.emit("connection", ws, request);
    console.log("VNC CONNECTED");
    const { port, ip } = querystring.parse(
      request.url?.replace(/.*\?/, "") ?? ""
    );
    if (typeof port !== "string" || typeof ip !== "string") {
      log.error("invalid query string from client: " + request.url);
      return;
    }

    const tcp = net.createConnection(parseInt(port, 10), ip, () => {
      log.info("VNC proxy established");
    });

    socket.on("message", (data) => tcp.write(data as string));
    tcp.on("data", (data) =>
      socket.send(data, (err) => {
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

    socket.on("error", (err) => {
      log.error("WS client error: " + err);
      tcp.end();
      socket.close();
    });

    tcp.on("error", (err) => {
      log.error("VNC target error: " + err);
      tcp.end();
      socket.close();
    });
  });
}

// server.on("connection", (socket, req) => {
//   const { port, ip } = querystring.parse(req.url?.replace(/.*\?/, "") ?? "");
//   if (typeof port !== "string" || typeof ip !== "string") {
//     log.error("invalid query string from client: " + req.url);
//     return;
//   }

//   const tcp = net.createConnection(parseInt(port, 10), ip, () => {
//     log.info("VNC proxy established");
//   });

//   socket.on("message", (data) => tcp.write(data as string));
//   tcp.on("data", (data) =>
//     socket.send(data, (err) => {
//       if (err) {
//         log.error("WS send error: " + err);
//         tcp.end();
//         socket.close();
//       }
//     })
//   );

//   /**
//    * Disconnection and Error Handling
//    */

//   socket.on("close", () => {
//     log.info("WS client disconnected");
//     tcp.end();
//   });

//   tcp.on("end", () => {
//     log.info("VNC target disconnected");
//     socket.close();
//   });

//   socket.on("error", (err) => {
//     log.error("WS client error: " + err);
//     tcp.end();
//     socket.close();
//   });

//   tcp.on("error", (err) => {
//     log.error("VNC target error: " + err);
//     tcp.end();
//     socket.close();
//   });
// });

export { connectionHandler };
