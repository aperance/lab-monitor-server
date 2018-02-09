const events = require("events");

class DeviceStore {
  constructor(config) {
    this._state = new Map();
    this._emitter = new events.EventEmitter();
    this._maxSize = config.history.maxSize;
  }

  get(id) {
    return this._state.get(id);
  }

  set(id, newObj) {
    if (typeof id != "string" || typeof newObj != "object") {
      throw new TypeError("Invalid Input");
    }

    const { data: prevObj } = this._state.get(id) || { data: {} };

    const addedProps = Object.entries(newObj)
      .filter(([key]) => !prevObj.hasOwnProperty(key))
      .reduce((obj, [key, newValue]) => {
        obj[key] = [[Date.now(), newValue]];
        return obj;
      }, {});

    const updatedProps = Object.entries(prevObj)
      .filter(([key, history]) => newObj[key] != history[0])
      .map(([key, history]) => {
        history.unshift([Date.now(), newObj[key] || null]);
        while (history.length > this._maxSize) history.pop();
        return [key, history];
      })
      .reduce((obj, [key, history]) => {
        obj[key] = history;
        return obj;
      }, {});

    const modifiedProps = Object.assign(addedProps, updatedProps);
    const finalObj = {
      timestamp: Date.now(),
      data: Object.assign(prevObj, modifiedProps)
    };

    this._emitter.emit("update", modifiedProps);

    this._state.set(id, finalObj);
  }
}

exports.createDeviceStore = config => new DeviceStore(config);

// exports.createDeviceStore = (config) => {

//     return {
//         _state: new Map(),
//         emitter: new events.EventEmitter(),

//         get(id) { return this._state.get(id) },

//         set(id, newObj) {
//             if((typeof id != 'string') || (typeof newObj != 'object')) {
//                 throw new TypeError('Invalid Input');
//             }
//             const {data: prevObj} = this._state.get(id) || {data:{}};

//             const addedProps = Object.entries(newObj)
//                 .filter( ([key]) => !prevObj.hasOwnProperty(key) )
//                 .reduce( (obj, [key, newValue]) => {
//                     obj[key] = [ [Date.now(), newValue] ];
//                     return obj;
//                 }, {});

//             const updatedProps = Object.entries(prevObj)
//                 .filter( ([key, history]) => newObj[key] != history[0] )
//                 .map( ([key, history]) => {
//                     history.unshift([Date.now(), newObj[key] || null]);
//                     while(history.length > config.history.maxSize) history.pop();
//                     return [key, history];
//                 })
//                 .reduce( (obj, [key, history]) => {
//                     obj[key] = history;
//                     return obj;
//                 }, {});

//             const modifiedProps = Object.assign(addedProps, updatedProps);
//             const finalObj = {
//                 timestamp: Date.now(),
//                 data: Object.assign(prevObj, modifiedProps)
//             };

//             this.emitter.emit('update', modifiedProps);

//             this._state.set(id, finalObj);
//         }
//     };

// };

// const _updated = Object.keys(newObj.raw).filter(key => newObj.raw[key] != prev.raw[key][0])
// //.map(key => this.setHistory(id, key, obj.raw[key]));
// .map(key => [key, prev.raw[key].unshift({ timestamp: Date.now(), value: newObj.raw[key] })] )
// .reduce((obj, [key, value]) => obj[key] = value, {});

// Object.keys(prev.raw).filter(key => !obj.raw.hasOwnProperty(key))
//                      .map(key => this.setHistory(id, key, null));

// },
// _setHistory(id, key, value) {
//     this._history[id] = this._history[id] || {};
//     this._history[id][key] = this._history[id][key] || [];

//     this._history[id][key].unshift({ timestamp: Date.now(), value: value });

//     while(this._history[id][key].length > config.history.maxSize) {
//         this._history[id][key].pop();
//     }
// }
