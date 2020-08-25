/** @module DeviceStore */

import { getDeviceStoreConfig } from "./configuration";
import { sendToAllClients, WsMessageTypeKeys } from "./websocket";

export const enum Status {
  Connected = "CONNECTED",
  Retry = "RETRY",
  Disconnected = "DISCONNECTED",
  Inactive = "INACTIVE",
}

export interface State {
  [key: string]: string;
}

interface History {
  [key: string]: Array<[string, string | null]>;
}

interface StateDiff {
  [key: string]: string | null;
}

interface HistoryDiff extends Array<[string, [string, string | null]]> {}

interface DeviceRecord {
  state: State;
  history: History;
}

interface AccumulatedRecords {
  state: {
    [key: string]: State;
  };
  history: {
    [key: string]: History;
  };
}

const { maxHistory, dateFormat } = getDeviceStoreConfig();

/**
 * The deviceStore class stores Map of information collectedfrom the polling
 * of devices. Each record in the Map contains a state object and a history
 * object. The state object is the most recent state received from the device.
 * The history object contains, for each state property, an array of the most
 * recent values with timestamp. The size of the array is set in the config
 * file.
 * @class DeviceStore
 */
class DeviceStore {
  private deviceData: Map<string, DeviceRecord>;

  /**
   * Creates an instance of DeviceStore.
   */
  constructor() {
    this.deviceData = new Map();
  }

  /**
   * Returns all data from Map. All data is sorted into a single
   * state and single history object, reducing work for client.
   * @public
   * @returns {AccumulatedRecords}
   */
  public getAccumulatedRecords(): AccumulatedRecords {
    const recordArray: Array<[string, DeviceRecord]> = Array.from(
      this.deviceData
    );
    return recordArray.reduce(
      (accumulatedRecords: AccumulatedRecords, [id, deviceRecord]) => {
        accumulatedRecords.state[id] = deviceRecord.state;
        accumulatedRecords.history[id] = deviceRecord.history;
        return accumulatedRecords;
      },
      { state: {}, history: {} }
    );
  }

  /**
   * Updates Map with newly updated state data and connection status for given
   * id. Also compares new and previous state data, saving a history of changes
   * in the Map for given id. Changes to state and history are emitted over
   * websocket via the broadcast function.
   * @public
   * @param {string} id
   * @param {Status} status
   * @param {State} [receivedState]
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
      nextState = { ...current.state, status };
      stateDiff = { status };
      historyDiff = [];
      nextHistory = current.history;
    }

    // Save latest state and updated history objects to Map.
    this.deviceData.set(id, { state: nextState, history: nextHistory });

    // Emit modified state and modified history via callback.
    sendToAllClients({
      type: WsMessageTypeKeys.DEVICE_DATA_UPDATE,
      payload: { id, state: stateDiff, history: historyDiff },
    });
  }

  /**
   * Removes record for given ID from Map. Sends null as update to trigger local clear.
   * Clears all records in deviceData ma[] if specific list not provided.
   * @public
   * @param {string[]} ids
   */
  public clear(ids?: string[]): void {
    if (!ids) ids = [...this.deviceData.keys()];
    ids.forEach((id) => {
      const result = this.deviceData.delete(id);
      if (result)
        sendToAllClients({
          type: WsMessageTypeKeys.DEVICE_DATA_UPDATE,
          payload: { id, state: null, history: null },
        });
    });
  }

  /**
   * Generate modified state object by adding latest values to modified
   * keys list.
   * @private
   * @param {State} prevState
   * @param {State} newState
   * @returns {StateDiff}
   */
  private reduceStateToModifiedOnly(prevState: State, newState: State) {
    return Object.keys({ ...prevState, ...newState })
      .filter((key) => prevState[key] !== newState[key])
      .reduce((stateAcc, propertyKey) => {
        stateAcc[propertyKey] = newState[propertyKey] || null;
        return stateAcc;
      }, {} as StateDiff);
  }

  /**
   * Generate modified history array by adding latest values and timestamps
   * to modified keys list.
   * @private
   * @param {StateDiff} stateDiff
   * @returns {HistoryDiff}
   */
  private mapStateDiffToHistoryDiff(stateDiff: StateDiff) {
    return (
      Object.entries(stateDiff)
        // Exclude timestamp and status from being recorded in history
        .filter(([key, value]) => key !== "timestamp" && key !== "status")
        .map(([key, value]): [string, [string, string | null]] => {
          return [key, [this.timestamp, value]];
        })
    );
  }

  /**
   * Generate updated history object by merging modified history records
   * into previous history object, popping oldest records if max size
   * setting exceeded.
   * @private
   * @param {History} prevHistory
   * @param {HistoryDiff} historyDiff
   * @returns {History}
   */
  private mergeDiffIntoHistory(prevHistory: History, historyDiff: HistoryDiff) {
    return historyDiff.reduce(
      (history: History, [key, newRecord]) => {
        // If property dosent exist, add it and set to empty array
        if (!history[key]) history[key] = [];
        // Push new record to top of array
        history[key] = [newRecord, ...history[key]];
        while (history[key].length > maxHistory) history[key].pop();
        return history;
      },
      { ...prevHistory }
    );
  }

  /**
   * Generates date/time string in desired format.
   * @readonly
   * @private
   * @type {string}
   */
  private get timestamp(): string {
    return new Date().toLocaleString("en-US", dateFormat).replace(/,/g, "");
  }
}

export default new DeviceStore();
