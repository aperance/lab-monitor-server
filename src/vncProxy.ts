import * as net from "net";
import * as ws from "ws";
import * as querystring from "querystring";

const server = new ws.Server({ port: 5000 });
console.log("VNC proxy listening on port 5000");

server.on("connection", (socket, req) => {
  if (!req.url) return;
  const query = querystring.parse(req.url.replace("/?", ""));
  if (typeof query.port !== "string" || typeof query.ip !== "string") return;
  console.log("VNC proxy connected to client");

  const tcp = net.createConnection(parseInt(query.port), query.ip, () => {
    console.log("VNC proxy connected to remote server");
  });

  tcp.on("data", data => {
    try {
      socket.send(data);
    } catch (e) {
      console.log("Client closed, cleaning up target");
      tcp.end();
    }
  });

  tcp.on("end", () => {
    console.log("VNC target disconnected");
    socket.close();
  });

  tcp.on("error", () => {
    console.log("VNC target connection error");
    tcp.end();
    socket.close();
  });

  socket.on("message", (msg: any) => tcp.write(msg));

  socket.on("close", (code: any, reason: string) => {
    console.log("VNC proxy client disconnected: " + code + " [" + reason + "]");
    tcp.end();
  });

  socket.on("error", (e: any) => {
    console.log("VNC proxy client error: " + e);
    tcp.end();
  });
});
