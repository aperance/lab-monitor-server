import * as winston from "winston";

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      info => `${info.timestamp}: ${info.label}: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.File({
      filename: "logs/watcher.log"
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" })
  ]
});

const log = function(label: string, message: string) {
  logger.log({ level: "info", label, message });
};

export default log;
