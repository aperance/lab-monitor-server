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

class DeviceStore {
  constructor(config) {
    this._deviceData = new Map();
    this._get = id => this._deviceData.get(id) || { state: {}, history: {} };
    this._timestamp = () =>
      new Date().toLocaleString("en-US", config.dateFormat).replace(/,/g, "");
    this._maxSize = config.history.maxSize;
    this._subscriber = null;
  }

  // Sets observer function to be called when Map is updated.
  subscribe(func) {
    this._subscriber = func;
  }

  // Returns all data from Map. All data is sorted into a single
  // state and single history object, reducing work for client.
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

  // Updates Map with newly updated state data for given id, and compares new and
  // previous state data, saving a history of changes in the Map for given id as well.
  // Changes to state and history are emitted via _callbackOnUpdate function.
  set(id, newState) {
    if (typeof id != "string" || typeof newState != "object") {
      throw new TypeError("Invalid Input");
    }

    // Grab previous state and history from Map for given id.
    const { state: prevState, history: prevHistory } = this._get(id);

    // Generate list of properties that have changed between the previous and new state data.
    const modifiedKeys = Object.keys({ ...prevState, ...newState }).filter(
      key => prevState[key] != newState[key]
    );

    // Generate modified state object by adding latest values to modified keys list.
    const modifiedState = modifiedKeys.reduce((acc, key) => {
      acc[key] = newState[key] || null;
      return acc;
    }, {});

    // Generate modified history array by adding latest values and timestamps to modified keys list.
    const modifiedHistory = modifiedKeys.map(key => [
      key,
      [this._timestamp(), newState[key] || null]
    ]);

    // Generate updated history object by merging modified history records into
    // previous history object, popping oldest records if max size setting exceeded.
    const newHistory = modifiedHistory.reduce(
      (acc, [key, newRecord]) => {
        if (!acc[key]) acc[key] = [];
        acc[key] = [newRecord, ...acc[key]];
        while (acc[key].length > this._maxSize) acc[key].pop();
        return acc;
      },
      { ...prevHistory }
    );

    // Save latest state and updated history objects to Map.
    this._deviceData.set(id, {
      state: { ...newState, timestamp: this._timestamp(), active: true },
      history: newHistory
    });

    // Emit modified state and modified history via callback.
    if (this._subscriber)
      this._subscriber({
        id,
        state: { ...modifiedState, timestamp: this._timestamp(), active: true },
        history: modifiedHistory
      });
  }

  setInactive(id) {
    if (typeof id != "string") {
      throw new TypeError("Invalid Input");
    }
    const { state, history } = this._get(id);
    if (state.active === true) {
      this._deviceData.set(id, { state: { ...state, active: false }, history });
      if (this._subscriber) this._subscriber({ id, state: { active: false }, history: [] });
    }
  }

}

exports.createDeviceStore = config => new DeviceStore(config);
