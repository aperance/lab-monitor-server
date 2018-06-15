const config = require("../config.json").polling;
import * as got from "got";
import log from "./logger";

import deviceStore from "./deviceStore";

class Watcher {
  ipAddress: string;
  url: string;
  connected: boolean;
  connectedTime: number | null;
  timer: any;
  request: any;
  log: any;

  constructor(ipAddress: string) {
    this.ipAddress = ipAddress;
    this.url = `http://${ipAddress}:${config.port}/${config.path}?${
      config.sequenceKey
    }=`;
    this.connected = false;
    this.connectedTime = null;
    this.timer = null;
    this.request = null;
    this.log = log.bind(this);

    this._poll();
  }

  kill() {
    console.log("Killing " + this.ipAddress);
    deviceStore.setInactive(this.ipAddress);
    if (this.timer) clearTimeout(this.timer);
    if (this.request._isPending) this.request.cancel();
  }

  async _poll(sequence = 0) {
    if (!sequence) this.log("Starting Polling...");
    this._resetWatchdog(1);
    // Fetch state data from device, using url and timeout value from config.
    this.request = got(this.url + sequence, { retries: 0 });

    try {
      const res = await this.request;
      const deviceData = this._evalWrapper(res.body);
      deviceStore.set(this.ipAddress, deviceData);
      this._setStatus(true);
      this._poll(deviceData[config.sequenceKey]);
    } catch (err) {
      if (err.name === "CancelError") this.log(err);
      else if (err.name === "RequestError" || "EvalError") {
        this.log(err);
        if (this.connected) deviceStore.setInactive(this.ipAddress);
        this._setStatus(false);
        if (
          !this.connectedTime ||
          Date.now() - this.connectedTime > 10 * 60000
        ) {
          this._resetWatchdog(5);
          this.log("Inactive device. Retrying in 5 min.");
        }
      }
    }
  }

  _evalWrapper(data: string) {
    try {
      return eval(data.replace("display(", "("));
    } catch (err) {
      throw new EvalError("Unable to parse response string");
    }
  }

  _setStatus(newStatus: boolean) {
    if (newStatus) this.connectedTime = Date.now();
    if (newStatus !== this.connected) {
      this.connected = newStatus;
      this.log(`Device is ${newStatus ? "connected" : "disconnected"}.`);
    }
  }

  _resetWatchdog(minutes: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.log(`Connection timedout (${minutes} min).`);
      if (this.request._isPending) this.request.cancel();
      this._poll();
    }, minutes * 60000);
  }
}

export default Watcher;
