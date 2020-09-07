import config from "./configuration.js";
import { sendToAllClients, WsMessageTypeKeys } from "./websocket.js";
import { Status } from "./watcher.js";

/**
 * All state properties for an individual device.
 *
 * Record<(property key), (property value)>
 */
type State = Record<string, string>;

/**
 * All state properties modified in the latest update (null if removed).
 *
 * Record<(property key), (new property value)>
 */
type StateDiff = Record<string, string | null>;

/**
 * History of value changes for each state property for an individual device.
 *
 * Record<(property key) Array<[(timestamp), (property value)]>>
 */
type History = Record<string, Array<[string, string | null]>>;

/**
 * Array of modified state properties with timestamp (null if removed).
 * Structured to be easily merged into History object.
 *
 * Array<[(property key), [(timestamp), (new property value)]]>
 */
type HistoryDiff = Array<[string, [string, string | null]]>;

/**
 * Collection of all data in the data store to be sent on client connection.
 *
 * state: Record<(device ID), (device state)>;
 * history: Record<(device ID), (device history)>;
 */
type AccumulatedRecords = {
  /** Record<(device ID), (device state)> */
  state: Record<string, State>;
  /** Record<(device ID), (device history)> */
  history: Record<string, History>;
};

/**
 * The deviceStore contains a map of all information collected from the polling
 * of devices. Each device record in the Map contains a state object and a history
 * object. The state object is the most recent state received from the device.
 * The history object contains, for each state property, an array of the most
 * recent values with timestamp. The size of the array is set in the config file.
 */
class DeviceStore {
  /** Map storing all device state and state history, accessable by device ID */
  private deviceData: Map<string, { state: State; history: History }>;

  /**
   * Creates an instance of DeviceStore.
   */
  constructor() {
    this.deviceData = new Map();
  }

  /**
   * Returns all data from Map. All data is sorted into a single
   * state and single history object, reducing work for client.
   */
  public getAccumulatedRecords(): AccumulatedRecords {
    return Array.from(this.deviceData).reduce(
      (accumulatedRecords, [id, deviceRecord]) => {
        accumulatedRecords.state[id] = deviceRecord.state;
        accumulatedRecords.history[id] = deviceRecord.history;
        return accumulatedRecords;
      },
      { state: {}, history: {} } as AccumulatedRecords
    );
  }

  /**
   * Updates Map with newly updated state data and connection status for given
   * id. Also compares new and previous state data, saving a history of changes
   * in the Map for given id. Changes to state and history are emitted over
   * websocket via the broadcast function.
   */
  public set(id: string, status: Status): void;
  public set(id: string, status: Status.Connected, receivedState: State): void;
  public set(id: string, status: Status, receivedState?: State): void {
    let nextState: State;
    let nextHistory: History;
    let stateDiff: StateDiff;
    let historyDiff: HistoryDiff;

    /** Prevent new record creation unless connection to device was established */
    if (status !== Status.Connected && !this.deviceData.has(id)) return;

    /** Get previous device record from Map for given id */
    const current = this.deviceData.get(id) || { state: {}, history: {} };

    if (receivedState) {
      nextState = { ...receivedState, status, timestamp: this.timestamp };
      stateDiff = this.reduceStateToModifiedOnly(current.state, nextState);
      historyDiff = this.mapStateDiffToHistoryDiff(stateDiff);
      nextHistory = this.mergeDiffIntoHistory(current.history, historyDiff);
    } else {
      /** Only update status if receivedState if undefined */
      nextState = { ...current.state, status };
      stateDiff = { status };
      historyDiff = [];
      nextHistory = current.history;
    }

    /** Save latest state and updated history objects to Map */
    this.deviceData.set(id, { state: nextState, history: nextHistory });

    /** Emit modified state and modified history via callback */
    sendToAllClients({
      type: WsMessageTypeKeys.DEVICE_DATA_UPDATE,
      payload: { id, state: stateDiff, history: historyDiff }
    });
  }

  /**
   * Removes record for given ID from Map. Sends null as update to trigger local clear.
   * Clears all records in deviceData map[] if specific list not provided.
   */
  public clear(ids?: string[]): void {
    /** Get all IDs in map if none specified */
    if (!ids) ids = [...this.deviceData.keys()];
    ids.forEach((id) => {
      const result: boolean = this.deviceData.delete(id);
      /** Send update if there was a record deleted for specified ID */
      if (result)
        sendToAllClients({
          type: WsMessageTypeKeys.DEVICE_DATA_UPDATE,
          payload: { id, state: null, history: null }
        });
    });
  }

  /**
   * Generate modified state object by adding latest values to modified
   * keys list.
   */
  private reduceStateToModifiedOnly(
    prevState: State,
    newState: State
  ): StateDiff {
    return Object.keys({ ...prevState, ...newState })
      .filter((key) => prevState[key] !== newState[key])
      .reduce((stateDiffAcc, propertyKey) => {
        stateDiffAcc[propertyKey] = newState[propertyKey] || null;
        return stateDiffAcc;
      }, {} as StateDiff);
  }

  /**
   * Generate modified history array by adding latest values and timestamps
   * to modified keys list.
   */
  private mapStateDiffToHistoryDiff(stateDiff: StateDiff): HistoryDiff {
    return (
      Object.entries(stateDiff)
        // Exclude timestamp and status from being recorded in history
        .filter(([key]) => key !== "timestamp" && key !== "status")
        .map(([key, value]) => [key, [this.timestamp, value]])
    );
  }

  /**
   * Generate updated history object by merging modified history records
   * into previous history object, popping oldest records if max size
   * setting exceeded.
   */
  private mergeDiffIntoHistory(
    prevHistory: History,
    historyDiff: HistoryDiff
  ): History {
    const newHistory = { ...prevHistory };
    historyDiff.forEach(([key, newRecord]) => {
      /** Push new record to top of array */
      newHistory[key] = [newRecord, ...(newHistory[key] ?? [])];
      while (newHistory[key].length > config.deviceStore.maxHistory)
        newHistory[key].pop();
    });
    return newHistory;
  }

  /**
   * Generates date/time string in desired format.
   */
  private get timestamp(): string {
    return new Date()
      .toLocaleString("en-US", config.deviceStore.dateFormat)
      .replace(/,/g, "");
  }
}

export default new DeviceStore();
