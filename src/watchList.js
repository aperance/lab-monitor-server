class WatchList {
  constructor(config) {
    this._map = new Map();
    this._range = config.watch.range;
    this._timeout = config.watch.timeout;

    this._range.forEach(({ subnet, start, end }) => {
      for (let i = start; i <= end; i++) {
        this._map.set(subnet.slice(0, -1) + i, 0);
      }
    });
  }

  get() {
    return Array.from(this._map)
      .filter(subArray => subArray[1] < Date.now() - this._timeout)
      .map(subArray => subArray[0]);
  }

  add(ipAddress) {
    if (!this.has(ipAddress)) this._map.set(ipAddress, 0);
  }

  update(ipAddress) {
    if (this.has(ipAddress)) this._map.set(ipAddress, Date.now());
  }

  has(ipAddress) {
    return this._map.has(ipAddress);
  }

  delete(ipAddress) {
    this._map.delete(ipAddress);
  }
}

exports.createWatchList = config => new WatchList(config);

// exports.createWatchList = (config) => {

//     const watchList = {
//         _map: new Map(),

//         get() {
//             return Array.from(this._map)
//                         .filter(subArray => subArray[1] < (Date.now() - config.watch.timeout))
//                         .map(subArray => subArray[0]);
//         },

//         add(ipAddress) {
//             if(!this.has(ipAddress)) this._map.set(ipAddress, 0);
//         },

//         update(ipAddress) {
//             if(this.has(ipAddress)) this._map.set(ipAddress, Date.now());
//         },

//         has(ipAddress) { return this._map.has(ipAddress) },

//         delete(ipAddress) { this._map.delete(ipAddress) }
//     };

//     config.watch.range.forEach(({subnet, start, end}) => {
//         for(let i = start; i <= end; i++) {
//             watchList._map.set(subnet.slice(0, -1) + i, 0);
//         }
//     });

//     return watchList;
// };
