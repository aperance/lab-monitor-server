class WatchList {
  constructor(config) {
    this._map = new Map();
    this._timeout = config.watchList.staleDataTimeout;

    config.watchList.range.forEach(({ subnet, start, end }) => {
      for (let i = start; i <= end; i++) {
        this._map.set(subnet.slice(0, -1) + i, 0);
      }
    });
  }

  get() {
    return Array.from(this._map)
      .filter(([, timestamp]) => timestamp < Date.now() - this._timeout)
      .map(([ipAddress]) => ipAddress);
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
