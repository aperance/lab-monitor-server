const events = require("events");

class DeviceStore {
  constructor(config) {
    this._deviceData = new Map();
    this.emitter = new events.EventEmitter();
    this._maxSize = config.history.maxSize;
  }

  get(id) {
    return this._deviceData.get(id);
  }

  set(id, newState) {
    if (typeof id != "string" || typeof newState != "object") {
      throw new TypeError("Invalid Input");
    }

    const { state, history } = this._deviceData.get(id) || {
      state: {},
      history: {}
    };

    const modifiedHistory = Object.keys({ ...state, ...newState }) // Get array of all keys in both state objects
      .filter(key => state[key] != newState[key]) // Remove properties that were not modified
      .reduce((acc, key) => {
        acc[key] = history[key] || []; // Copy property history to accumulator (or empty array if added property)
        acc[key].unshift([Date.now(), newState[key] || null]); // Add new value to front of array (or null if property was removed)
        while (acc[key].length > this._maxSize) acc[key].pop(); // Limit array length to maxSize setting
        return acc;
      }, {});

    this._deviceData.set(id, {
      timestamp: Date.now(),
      state: newState,
      history: { ...history, ...modifiedHistory }
    });

    this.emitter.emit("update", id);
  }
}

exports.createDeviceStore = config => new DeviceStore(config);
