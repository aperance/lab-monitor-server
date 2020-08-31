import { IncomingMessage } from "http";
import net from "net";
import url from "url";
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
  server.handleUpgrade(request, socket, head, function done(ws) {
    const { port, ip } = url.parse(request.url || "", true).query;

    if (typeof port !== "string" || typeof ip !== "string") {
      log.error("invalid query string from client: " + request.url);
      return;
    }

    const tcp = net.createConnection(parseInt(port, 10), ip, () => {
      log.info("VNC proxy established");
    });

    ws.on("message", (data) => tcp.write(data as string));

    tcp.on("data", (data) =>
      ws.send(data, (err) => {
        if (err) {
          log.error("WS send error: " + err);
          tcp.end();
          ws.close();
        }
      })
    );

    /** Disconnection and Error Handling */

    ws.on("close", () => {
      log.info("WS client disconnected");
      tcp.end();
    });

    tcp.on("end", () => {
      log.info("VNC target disconnected");
      ws.close();
    });

    ws.on("error", (err) => {
      log.error("WS client error: " + err);
      tcp.end();
      ws.close();
    });

    tcp.on("error", (err) => {
      log.error("VNC target error: " + err);
      tcp.end();
      ws.close();
    });
  });
}

export { connectionHandler };
