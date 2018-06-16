import * as net from "net";

const createVncProxy = (socket: any, query: any) => {
  console.log("vnc ws received");

  const tcp = net.createConnection(query.port, query.ip, () => {
    console.log("Connected to VNC server");
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
    console.log("target disconnected");
    socket.close();
  });

  tcp.on("error", () => {
    console.log("target connection error");
    tcp.end();
    socket.close();
  });

  socket.on("message", (msg: any) => tcp.write(msg));

  socket.on("close", (code: any, reason: string) => {
    console.log("WebSocket client disconnected: " + code + " [" + reason + "]");
    tcp.end();
  });

  socket.on("error", (e: any) => {
    console.log("WebSocket client error: " + e);
    tcp.end();
  });
};

export default createVncProxy;
