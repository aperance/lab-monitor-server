/** @module DeviceStore */

import { MessageType, sendToAllClients } from "./websocket";

const {
  maxHistory,
  dateFormat
}: {
  maxHistory: number;
  dateFormat: { [key: string]: string };
} = require("../config.json").deviceStore;

export const enum Status {
  Connected = "CONNECTED",
  Retry = "RETRY",
  Disconnected = "DISCONNECTED",
  Inactive = "INACTIVE"
}

export interface State {
  [key: string]: string;
}

interface History {
  [key: string]: Array<[string, string | null]>;
}

interface DeviceRecord {
  state: State;
  history: History;
}

export interface ModifiedState {
  [key: string]: string | null;
}

interface ModifiedHistory extends Array<[string, [string, string | null]]> {}

interface AccumulatedRecords {
  state: {
    [key: string]: State;
  };
  history: {
    [key: string]: History;
  };
}

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
   * @param {State} [newState]
   */
  public set(id: string, status: Status): void;
  public set(id: string, status: Status.Connected, updatedState: State): void;
  public set(id: string, status: Status, updatedState?: State): void {
    // Get previous device record from Map for given id (undefined if no previous record)
    const currentRecord = this.deviceData.get(id);

    if (!updatedState) {
      // Prevent new record from being created with only status set
      if (!currentRecord) return;
      // Inject new status into existing record
      this.deviceData.set(id, {
        state: { ...currentRecord.state, status },
        history: currentRecord.history
      });
      // Send websocket update with only new status
      sendToAllClients({
        type: MessageType.DeviceDataUpdate,
        payload: {
          id,
          state: { status },
          history: []
        }
      });
      return;
    }

    const prevState: State = currentRecord ? currentRecord.state : {};
    const prevHistory: History = currentRecord ? currentRecord.history : {};

    const keys = this.getKeysOfModifiedValues(prevState, updatedState);
    const modifiedState = this.reduceStateToModifiedOnly(keys, updatedState);
    const modifiedHistory = this.mapModifiedStateToHistory(keys, modifiedState);
    const updatedHistory = this.mergeUpdatesIntoHistory(
      prevHistory,
      modifiedHistory
    );

    // Save latest state and updated history objects to Map.
    this.deviceData.set(id, {
      state: { ...updatedState, status, timestamp: this.timestamp },
      history: updatedHistory
    });

    // Emit modified state and modified history via callback.
    sendToAllClients({
      type: MessageType.DeviceDataUpdate,
      payload: {
        id,
        state: { ...modifiedState, status, timestamp: this.timestamp },
        history: modifiedHistory
      }
    });
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

  /**
   * Generate list of properties that have changed between the previous and
   * new state data.
   * @private
   * @param {State} prevState
   * @param {State} newState
   * @returns {string[]}
   */
  private getKeysOfModifiedValues(prevState: State, newState: State): string[] {
    return (
      Object.keys({ ...prevState, ...newState })
        .filter(key => prevState[key] !== newState[key])
        // Exclude timestamp and status from being recorded in history
        .filter(key => key !== "timestamp" && key !== "status")
    );
  }

  /**
   * Generate modified state object by adding latest values to modified
   * keys list.
   * @private
   * @param {string[]} modifiedKeys
   * @param {State} newState
   * @returns {ModifiedState}
   */
  private reduceStateToModifiedOnly(
    modifiedKeys: string[],
    newState: State
  ): ModifiedState {
    return modifiedKeys.reduce(
      (stateAcc, propertyKey) => {
        stateAcc[propertyKey] = newState[propertyKey] || null;
        return stateAcc;
      },
      {} as ModifiedState
    );
  }

  /**
   * Generate modified history array by adding latest values and timestamps
   * to modified keys list.
   * @private
   * @param {string[]} modifiedKeys
   * @param {ModifiedState} modifiedState
   * @returns {ModifiedHistory}
   */
  private mapModifiedStateToHistory(
    modifiedKeys: string[],
    modifiedState: ModifiedState
  ): ModifiedHistory {
    return modifiedKeys.map(
      (key): [string, [string, string | null]] => {
        const value = modifiedState[key];
        return [key, [this.timestamp, value]];
      }
    );
  }

  /**
   * Generate updated history object by merging modified history records
   * into previous history object, popping oldest records if max size
   * setting exceeded.
   * @private
   * @param {History} prevHistory
   * @param {ModifiedHistory} modifiedHistory
   * @returns {History}
   */
  private mergeUpdatesIntoHistory(
    prevHistory: History,
    modifiedHistory: ModifiedHistory
  ): History {
    return modifiedHistory.reduce(
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
}

export default new DeviceStore();
