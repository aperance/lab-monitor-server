const events = require("events");

class DeviceStore {
  constructor(config) {
    this._deviceData = new Map();
    this.emitter = new events.EventEmitter();
    this._maxSize = config.history.maxSize;
    this._dateFormat = config.dateFormat;
  }

  get(id) {
    return this._deviceData.get(id);
  }

  getAllState() {
    return Array.from(this._deviceData).reduce((acc, [key, { state }]) => {
      acc[key] = state;
      return acc;
    }, {});
  }

  getAllHistory() {
    return Array.from(this._deviceData).reduce((acc, [key, { history }]) => {
      acc[key] = history;
      return acc;
    }, {});
  }

  set(id, newState) {
    if (typeof id != "string" || typeof newState != "object") {
      throw new TypeError("Invalid Input");
    }

    const timestamp = new Date()
      .toLocaleString("en-US", this._dateFormat)
      .replace(/,/g, "");

    newState.timestamp = timestamp;

    const { state, history } = this._deviceData.get(id) || {
      state: {},
      history: {}
    };

    const modifiedKeys = Object.keys({ ...state, ...newState }) // Get array of all keys in both state objects
      .filter(key => state[key] != newState[key]); // Remove properties that were not modified

    const modifiedState = modifiedKeys.reduce((acc, key) => {
      acc[key] = newState[key] || null;
      return acc;
    }, {});

    const modifiedHistory = modifiedKeys.map(key => [
      key,
      [timestamp, newState[key] || null]
    ]);

    const newHistory = modifiedHistory.reduce(
      (acc, [key, newRecord]) => {
        if (!acc[key]) acc[key] = []; // Copy property history to accumulator (or empty array if added property)
        acc[key] = [newRecord, ...acc[key]]; // Add new value to front of array (or null if property was removed)
        while (acc[key].length > this._maxSize) acc[key].pop(); // Limit array length to maxSize setting
        return acc;
      },
      { ...history }
    );

    this._deviceData.set(id, {
      state: newState,
      history: newHistory
    });

    this.emitter.emit("update", {
      id,
      state: modifiedState,
      history: modifiedHistory
    });
  }
}

exports.createDeviceStore = config => new DeviceStore(config);
