class DeviceStore {
  constructor(config) {
    this._deviceData = new Map();
    this._callbackOnUpdate = null;
    this._maxSize = config.history.maxSize;
    this._timestamp = () =>
      new Date().toLocaleString("en-US", config.dateFormat).replace(/,/g, "");
  }

  onUpdate(callback) {
    this._callbackOnUpdate = callback;
  }

  get(id) {
    return this._deviceData.get(id) || { state: {}, history: {} };
  }

  getAll() {
    return Array.from(this._deviceData).reduce(
      (acc, [key, { state, history }]) => {
        acc.state[key] = state;
        acc.history[key] = history;
        return acc;
      },
      { state: {}, history: {} }
    );
  }

  set(id, newState) {
    if (typeof id != "string" || typeof newState != "object") {
      throw new TypeError("Invalid Input");
    }

    const { state: prevState, history: prevHistory } = this.get(id);

    const modifiedKeys = Object.keys({ ...prevState, ...newState }) // Get array of all keys in both state objects
      .filter(key => prevState[key] != newState[key]); // Remove properties that were not modified

    const modifiedState = modifiedKeys.reduce((acc, key) => {
      acc[key] = newState[key] || null;
      return acc;
    }, {});

    const modifiedHistory = modifiedKeys.map(key => [
      key,
      [this._timestamp(), newState[key] || null]
    ]);

    const newHistory = modifiedHistory.reduce(
      (acc, [key, newRecord]) => {
        if (!acc[key]) acc[key] = []; // Copy property history to accumulator (or empty array if added property)
        acc[key] = [newRecord, ...acc[key]]; // Add new value to front of array (or null if property was removed)
        while (acc[key].length > this._maxSize) acc[key].pop(); // Limit array length to maxSize setting
        return acc;
      },
      { ...prevHistory }
    );

    this._deviceData.set(id, {
      state: { ...newState, timestamp: this._timestamp() },
      history: newHistory
    });

    if (this._callbackOnUpdate)
      this._callbackOnUpdate({
        id,
        state: { ...modifiedState, timestamp: this._timestamp() },
        history: modifiedHistory
      });
  }
}

exports.createDeviceStore = config => new DeviceStore(config);
