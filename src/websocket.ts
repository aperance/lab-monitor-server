import * as ws from "ws";
import actionHandler from "./actionHandler";
import deviceStore from "./deviceStore";
import engine from "./engine";
import { websocket as log } from "./logger";
import psToolsHandler from "./psToolsHandler";

interface Message {
  type: MessageType;
  payload: {
    [key: string]: any;
  };
}

const enum MessageType {
  DeviceDataAll = "DEVICE_DATA_ALL",
  DeviceDataUpdate = "DEVICE_DATA_UPDATE",
  RefreshDevice = "REFRESH_DEVICE",
  DeviceAction = "DEVICE_ACTION",
  DeviceActionResponse = "DEVICE_ACTION_RESPONSE",
  PsToolsCommand = "PSTOOLS_COMMAND",
  PsToolsCommandResponse = "PSTOOLS_COMMAND_RESPONSE",
  UserDialog = "USER_DIALOG",
  Error = "ERROR"
}

const server = new ws.Server({ port: 4000 });
log.info("WebSocket handler listening on port 4000");

server.on("connection", (socket, req) => {
  log.info("WebSocket handler connected to client");

  sendToClient(socket, {
    type: MessageType.DeviceDataAll,
    payload: deviceStore.getAccumulatedRecords()
  });

  socket.on("message", function incoming(messageString) {
    const inboundMessage = JSON.parse(messageString as string);
    if (!inboundMessage.type || !inboundMessage.payload) return;
    log.info(inboundMessage.type + " received");

    switch (inboundMessage.type) {
      case MessageType.RefreshDevice:
        engine.refresh(inboundMessage.payload.targets);
        break;

      case MessageType.DeviceAction:
        actionHandler(inboundMessage.payload).then(results => {
          sendToClient(socket, {
            type: MessageType.DeviceActionResponse,
            payload: results
          });
        });
        break;

      case MessageType.PsToolsCommand:
        psToolsHandler(
          inboundMessage.payload.target,
          inboundMessage.payload.mode,
          inboundMessage.payload.cmd
        )
          .then(result =>
            sendToClient(socket, {
              type: MessageType.PsToolsCommandResponse,
              payload: { result }
            })
          )
          .catch(err => log.error(err));
        break;

      default:
        break;
    }
  });
});

const sendToClient = (socket: ws, message: Message) => {
  log.info(message.type + " sent to socket");
  socket.send(JSON.stringify(message));
};

const sendToAllClients = (message: Message) =>
  server.clients.forEach(client => {
    if (client.readyState === ws.OPEN) {
      client.send(JSON.stringify(message));
    }
  });

export { sendToClient, sendToAllClients, Message, MessageType };
