exports.createLoggers = winston => {
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

  const log = function(message) {
    logger.log({ level: "info", label: this.ipAddress, message });
  };

  return log;
};
