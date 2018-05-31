const winston = require("winston");

exports.createWatcherClass = (config, deviceStore, fetch) => {
  const { port, resource, sequenceKey, maxRetries } = config.polling;
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

  return class Watcher {
    constructor(ipAddress) {
      this.ipAddress = ipAddress;
      this.url = `http://${ipAddress}:${port}/${resource}`;
      this.lastAttempt = null;
      this.lastCommunication = null;
      this.status = "initial";
      this.timer = null;
    }

    start() {
      this.timer = setInterval(() => {
        const sinceLastAttempt = Date.now() - this.lastAttempt;
        const sinceLastCommunication = Date.now() - this.lastCommunication;
        if (
          sinceLastAttempt > 600000 ||
          (this.status === "disconnected" &&
            sinceLastAttempt > 60000 &&
            sinceLastCommunication < 600000)
        ) {
          this.log(
            `Restarting poll (communication: ${sinceLastCommunication}, attempt: ${sinceLastAttempt}).`
          );
          this.poll();
        }
      }, 30000);
      this.log("Starting Polling...");
      this.poll();
    }

    poll(sequence = 0) {
      this.lastAttempt = Date.now();
      // Fetch state data from device, using url and timeout value from config.
      fetch(`${this.url}?${sequenceKey}=${sequence}`, { timeout: 60000 })
        // Extract string from response object.
        .then(res => res.text())
        // Parse result string, saving data to device store. Perform new poll,
        // with latest sequence key (if exists), resetting retry count to 0.
        .then(str => {
          try {
            return eval(str.replace("display(", "("));
          } catch (e) {
            throw new EvalError("Unable to parse response string");
          }
        })
        .then(deviceData => {
          if (this.status !== "connected") {
            this.log("Connection established");
            this.status = "connected";
          }
          this.lastCommunication = Date.now();
          deviceStore.set(this.ipAddress, deviceData);
          this.poll(deviceData[sequenceKey]);
        })
        .catch(err => {
          if (err.name === "FetchError" && err.type == "request-timeout") {
            this.log("Connection timed out. Retrying...");
            this.poll();
          } else {
            if (err.name === "FetchError" || "EvalError") this.log(err);

            if (this.status !== "disconnected") {
              this.log("Setting state as disconnected");
              this.status = "disconnected";
              deviceStore.setInactive(this.ipAddress);
            }
          }
        });
    }

    log(message, level = "info") {
      logger.log({ level, label: this.ipAddress, message });
    }
  };
};
