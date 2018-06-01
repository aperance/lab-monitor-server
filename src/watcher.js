exports.createWatcherClass = (config, deviceStore, request, log) => {
  const { port, path, sequenceKey } = config.polling;

  return class Watcher {
    constructor(ipAddress) {
      this.ipAddress = ipAddress;
      this.url = `http://${ipAddress}:${port}/${path}?${sequenceKey}=`;
      this.connected = false;
      this.connectedTime = null;
      this.timer = null;
      this.request = null;
      this._log = log.bind(this);

      this._poll();
    }

    async _poll(sequence = 0) {
      if (!sequence) this._log("Starting Polling...");
      this._resetWatchdog(1);
      // Fetch state data from device, using url and timeout value from config.
      this.request = request(this.url + sequence, { retries: 0 });

      try {
        const res = await this.request;
        const deviceData = this._evalWrapper(res.body);
        deviceStore.set(this.ipAddress, deviceData);
        this._setStatus(true);
        this._poll(deviceData[sequenceKey]);
      } catch (err) {
        if (err.name === "CancelError") this._log(err);
        else if (err.name === "RequestError" || "EvalError") {
          this._log(err);
          if (this.connected) deviceStore.setInactive(this.ipAddress);
          this._setStatus(false);
          if (Date.now() - this.connectedTime > 10 * 60000) {
            this._resetWatchdog(5);
            this._log("Inactive device. Retrying in 5 min.");
          }
        }
      }
    }

    _evalWrapper(data) {
      try {
        return eval(data.replace("display(", "("));
      } catch (err) {
        throw new EvalError("Unable to parse response string");
      }
    }

    _setStatus(newStatus) {
      if (newStatus) this.connectedTime = Date.now();
      if (newStatus !== this.connected) {
        this.connected = newStatus;
        this._log(`Device is ${newStatus ? "connected" : "disconnected"}.`);
      }
    }

    _resetWatchdog(minutes) {
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this._log(`Connection timedout (${minutes} min).`);
        if (this.request._isPending) this.request.cancel();
        this._poll();
      }, minutes * 60000);
    }
  };
};
