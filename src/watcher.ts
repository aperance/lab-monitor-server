import * as got from "got";
import log from "./logger";
import deviceStore from "./deviceStore";

const {
  port,
  path,
  sequenceKey,
  maxRetries
}: {
  port: number;
  path: string;
  sequenceKey: string;
  maxRetries: number;
} = require("../config.json").watcher;

class Watcher {
  ipAddress: string;
  url: string;
  connected: boolean;
  connectedTime: number | null;
  timer: NodeJS.Timer | null;
  request: got.GotPromise<string> | null;
  log: any;

  constructor(ipAddress: string) {
    this.ipAddress = ipAddress;
    this.url = `http://${ipAddress}:${port}/${path}?${sequenceKey}=`;
    this.connected = false;
    this.connectedTime = null;
    this.timer = null;
    this.request = null;
    this.log = log.bind(this);

    this.poll();
  }

  public kill() {
    console.log("Killing " + this.ipAddress);
    deviceStore.setInactive(this.ipAddress);
    if (this.timer) clearTimeout(this.timer);
    if (this.request) this.request.cancel();
  }

  private async poll(sequence = 0) {
    if (!sequence) this.log("Starting Polling...");
    this.resetWatchdog(1);
    // Fetch state data from device, using url and timeout value from config.
    this.request = got(this.url + sequence, { retries: 0 });

    try {
      const res = await this.request;
      const deviceData = this.evalWrapper(res.body);
      deviceStore.set(this.ipAddress, deviceData);
      this.setStatus(true);
      this.poll(deviceData[sequenceKey]);
    } catch (err) {
      if (err.name === "CancelError") this.log(err);
      else if (err.name === "RequestError" || "EvalError") {
        this.log(err);
        if (this.connected) deviceStore.setInactive(this.ipAddress);
        this.setStatus(false);
        if (
          !this.connectedTime ||
          Date.now() - this.connectedTime > 10 * 60000
        ) {
          this.resetWatchdog(5);
          this.log("Inactive device. Retrying in 5 min.");
        }
      }
    }
  }

  private evalWrapper(data: string) {
    try {
      return eval(data.replace("display(", "("));
    } catch (err) {
      throw new EvalError("Unable to parse response string");
    }
  }

  private setStatus(newStatus: boolean) {
    if (newStatus) this.connectedTime = Date.now();
    if (newStatus !== this.connected) {
      this.connected = newStatus;
      this.log(`Device is ${newStatus ? "connected" : "disconnected"}.`);
    }
  }

  private resetWatchdog(minutes: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.log(`Connection timedout (${minutes} min).`);
      if (this.request) this.request.cancel();
      this.poll();
    }, minutes * 60000);
  }
}

export default Watcher;
