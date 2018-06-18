import * as ws from "ws";
import actionHandler from "./actionHandler";
import deviceStore from "./deviceStore";
import engine from "./engine";
import psToolsHandler from "./psToolsHandler";

const server = new ws.Server({ port: 4000 });
console.log("WebSocket handler listening on port 4000");

server.on("connection", (socket, req) => {
  console.log("WebSocket handler connected to client");

  sendToSocket(socket, "DEVICE_DATA_ALL", deviceStore.getAccumulatedRecords());

  socket.on("message", function incoming(message) {
    const data: { [x: string]: any } = JSON.parse(message as string);
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
