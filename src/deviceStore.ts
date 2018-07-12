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
  public set(id: string, status: Status.Connected, newState: State): void;
  public set(id: string, status: Status, newState?: State): void {
    // Get previous device record from Map for given id (undefined if no previous record)
    const currentRecord = this.deviceData.get(id);

    if (!newState) {
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

    // Generate list of properties that have changed between the previous and new state data.
    const modifiedKeys: string[] = Object.keys({ ...prevState, ...newState })
      .filter(key => prevState[key] !== newState[key])
      // Exclude timestamp and status from being recorded in history
      .filter(key => key !== "timestamp" && key !== "status");

    // Generate modified state object by adding latest values to modified keys list.
    const modifiedState: { [key: string]: string | null } = modifiedKeys.reduce(
      (stateAcc, propertyKey) => {
        stateAcc[propertyKey] = newState[propertyKey] || null;
        return stateAcc;
      },
      {} as { [key: string]: string | null }
    );

    // Generate modified history array by adding latest values and timestamps to modified keys list.
    const modifiedHistory = modifiedKeys.map(
      (propertyKey): [string, [string, string | null]] => {
        const propertyValue = modifiedState[propertyKey];
        return [propertyKey, [this.timestamp, propertyValue]];
      }
    );

    // Generate updated history object by merging modified history records into
    // previous history object, popping oldest records if max size setting exceeded.
    const newHistory: History = modifiedHistory.reduce(
      (history: History, [propertyKey, newRecord]) => {
        // If property dosent exist, add it and set to empty array
        if (!history[propertyKey]) history[propertyKey] = [];
        // Push new record to top of array
        history[propertyKey] = [newRecord, ...history[propertyKey]];
        while (history[propertyKey].length > maxHistory)
          history[propertyKey].pop();
        return history;
      },
      { ...prevHistory }
    );

    // Save latest state and updated history objects to Map.
    this.deviceData.set(id, {
      state: { ...newState, status, timestamp: this.timestamp },
      history: newHistory
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
}

export default new DeviceStore();
