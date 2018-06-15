// watchlist.js
// William Aperance
//
// The WatchList class stores Map of IP addresses for desired devices, and ensures
// that the devices are polled at the minimum specified interval. The startScanning
// method is called, with poll function being passed, to begin operation.
//

class WatchList {
  _map: any;
  _poll: any;
  _timeout: number;
  _checkInterval: number;

  constructor(config) {
    // Create Map to store list of assets to monitor,
    // with key = IP address and value = time of last poll.
    this._map = new Map();

    // Function that starts polling cycle for a given IP address.
    // Passed in by startScanning method.
    this._poll = null;

    // When scanning, find devices that have not been polled since now minus _timeout.
    this._timeout = config.watchList.staleDataTimeout;

    // How often to perform a scan.
    this._checkInterval = config.watchList.checkInterval;

    // Cycle through provided ranges, adding IP address to Map.
    config.watchList.range.forEach(({ subnet, start, end }) => {
      for (let i = start; i <= end; i++) {
        this._map.set(subnet.slice(0, -1) + i, 0);
      }
    });
  }

  // Called to initiate scan cycle. Externally defined poll function is passed in.
  startScanning(poll) {
    this._poll = poll;
    setInterval(this._scan.bind(this), this._checkInterval);
    this._scan();
  }

  // Find all devices in Map that have not been polled recently (now minus _timeout),
  // and restart polling cycle for each. To be executed every checkInterval value.
  _scan() {
    return Array.from(this._map)
      .filter(([, timestamp]) => timestamp < Date.now() - this._timeout)
      .forEach(([ipAddress]) => {
        console.log("Initializing polling cycle for " + ipAddress);
        this._poll(ipAddress);
      });
  }

  // Used by poll function to confirm that device with given IP address is still in Map,
  // retuning true or false. If true, also updates timestamp in Map to current time.
  check(ipAddress) {
    if (this._map.has(ipAddress)) {
      this._map.set(ipAddress, Date.now());
      return true;
    } else return false;
  }

  // Add new IP address to Map. Will begin polling at next scan.
  add(ipAddress) {
    if (!this._map.has(ipAddress)) this._map.set(ipAddress, 0);
  }

  // Remove IP address from Map, preventing additional polling.
  delete(ipAddress) {
    this._map.delete(ipAddress);
  }
}

exports.createWatchList = config => new WatchList(config);
