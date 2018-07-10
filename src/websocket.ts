import * as ws from "ws";
import actionHandler from "./actionHandler";
import deviceStore from "./deviceStore";
import engine from "./engine";
import { websocket as log } from "./logger";
import psToolsHandler from "./psToolsHandler";

const server = new ws.Server({ port: 4000 });
log.info("WebSocket handler listening on port 4000");

server.on("connection", (socket, req) => {
  log.info("WebSocket handler connected to client");

  sendToSocket(socket, "DEVICE_DATA_ALL", deviceStore.getAccumulatedRecords());

  socket.on("message", function incoming(message) {
    const { type, payload } = JSON.parse(message as string);
    if (!type || !payload) return;
    log.info(type + " received");
    messageRouter(socket, type, payload);
  });
});

const messageRouter = (socket: ws, type: string, payload: any) => {
  switch (type) {
    case "REFRESH_DEVICE":
      engine.refresh(payload.targets);
      break;

    case "DEVICE_ACTION":
      actionHandler(payload.targets, payload.action, payload.parameters)
        .then(result =>
          sendToSocket(socket, "DEVICE_ACTION_RESPONSE", { result })
        )
        .catch(err => log.error(err));
      break;

    case "PSTOOLS_COMMAND":
      psToolsHandler(payload.target, payload.mode, payload.cmd)
        .then(result =>
          sendToSocket(socket, "PSTOOLS_COMMAND_RESPONSE", { result })
        )
        .catch(err => log.error(err));
      break;

    default:
      break;
  }
};

const sendToSocket = (socket: ws, type: string, payload: {}) => {
  log.info(type + " sent to socket");
  socket.send(JSON.stringify({ type, payload }));
};

const broadcast = (type: string, payload: {}) =>
  server.clients.forEach(client => {
    if (client.readyState === ws.OPEN) {
      client.send(JSON.stringify({ type, payload }));
    }
  });

export { broadcast };
