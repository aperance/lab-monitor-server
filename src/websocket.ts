import Ajv from "ajv";
import ws from "ws";
import actionHandler from "./actionHandler.js";
import deviceStore from "./deviceStore.js";
import engine from "./engine.js";
import { websocket as log } from "./logger.js";
import psToolsHandler from "./psToolsHandler.js";

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

interface OutboundMessage {
  type: WsMessageTypeKeys;
  payload: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

interface InboundMessage {
  type: WsMessageTypeKeys;
  payload: {
    targets?: string[];
    target?: string;
    mode?: string;
    argument?: string;
    type?: string;
    parameters?: { [key: string]: string };
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
server.on("connection", (socket) => {
  log.info("WebSocket handler connected to client");

  sendToClient(socket, {
    type: WsMessageTypeKeys.DEVICE_DATA_ALL,
    payload: deviceStore.getAccumulatedRecords(),
  });

  socket.on("message", function incoming(data: ws.Data) {
    if (process.env.DEMO === "true") {
      /** Immediate response to client when in demo mode */
      sendToClient(socket, {
        type: WsMessageTypeKeys.DEVICE_ACTION_RESPONSE,
        payload: {
          err: "Functionality not available in demo mode.",
          results: null,
        },
      });
    } else {
      const message = validateInboundMessage(data);
      if (message) inboundMessageRouter(socket, message);
    }
  });
});

/**
 * Parses incoming message and validates proper structure.
 */
function validateInboundMessage(data: ws.Data): InboundMessage | undefined {
  const ajv = new Ajv();
  const schema = {
    type: "object",
    properties: {
      type: { type: "string" },
      payload: {
        type: "object",
        properties: {
          targets: { type: "array" },
          target: { type: "string" },
          mode: { type: "string" },
          argument: { type: "string" },
          type: { type: "string" },
          parameters: { type: "object" },
        },
        additionalProperties: false,
        required: [],
      },
    },
    additionalProperties: false,
    required: ["type", "payload"],
  };

  const message: unknown = JSON.parse(data as string);

  if (ajv.validate(schema, message)) return message as InboundMessage;
  else log.error(ajv.errorsText());
}

/**
 * Routes incoming ws messages to intended handlers.
 * Data returned from some handlers are sent back to client.
 */
function inboundMessageRouter(socket: ws, { type, payload }: InboundMessage) {
  log.info(type + " received");

  switch (type) {
    case WsMessageTypeKeys.REFRESH_DEVICE:
      engine.refresh(payload.targets);
      break;

    case WsMessageTypeKeys.CLEAR_DEVICE:
      deviceStore.clear(payload.targets);
      engine.refresh(payload.targets);
      break;

    case WsMessageTypeKeys.DEVICE_ACTION:
      actionHandler(payload).then((actionResponse) =>
        sendToClient(socket, {
          type: WsMessageTypeKeys.DEVICE_ACTION_RESPONSE,
          payload: actionResponse,
        })
      );
      break;

    case WsMessageTypeKeys.PSTOOLS_COMMAND:
      psToolsHandler(payload, (result) => {
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

export { sendToAllClients };
