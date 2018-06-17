// deviceStore.js
// William Aperance
//
// The deviceStore class stores Map of information collected from the polling of devices.
// Each record in the Map contains a state object and a history object. The state object is
// the most recent state received from the device. The history object contains, for each
// state property, an array of the most recent values with timestamp. The size of the array
// is set in the config file. Each time new state data is received from a device:
// 1. This data is saved as the state object, plus timestamp.
// 2. The history object is updated for modified state properties.
// 3. For both state and history, the changes between new and previous are sent to the subscriber.
//

import { broadcast } from "./websocket";

const {
  maxHistory,
  dateFormat
}: {
  maxHistory: number;
  dateFormat: { [key: string]: string };
} = require("../config.json").deviceStore;

export interface State {
  [key: string]: string;
}

interface ModifiedState {
  [key: string]: string | null;
}

interface History {
  [key: string]: Array<[string, string | null]>;
}

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

class DeviceStore {
  private deviceData: Map<string, DeviceRecord>;

  constructor() {
    this.deviceData = new Map();
  }

  // Returns all data from Map. All data is sorted into a single
  // state and single history object, reducing work for client.
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

  // Updates Map with newly updated state data for given id, and compares new and
  // previous state data, saving a history of changes in the Map for given id as well.
  // Changes to state and history are emitted via _callbackOnUpdate function.
  public set(id: string, newState: State): void {
    // Grab previous state and history from Map for given id.
    const prev: DeviceRecord = this.getFromMap(id);
    const { state: prevState, history: prevHistory } = prev;

    // Generate list of properties that have changed between the previous and new state data.
    const modifiedKeys = Object.keys({ ...prevState, ...newState }).filter(
      key => prevState[key] !== newState[key]
    );

    // Generate modified state object by adding latest values to modified keys list.
    const modifiedState: ModifiedState = modifiedKeys.reduce(
      (state: ModifiedState, propertyKey) => {
        state[propertyKey] = newState[propertyKey] || null;
        return state;
      },
      {}
    );

    // Generate modified history array by adding latest values and timestamps to modified keys list.
    const modifiedHistory = modifiedKeys.map(propertyKey => {
      let returnValue: [string, [string, string | null]];
      const propertyValue = newState[propertyKey] || null;
      returnValue = [propertyKey, [this.timestamp, propertyValue]];
      return returnValue;
    });

    // Generate updated history object by merging modified history records into
    // previous history object, popping oldest records if max size setting exceeded.
    const newHistory: History = modifiedHistory.reduce(
      (history: History, [propertyKey, newRecord]) => {
        if (!history[propertyKey]) history[propertyKey] = [];
        history[propertyKey] = [newRecord, ...history[propertyKey]];
        while (history[propertyKey].length > maxHistory)
          history[propertyKey].pop();
        return history;
      },
      { ...prevHistory }
    );

    // Save latest state and updated history objects to Map.
    this.setToMap(id, {
      state: { ...newState, timestamp: this.timestamp, active: "true" },
      history: newHistory
    });

    // Emit modified state and modified history via callback.
    broadcast("DEVICE_DATA_UPDATE", {
      id,
      state: { ...modifiedState, timestamp: this.timestamp, active: "true" },
      history: modifiedHistory
    });
  }

  public setInactive(id: string): void {
    const { state, history } = this.getFromMap(id);
    if (state.active === "true") {
      this.deviceData.set(id, {
        state: { ...state, active: "false" },
        history
      });
      broadcast("DEVICE_DATA_UPDATE", {
        id,
        state: { active: "false" },
        history: []
      });
    }
  }

  private get timestamp(): string {
    return new Date().toLocaleString("en-US", dateFormat).replace(/,/g, "");
  }

  private setToMap(id: string, newDeviceRecord: DeviceRecord): void {
    this.deviceData.set(id, newDeviceRecord);
  }

  private getFromMap(id: string): DeviceRecord {
    return this.deviceData.get(id) || { state: {}, history: {} };
  }
}

export default new DeviceStore();
