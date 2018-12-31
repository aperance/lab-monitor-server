/** @module websocket */

import * as ws from "ws";
import actionHandler from "./actionHandler";
import deviceStore from "./deviceStore";
import engine from "./engine";
import { websocket as log } from "./logger";
import psToolsHandler from "./psToolsHandler";
import { isWsMessage } from "./typeGuards";
import { PsToolsResponse, WsMessage, WsMessageTypeKeys } from "./types";

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
    type: WsMessageTypeKeys.DEVICE_DATA_ALL,
    payload: deviceStore.getAccumulatedRecords()
  });

  /**
   * On socket message event, parse message and call inboundMessageRouter.
   */
  socket.on("message", function incoming(inboundString) {
    // @ts-ignore
    const inboundObject = JSON.parse(inboundString as string) as unknown;
    if (isWsMessage(inboundObject)) inboundMessageRouter(socket, inboundObject);
  });
});

/**
 * Send message to client on the specifed socket.
 *
 * @param {ws} socket
 * @param {WsMessage} outboundMessage
 */
const sendToClient = (socket: ws, outboundMessage: WsMessage) => {
  log.info(outboundMessage.type + " sent to client");
  socket.send(JSON.stringify(outboundMessage));
};

/**
 * Send message to all clients connected to server.
 *
 * @param {WsMessage} outboundMessage
 */
const sendToAllClients = (outboundMessage: WsMessage) => {
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
 * @param {WsMessage} inboundMessage
 * @returns {Promise<void>}
 */
const inboundMessageRouter = async (socket: ws, inboundMessage: WsMessage) => {
  log.info(inboundMessage.type + " received");

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
        payload: actionResponse
      });
      break;

    case WsMessageTypeKeys.PSTOOLS_COMMAND:
      psToolsHandler(inboundMessage.payload, payload => {
        sendToClient(socket, {
          type: WsMessageTypeKeys.PSTOOLS_COMMAND_RESPONSE,
          payload
        });
      });
      break;

    default:
      break;
  }
};

export { sendToClient, sendToAllClients };
