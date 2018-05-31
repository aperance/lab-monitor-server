const winston = require("winston");

exports.createWatcherClass = (
  { polling: { port, resource, sequenceKey, maxRetries } },
  deviceStore,
  fetch
) => {
  return class Watcher {
    constructor(ipAddress) {
      this.ipAddress = ipAddress;
      this.url = "http://" + ipAddress + ":" + port + resource;
      this.lastAttempt = null;
      this.lastCommunication = null;
      this.status = "initial";
      this.logger = winston.createLogger({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(info => `${info.timestamp}: ${info.message}`)
        ),
        transports: [
          new winston.transports.File({
            filename: "logs/" + ipAddress + ".log"
          })
        ]
      });
    }

    start() {
      setInterval(() => {
        if (
          this.status === "disconnected" &&
          Date.now() - this.lastCommunication < 300000
        ) {
          this.logger.info("Disconnected for over 5 min. Restarting.");
          this.poll();
        } else if (Date.now() - this.lastAttempt > 300000) {
          this.logger.info("Recently disconnected. Restarting.");
          this.poll();
        }
      }, 30000);
      this.logger.info("Starting Polling...");
      this.poll();
    }

    poll(sequence = 0) {
      this.lastAttempt = Date.now();
      // Fetch state data from device, using url and timeout value from config.
      fetch(this.url + "?" + sequenceKey + "=" + sequence, { timeout: 60000 })
        // Extract string from response object.
        .then(res => res.text())
        // Parse result string, saving data to device store. Perform new poll,
        // with latest sequence key (if exists), resetting retry count to 0.
        .then(str => {
          try {
            return eval(str.replace("display(", "("));
          } catch (e) {
            throw new EvalError();
          }
        })
        .then(deviceData => {
          if (this.status !== "connected") {
            this.logger.info("Connection established");
            this.status = "connected";
          }
          this.lastCommunication = Date.now();
          deviceStore.set(this.ipAddress, deviceData);
          this.poll(deviceData[sequenceKey]);
        })
        .catch(err => {
          if (err.name === "FetchError" && err.type == "request-timeout") {
            this.logger.info("Connection timed out. Retrying...");
            this.poll();
          } else this.errorHandler(err);
        });
    }

    errorHandler(err) {
      if (this.status === "connected") {
        this.logger.info("Setting state as disconnected");
        deviceStore.setInactive(this.ipAddress);
      }
      this.status = "disconnected";
      if (err.name === "EvalError") this.logger.info("Error parsing response");
      else if (err.name === "FetchError" && err.type === "system") {
        this.logger.info("Unable to connect");
      } else this.logger.info(err);
    }
  };
};
