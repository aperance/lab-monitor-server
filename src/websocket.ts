/* eslint-disable no-case-declarations */
/** @module websocket */

import * as ws from "ws";
import actionHandler from "./actionHandler";
import deviceStore from "./deviceStore";
import engine from "./engine";
import { websocket as log } from "./logger";
import psToolsHandler from "./psToolsHandler";

export const enum WsMessageTypeKeys {
  CONFIGURATION = "CONFIGURATION",
  DEVICE_DATA_ALL = "DEVICE_DATA_ALL",
  DEVICE_DATA_UPDATE = "DEVICE_DATA_UPDATE",
  REFRESH_DEVICE = "REFRESH_DEVICE",
  CLEAR_DEVICE = "CLEAR_DEVICE",
  DEVICE_ACTION = "DEVICE_ACTION",
  DEVICE_ACTION_RESPONSE = "DEVICE_ACTION_RESPONSE",
  PSTOOLS_COMMAND = "PSTOOLS_COMMAND",
  PSTOOLS_COMMAND_RESPONSE = "PSTOOLS_COMMAND_RESPONSE",
  USER_DIALOG = "USER_DIALOG",
  ERROR = "ERROR",
}

interface WsMessage {
  type: WsMessageTypeKeys;
  payload: {
    [key: string]: any;
  };
}

const port =
  process.env.DEMO_ROLE === "primary" ? process.env.PORT || "4000" : "4000";

/**
 * Create new WebSocket server.
 */
const server = new ws.Server({ port: parseInt(port) });
console.log("WebSocket handler listening on port " + port);
log.info("WebSocket handler listening on port " + port);

/**
 * On WebSocket connection event:
 * 1. Reply to client with full device records.
 * 2. Set message event listener for current socket.
 */
server.on("connection", (socket, req) => {
  log.info("WebSocket handler connected to client");

  sendToClient(socket, {
    type: WsMessageTypeKeys.DEVICE_DATA_ALL,
    payload: deviceStore.getAccumulatedRecords(),
  });

  /**
   * On socket message event, parse message and call inboundMessageRouter.
   */
  socket.on("message", function incoming(data: string) {
    const { type, payload }: { [key: string]: unknown } = JSON.parse(data);
    if (typeof type === "string" && typeof payload === "object" && payload)
      inboundMessageRouter(socket, { type, payload } as WsMessage);
  });
});

/**
 * Send message to client on the specifed socket.
 *
 * @param {ws} socket
 * @param {WsMessage} outboundMessage
 */
const sendToClient = (socket: ws, outboundMessage: WsMessage): void => {
  log.info(outboundMessage.type + " sent to client");
  socket.send(JSON.stringify(outboundMessage));
};

/**
 * Send message to all clients connected to server.
 *
 * @param {WsMessage} outboundMessage
 */
const sendToAllClients = (outboundMessage: WsMessage): void => {
  server.clients.forEach((client) => {
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
 * @param {WsMessage} inboundMessage
 * @returns {Promise<void>}
 */
const inboundMessageRouter = async (socket: ws, inboundMessage: WsMessage) => {
  log.info(inboundMessage.type + " received");

  if (process.env.DEMO === "true") {
    sendToClient(socket, {
      type: WsMessageTypeKeys.DEVICE_ACTION_RESPONSE,
      payload: {
        err: "Functionality not available in demo mode.",
        results: null,
      },
    });
    return;
  }

  switch (inboundMessage.type) {
    case WsMessageTypeKeys.REFRESH_DEVICE:
      engine.refresh(inboundMessage.payload.targets);
      break;

    case WsMessageTypeKeys.CLEAR_DEVICE:
      deviceStore.clear(inboundMessage.payload.targets);
      engine.refresh(inboundMessage.payload.targets);
      break;

    case WsMessageTypeKeys.DEVICE_ACTION:
      const actionResponse = await actionHandler(inboundMessage.payload);
      sendToClient(socket, {
        type: WsMessageTypeKeys.DEVICE_ACTION_RESPONSE,
        payload: actionResponse,
      });
      break;

    case WsMessageTypeKeys.PSTOOLS_COMMAND:
      psToolsHandler(inboundMessage.payload, (payload) => {
        sendToClient(socket, {
          type: WsMessageTypeKeys.PSTOOLS_COMMAND_RESPONSE,
          payload,
        });
      });
      break;

    default:
      break;
  }
};

export { sendToClient, sendToAllClients };
