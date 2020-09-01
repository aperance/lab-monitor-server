/**
 * Handles sending and receiving of data to client over web socket connection.
 * @packageDocumentation
 */

import ws from "ws";
import { IncomingMessage } from "http";
import { Socket } from "net";
import yup from "yup";
import { refresh } from "./app.js";
import actionHandler, { ActionResponse } from "./actionHandler.js";
import psToolsHandler, { PsToolsResponse } from "./psToolsHandler.js";
import deviceStore, {
  AccumulatedRecords,
  RecordUpdate
} from "./deviceStore.js";
import { websocket as log } from "./logger.js";

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
  ERROR = "ERROR"
}

interface InboundMessage {
  type?: WsMessageTypeKeys;
  payload?: unknown;
}

interface OutboundMessage {
  type: WsMessageTypeKeys;
  payload: ActionResponse | PsToolsResponse | AccumulatedRecords | RecordUpdate;
}

/**
 * Create new WebSocket server.
 */
const server = new ws.Server({ noServer: true });

/**
 * On WebSocket connection event:
 * 1. Reply to client with full device records.
 * 2. Set message event listener for current socket.
 */
function connectionHandler(
  request: IncomingMessage,
  socket: Socket,
  head: Buffer
): void {
  server.handleUpgrade(request, socket, head, function done(ws) {
    log.info("WebSocket handler connected to client");

    ws.on("message", function incoming(data: ws.Data) {
      const message = JSON.parse(data as string);
      inboundMessageRouter(ws, message);
    });

    sendToClient(ws, {
      type: WsMessageTypeKeys.DEVICE_DATA_ALL,
      payload: deviceStore.getAccumulatedRecords()
    });
  });
}

/**
 * Send message to individual client on the provided socket.
 */
function sendToClient(ws: ws, outboundMessage: OutboundMessage): void {
  log.info(outboundMessage.type + " sent to client");
  ws.send(JSON.stringify(outboundMessage));
}

/**
 * Send message to all clients connected to server.
 */
function sendToAllClients(outboundMessage: OutboundMessage): void {
  server.clients.forEach((client) => {
    if (client.readyState === ws.OPEN) {
      client.send(JSON.stringify(outboundMessage));
    }
  });
}

/**
 * Routes incoming ws messages to intended handlers.
 * Data returned from some handlers are sent back to client.
 */
async function inboundMessageRouter(ws: ws, message: InboundMessage) {
  const { object, string, array } = yup;
  console.log(message);

  try {
    switch (message.type) {
      /** */
      case WsMessageTypeKeys.REFRESH_DEVICE: {
        const schema = object({
          targets: array().of(string().defined())
        }).defined();

        const { targets } = await schema.validate(message.payload);
        refresh(targets);
        break;
      }

      /** */
      case WsMessageTypeKeys.CLEAR_DEVICE: {
        const schema = object({
          targets: array().of(string().defined())
        }).defined();

        const { targets } = await schema.validate(message.payload);
        deviceStore.clear(targets);
        refresh(targets);
        break;
      }

      /** */
      case WsMessageTypeKeys.DEVICE_ACTION: {
        const schema = object({
          target: array().of(string().defined()).required(),
          type: string().required(),
          parameters: object()
        }).defined();

        const request = await schema.validate(message.payload);
        const response = await actionHandler(request);
        sendToClient(ws, {
          type: WsMessageTypeKeys.DEVICE_ACTION_RESPONSE,
          payload: response
        });
        break;
      }

      /** */
      case WsMessageTypeKeys.PSTOOLS_COMMAND: {
        const schema = object({
          target: string(),
          mode: string(),
          argument: string()
        }).defined();

        const request = await schema.validate(message.payload);
        psToolsHandler(request, (response) => {
          sendToClient(ws, {
            type: WsMessageTypeKeys.PSTOOLS_COMMAND_RESPONSE,
            payload: response
          });
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    log.error(err);
    sendToClient(ws, {
      type: WsMessageTypeKeys.ERROR,
      payload: err
    });
  }
}

export { connectionHandler, sendToAllClients };
