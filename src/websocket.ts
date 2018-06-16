import * as url from "url";
import * as ws from "ws";
import deviceStore from "./deviceStore";
import engine from "./engine";
import actionHandler from "./actionHandler";
import psToolsHandler from "./psToolsHandler";
import vncProxy from "./vncProxy";

const server = new ws.Server({ port: 4000 });
console.log("ws listening");

server.on("connection", (socket, req) => {
  if (!req.url) return;
  const { pathname, query } = url.parse(req.url, true);
  if (pathname === "/vnc") vncProxy(socket, query);
  else {
    console.log("client connected");

    sendToSocket(
      socket,
      "DEVICE_DATA_ALL",
      deviceStore.getAccumulatedRecords()
    );

    socket.on("message", function incoming(message) {
      // @ts-ignore
      const data = JSON.parse(message);
      console.log(data.type + " received");

      switch (data.type) {
        case "REFRESH_DEVICE":
          engine.refresh(data.targets);
          break;

        case "DEVICE_ACTION":
          actionHandler(data.targets, data.action, data.parameters)
            .then(result =>
              sendToSocket(socket, "DEVICE_ACTION_RESPONSE", { result })
            )
            .catch(err => console.log(err));
          break;

        case "PSTOOLS_COMMAND":
          psToolsHandler(data.target, data.mode, data.cmd)
            .then(result =>
              sendToSocket(socket, "PSTOOLS_COMMAND_RESPONSE", { result })
            )
            .catch(err => console.log(err));
          break;

        default:
          break;
      }
    });
  }
});

const sendToSocket = (socket: ws, type: string, message: {}) => {
  console.log(type + " sent to socket");
  socket.send(JSON.stringify({ type, message }));
};

const broadcast = (type: string, message: {}) =>
  server.clients.forEach(client => {
    if (client.readyState === ws.OPEN) {
      client.send(JSON.stringify({ type, message }));
    }
  });

export { broadcast };
