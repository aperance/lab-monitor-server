import * as got from "got";
import deviceStore, { State } from "./deviceStore";
import { watcher as log } from "./logger";

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
  private ipAddress: string;
  private connected: boolean;
  private connectedTime: number | null;
  private timer: NodeJS.Timer | null;
  private request: got.GotPromise<string> | null;

  constructor(ipAddress: string) {
    this.ipAddress = ipAddress;
    this.connected = false;
    this.connectedTime = null;
    this.timer = null;
    this.request = null;
    this.poll();
  }

  public kill(): void {
    log.info("Killing " + this.ipAddress);
    deviceStore.setInactive(this.ipAddress);
    if (this.timer) clearTimeout(this.timer);
    if (this.request) this.request.cancel();
  }

  private async poll(sequence: string = "0"): Promise<void> {
    if (sequence === "0") log.info(`${this.ipAddress}: Starting Polling...`);
    this.resetWatchdog(1);
    // Fetch state data from device, using url and timeout value from config.
    this.request = got(
      `http://${this.ipAddress}:${port}/${path}?${sequenceKey}=${sequence}`,
      { retries: 0 }
    );

    try {
      const response = await this.request;
      const deviceData = this.evalWrapper(response.body);
      deviceStore.set(this.ipAddress, deviceData);
      this.setStatus(true);
      this.poll(deviceData[sequenceKey]);
    } catch (err) {
      if (err.name === "CancelError") log.info(`${this.ipAddress}: ${err}`);
      else if (err.name === "RequestError" || "EvalError") {
        log.info(`${this.ipAddress}: ${err}`);
        if (this.connected) deviceStore.setInactive(this.ipAddress);
        this.setStatus(false);
        if (
          !this.connectedTime ||
          Date.now() - this.connectedTime > 10 * 60000
        ) {
          this.resetWatchdog(5);
          log.info(`${this.ipAddress}: Inactive device. Retrying in 5 min.`);
        }
      }
    }
  }

  private evalWrapper(data: string): State {
    try {
      return eval(data.replace("display(", "("));
    } catch (err) {
      throw new EvalError("Unable to parse response string");
    }
  }

  private setStatus(newStatus: boolean): void {
    if (newStatus) this.connectedTime = Date.now();
    if (newStatus !== this.connected) {
      this.connected = newStatus;
      log.info(
        `${this.ipAddress}: Device is ${
          newStatus ? "connected" : "disconnected"
        }.`
      );
    }
  }

  private resetWatchdog(minutes: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      log.info(`${this.ipAddress}: Connection timedout (${minutes} min).`);
      if (this.request) this.request.cancel();
      this.poll();
    }, minutes * 60000);
  }
}

export default Watcher;
