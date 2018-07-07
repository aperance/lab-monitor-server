import * as got from "got";
import deviceStore, { State, Status } from "./deviceStore";
import { watcher as log } from "./logger";

const {
  port,
  path,
  sequenceKey
}: {
  port: number;
  path: string;
  sequenceKey: string;
} = require("../config.json").watcher;

class Watcher {
  private ipAddress: string;
  private request: got.GotPromise<string> | null;
  private state: IterableIterator<{ status: Status; delay: number }> | null;

  constructor(ipAddress: string) {
    this.ipAddress = ipAddress;
    this.request = null;
    this.state = null;
  }

  public start(): void {
    log.warn("Starting watcher for " + this.ipAddress);
    this.state = this.stateGenerator();
    this.state.next();
    this.poll();
  }

  public kill(): void {
    log.warn("Killing watcher for " + this.ipAddress);
    deviceStore.set(this.ipAddress, Status.Inactive);
    if (this.state && this.state.return) this.state.return();
    if (this.request && this.request.cancel) this.request.cancel();
  }

  private async poll(sequence: string = "0"): Promise<void> {
    if (!this.state) return;
    // Fetch state data from device, using url and timeout value from config.
    this.request = got(
      `http://${this.ipAddress}:${port}/${path}?${sequenceKey}=${sequence}`,
      { retries: 0, timeout: { connect: 5000, socket: 60000 } }
    );
    try {
      const response = await this.request;
      const deviceData = this.evalWrapper(response.body);
      const { done } = this.state.next({ success: true });
      if (done) return;
      deviceStore.set(this.ipAddress, Status.Connected, deviceData);
      this.poll(deviceData[sequenceKey]);
    } catch (err) {
      if (err.name === "CancelError") return;
      if (err.name === "RequestError" || "EvalError") {
        log.error(`${this.ipAddress}: ${err}`);
        const { done, value } = this.state.next({ success: false });
        if (done) return;
        deviceStore.set(this.ipAddress, value.status);
        setTimeout(this.poll.bind(this), value.delay * 60000);
      }
    }
  }

  private evalWrapper(data: string): State {
    try {
      const result: State = eval(data.replace("display(", "("));
      if (!result[sequenceKey]) throw Error();
      else return result;
    } catch (err) {
      throw EvalError("Unable to parse response string");
    }
  }

  private *stateGenerator() {
    let status = Status.Inactive;
    let lastCommunication = 0;
    let delay = 0;

    while (true) {
      const result = yield { status, delay };
      const previousStatus = status;

      switch (previousStatus) {
        case Status.Connected as string:
          if (!result.success) status = Status.Retry;
          break;

        case Status.Retry as string:
          if (result.success) status = Status.Connected;
          else status = Status.Disconnected;
          break;

        case Status.Disconnected as string:
          if (result.success) status = Status.Connected;
          else if (Date.now() - lastCommunication > 10 * 60000)
            status = Status.Disconnected;
          break;

        case Status.Inactive as string:
          if (result.success) status = Status.Connected;
          break;
      }

      switch (status) {
        case Status.Connected as string:
          if (previousStatus !== Status.Connected)
            log.info(`${this.ipAddress}: Connection established with device.`);
          lastCommunication = Date.now();
          delay = 0;
          break;

        case Status.Retry as string:
          log.info(`${this.ipAddress}: Connection lost. Retrying.`);
          delay = 0;
          break;

        case Status.Disconnected as string:
          log.info(`${this.ipAddress}: Disconnected. Retrying in 1 min.`);
          delay = 1;
          break;

        case Status.Inactive as string:
          log.info(`${this.ipAddress}: Inactive device. Retrying in 5 min.`);
          delay = 5;
          break;
      }
    }
  }
}

export default Watcher;
