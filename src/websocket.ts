/** @module websocket */

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

/**
 * Create new WebSocket server on port 4000.
 */
const server = new ws.Server({ port: 4000 });
log.info("WebSocket handler listening on port 4000");

/**
 * On WebSocket connection event:
 * 1. Reply to client with full device records.
 * 2. Set message event listener for current socket.
 */
server.on("connection", (socket, req) => {
  log.info("WebSocket handler connected to client");

  sendToClient(socket, {
    type: MessageType.DeviceDataAll,
    payload: deviceStore.getAccumulatedRecords()
  });

  /**
   * On socket message event, parse message and call inboundMessageRouter.
   */
  socket.on("message", function incoming(messageString) {
    const inboundMessage = JSON.parse(messageString as string);
    inboundMessageRouter(socket, inboundMessage);
  });
});

/**
 * Send message to client on the specifed socket.
 *
 * @param {ws} socket
 * @param {Message} outboundMessage
 */
const sendToClient = (socket: ws, outboundMessage: Message) => {
  log.info(outboundMessage.type + " sent to client");
  socket.send(JSON.stringify(outboundMessage));
};

/**
 * Send message to all clients connected to server.
 *
 * @param {Message} outboundMessage
 */
const sendToAllClients = (outboundMessage: Message) => {
  server.clients.forEach(client => {
    if (client.readyState === ws.OPEN) {
      client.send(JSON.stringify(outboundMessage));
    }
  });
};

/**
 * Routes incoming ws messages to intended handlers.
 * Data returned from handlers are sent back to client.
 *
 * @async
 * @param {ws} socket
 * @param {Message} inboundMessage
 * @returns {Promise<void>}
 */
const inboundMessageRouter = async (socket: ws, inboundMessage: Message) => {
  if (!inboundMessage.type || !inboundMessage.payload) return;
  log.info(inboundMessage.type + " received");

  switch (inboundMessage.type) {
    case MessageType.RefreshDevice:
      engine.refresh(inboundMessage.payload.targets);
      break;

    case MessageType.DeviceAction:
      const actionResponse = await actionHandler(inboundMessage.payload);
      sendToClient(socket, {
        type: MessageType.DeviceActionResponse,
        payload: actionResponse
      });
      break;

    case MessageType.PsToolsCommand:
      const psToolsResponse = await psToolsHandler(inboundMessage.payload);
      sendToClient(socket, {
        type: MessageType.PsToolsCommandResponse,
        payload: psToolsResponse
      });
      break;

    default:
      break;
  }
};

export { sendToClient, sendToAllClients, Message, MessageType };
