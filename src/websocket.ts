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

interface WsMessage {
  type: WsMessageTypeKeys;
  payload: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
server.on("connection", (socket) => {
  log.info("WebSocket handler connected to client");

  sendToClient(socket, {
    type: WsMessageTypeKeys.DEVICE_DATA_ALL,
    payload: deviceStore.getAccumulatedRecords(),
  });

  socket.on("message", function incoming(data: ws.Data) {
    inboundMessageHandler(socket, data);
  });
});

/**
 * Send message to client on the specifed socket.
 */
const sendToClient = (socket: ws, outboundMessage: WsMessage): void => {
  log.info(outboundMessage.type + " sent to client");
  socket.send(JSON.stringify(outboundMessage));
};

/**
 * Send message to all clients connected to server.
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
 * Data returned from some handlers are sent back to client.
 */
const inboundMessageHandler = (socket: ws, data: ws.Data) => {
  /** Immediate response to client when in demo mode */
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

  // TODO: Type Guards
  const { type, payload }: WsMessage = JSON.parse(data as string);

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
      psToolsHandler(payload, (payload) => {
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
