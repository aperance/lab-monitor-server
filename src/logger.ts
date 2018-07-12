import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf } = format;
const { File } = transports;

export const actionHandler = createLogger({
  format: combine(
    timestamp(),
    printf(x => `${x.timestamp}: ${JSON.stringify(x.message)}`)
  ),
  transports: [new File({ filename: "logs/actionHandler.log" })]
});

export const httpProxy = createLogger({
  format: combine(timestamp(), printf(x => `${x.timestamp}: ${x.message}`)),
  transports: [new File({ filename: "logs/httpProxy.log" })]
});

export const psToolsHandler = createLogger({
  format: combine(timestamp(), printf(x => `${x.timestamp}: ${x.message}`)),
  transports: [new File({ filename: "logs/psToolsHandler.log" })]
});

export const vncProxy = createLogger({
  format: combine(timestamp(), printf(x => `${x.timestamp}: ${x.message}`)),
  transports: [new File({ filename: "logs/vncProxy.log" })]
});

export const watcher = createLogger({
  format: combine(timestamp(), printf(x => `${x.timestamp}: ${x.message}`)),
  transports: [new File({ filename: "logs/watcher.log" })]
});

export const websocket = createLogger({
  format: combine(timestamp(), printf(x => `${x.timestamp}: ${x.message}`)),
  transports: [new File({ filename: "logs/websocket.log" })]
});
