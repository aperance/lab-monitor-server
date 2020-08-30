/**
 * Handles sending and receiving of data to client over web socket connection.
 * @packageDocumentation
 */

import Ajv from "ajv";
import ws from "ws";
import actionHandler, {
  ActionRequest,
  ActionResponse,
} from "./actionHandler.js";
import deviceStore, {
  AccumulatedRecords,
  RecordUpdate,
} from "./deviceStore.js";
import { refresh } from "./app.js";
import { websocket as log } from "./logger.js";
import psToolsHandler, {
  PsToolsRequest,
  PsToolsResponse,
} from "./psToolsHandler.js";

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

interface InboundMessage {
  type?: WsMessageTypeKeys;
  payload?: unknown;
}

interface OutboundMessage {
  type: WsMessageTypeKeys;
  payload: ActionResponse | PsToolsResponse | AccumulatedRecords | RecordUpdate;
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
server.on("connection", (socket) => {
  log.info("WebSocket handler connected to client");

  sendToClient(socket, {
    type: WsMessageTypeKeys.DEVICE_DATA_ALL,
    payload: deviceStore.getAccumulatedRecords(),
  });

  socket.on("message", function incoming(data: ws.Data) {
    const message = JSON.parse(data as string);
    inboundMessageRouter(socket, message);
  });
});

/**
 * Send message to individual client on the provided socket.
 */
function sendToClient(socket: ws, outboundMessage: OutboundMessage): void {
  log.info(outboundMessage.type + " sent to client");
  socket.send(JSON.stringify(outboundMessage));
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
function inboundMessageRouter(socket: ws, message: InboundMessage) {
  const { type, payload } = message;
  log.info(type + " received");

  switch (type) {
    case WsMessageTypeKeys.REFRESH_DEVICE:
      if (isEngineRequest(payload)) refresh(payload.targets);
      break;

    case WsMessageTypeKeys.CLEAR_DEVICE:
      if (isEngineRequest(payload)) {
        deviceStore.clear(payload.targets);
        refresh(payload.targets);
      }
      break;

    case WsMessageTypeKeys.DEVICE_ACTION:
      if (isActionRequest(payload))
        actionHandler(payload as ActionRequest).then((actionResponse) =>
          sendToClient(socket, {
            type: WsMessageTypeKeys.DEVICE_ACTION_RESPONSE,
            payload: actionResponse,
          })
        );
      break;

    case WsMessageTypeKeys.PSTOOLS_COMMAND:
      if (isPsToolsRequest(payload))
        psToolsHandler(payload as PsToolsRequest, (result) => {
          sendToClient(socket, {
            type: WsMessageTypeKeys.PSTOOLS_COMMAND_RESPONSE,
            payload: result,
          });
        });
      break;

    default:
      break;
  }
}

/**
 *
 */
function isEngineRequest(payload: unknown): payload is { targets?: string[] } {
  const ajv = new Ajv();
  const schema = {
    properties: { targets: { type: "array" } },
    additionalProperties: false,
    required: [],
  };

  if (ajv.validate(schema, payload)) return true;
  log.error(ajv.errorsText());
  return false;
}

/**
 *
 */
function isActionRequest(payload: unknown): payload is ActionRequest {
  const ajv = new Ajv();
  const schema = {
    properties: {
      targets: { type: "array" },
      type: { type: "string" },
      parameters: { type: "object" },
    },
    additionalProperties: false,
    required: ["targets", "type"],
  };

  if (ajv.validate(schema, payload)) return true;
  log.error(ajv.errorsText());
  return false;
}

/**
 *
 */
function isPsToolsRequest(payload: unknown): payload is PsToolsRequest {
  const ajv = new Ajv();
  const schema = {
    properties: {
      target: { type: "string" },
      mode: { type: "string" },
      argument: { type: "string" },
    },
    additionalProperties: false,
    required: [],
  };

  if (ajv.validate(schema, payload)) return true;
  log.error(ajv.errorsText());
  return false;
}

export { sendToAllClients };
