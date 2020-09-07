import got from "got";
import config from "./configuration.js";
import deviceStore from "./deviceStore.js";
import { watcher as log } from "./logger.js";

/**
 * Allowed values for device connection status.
 */
export const enum Status {
  Connected = "CONNECTED",
  Retry = "RETRY",
  Disconnected = "DISCONNECTED",
  Inactive = "INACTIVE"
}

/**
 * Class to be instantiated for each device being monitored.
 * Continuously polls the device at the provided IP address. Received
 * device data and connection state are sent to the deviceStore.
 */
class Watcher {
  /** Device IP address */
  private ipAddress: string;
  /** Reference to pending http request to device */
  private request?: got.GotPromise<string>;
  /** Generator based state machine */
  private state?: Generator<[Status, number], void, boolean>;
  /** Reference to timer used to detect connection timeout */
  private timer?: NodeJS.Timeout;

  /**
   * Creates an instance of Watcher for the provided IP address.
   */
  constructor(ipAddress: string) {
    this.ipAddress = ipAddress;
  }

  /**
   * Starts operation of the watcher instance. Instantiates stateGenerator
   * as this.state and runs poll method (which will continue recursively).
   */
  public start(): void {
    log.warn("Starting watcher for " + this.ipAddress);
    this.state = this.stateGenerator();
    this.state.next(); // First next takes no params, so call it once before use in poll().
    this.poll();
  }

  /**
   * Stops operation of the current instance. Ends the stateGenerator and any
   * pending request or timeout, which will cause the recursive poll() method
   * to end. Instance will eventually be garbage collected.
   */
  public kill(): void {
    log.warn("Killing watcher for " + this.ipAddress);
    deviceStore.set(this.ipAddress, Status.Inactive);
    if (this.state?.return) this.state.return();
    if (this.request?.cancel) this.request.cancel();
    if (this.timer) clearTimeout(this.timer);
  }

  /**
   * Requests data from device and processes the reponse. Function will loop
   * indefinitely using recursive calls. Recursive calls may include a sequence
   * key found in the previous response, to be included in the next request.
   * This tells the device not to respond to the request until the data has
   * changed. Delays between cycles are added based on the current state (to
   * prevent continuous polling of inactive IP addresses). stateGenerator used
   * to determine new state and delay time based on the reult of the current
   * request. New state and received device data are sent to the deviceStore.
   * EvalError, got.RequestError, and got.CancelError are caught and handled.
   * Runs recursively until got.Request or timeout are cancelled, or the state
   * generator is ended.
   */
  private async poll(sequence = "0"): Promise<void> {
    if (!this.state) return;

    const { port, path, sequenceKey } = config.watcher;

    /** Fetch state data from device, using url and timeout value from config */
    this.request = got(
      `http://${this.ipAddress}:${port}/${path}?${sequenceKey}=${sequence}`,
      { retries: 0, timeout: { connect: 5000, socket: 60000 } }
    );
    try {
      const response = await this.request;
      const deviceData = this.evalWrapper(response.body);
      const { done } = this.state.next(true);
      if (!done) {
        deviceStore.set(this.ipAddress, Status.Connected, deviceData);
        setImmediate(this.poll.bind(this), deviceData[sequenceKey]);
      }
    } catch (err) {
      if (err.name === "RequestError" || err.name === "EvalError") {
        log.error(`${this.ipAddress}: ${err}`);
        const { done, value } = this.state.next(false);
        if (!done && value) {
          const [status, delay] = value;
          deviceStore.set(this.ipAddress, status);
          this.timer = setTimeout(this.poll.bind(this), delay * 60000);
        }
      }
      if (err.name === "CancelError")
        log.error(`${this.ipAddress}: Request Cancelled`);
    }
  }

  /**
   * Parses the stringified data received from the device.
   * Note: Uses eval(). While understood as unsafe, this software is intended
   * for use in a controlled environment where an attack is extremely unlikely.
   * @throws {EvalError} if unable to parse string.
   */
  private evalWrapper(data: string): Record<string, string> {
    try {
      const result = eval(data.replace("display(", "("));
      if (!result[config.watcher.sequenceKey]) throw Error();
      else return result;
    } catch (err) {
      throw EvalError("Unable to parse response string");
    }
  }

  /**
   * Creates a state machine to be used by the poll method. Yields new "state"
   * and "delay" values based on a provided "success" boolean.
   */
  private *stateGenerator(): Generator<[Status, number], void, boolean> {
    let status = Status.Inactive;
    let lastCommunication = 0;
    let delay = 0;

    while (true) {
      const success = yield [status, delay];
      const previousStatus: Status = status;

      switch (previousStatus) {
        case Status.Connected as string:
          if (!success) status = Status.Retry;
          break;

        case Status.Retry as string:
          if (success) status = Status.Connected;
          else status = Status.Disconnected;
          break;

        case Status.Disconnected as string:
          if (success) status = Status.Connected;
          else if (Date.now() - lastCommunication > 10 * 60000)
            status = Status.Inactive;
          break;

        case Status.Inactive as string:
          if (success) status = Status.Connected;
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
