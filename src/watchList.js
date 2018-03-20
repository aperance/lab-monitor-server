class WatchList {
  constructor(config) {
    this._map = new Map();
    this._poll = null;
    this._timeout = config.watchList.staleDataTimeout;
    this._checkInterval = config.watchList.checkInterval;

    config.watchList.range.forEach(({ subnet, start, end }) => {
      for (let i = start; i <= end; i++) {
        this._map.set(subnet.slice(0, -1) + i, 0);
      }
    });
  }

  _scan() {
    return Array.from(this._map)
      .filter(([, timestamp]) => timestamp < Date.now() - this._timeout)
      .forEach(([ipAddress]) => {
        this._poll(ipAddress);
      });
  }

  startScanning(poll) {
    this._poll = poll;
    setInterval(this._scan.bind(this), this._checkInterval);
    this._scan();
  }

  check(ipAddress) {
    if (this._map.has(ipAddress)) {
      this._map.set(ipAddress, Date.now());
      return true;
    } else return false;
  }

  add(ipAddress) {
    if (!this._map.has(ipAddress)) this._map.set(ipAddress, 0);
  }

  delete(ipAddress) {
    this._map.delete(ipAddress);
  }
}

exports.createWatchList = config => new WatchList(config);
