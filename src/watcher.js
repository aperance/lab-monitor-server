const winston = require("winston");
const request = require("got");

exports.createWatcherClass = (config, deviceStore, fetch, get) => {
  const { port, path, sequenceKey, maxRetries } = config.polling;
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
      this.url = `http://${ipAddress}:${port}/${path}?${sequenceKey}=`;
      this.lastAttempt = null;
      this.lastCommunication = null;
      this._status = "initial";
      this.timer = this.startWatchdog();
      this.request = null;

      this.log("Starting Polling...");
      this.poll();
    }

    set status(newStatus) {
      if (newStatus !== this._status) this.log(`Device is ${newStatus}`);
      this._status = newStatus;
    }

    startWatchdog() {
      this.timer = setInterval(() => {
        const sinceLastAttempt = Date.now() - this.lastAttempt;
        const sinceLastCommunication = Date.now() - this.lastCommunication;
        if (
          sinceLastAttempt > 300000 ||
          (sinceLastAttempt > 30000 && sinceLastCommunication < 600000)
        ) {
          this.log(
            `Restarting poll (communication: ${sinceLastCommunication}, attempt: ${sinceLastAttempt}).`
          );
          if (this.request && this.request._isPending) this.request.cancel();
          this.poll();
        }
      }, 15000);
    }

    async poll(sequence = 0) {
      this.lastAttempt = Date.now();
      // Fetch state data from device, using url and timeout value from config.
      this.request = request(this.url + sequence, { retries: 0 });

      try {
        const res = await this.request;
        const deviceData = this.evalWrapper(res.body);
        this.status = "connected";
        this.lastCommunication = Date.now();
        deviceStore.set(this.ipAddress, deviceData);
        this.poll(deviceData[sequenceKey]);
      } catch (err) {
        if (err.name === "CancelError") this.log(err);
        else if (err.name === "RequestError" || "EvalError") {
          this.log(err);
          this.status = "disconnected";
          deviceStore.setInactive(this.ipAddress);
        }
      }
    }

    evalWrapper(data) {
      try {
        return eval(data.replace("display(", "("));
      } catch (err) {
        throw new EvalError("Unable to parse response string");
      }
    }

    log(message, level = "info") {
      logger.log({ level, label: this.ipAddress, message });
    }
  };
};
