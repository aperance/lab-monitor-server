exports.createEngine = (Watcher, deviceStore, fetch, config) => ({
  map: new Map(),
  obj: {},

  start() {
    config.watchList.range.forEach(({ subnet, start, end }) => {
      for (let i = start; i <= end; i++) {
        this.add(subnet.slice(0, -1) + i);
      }
    });
  },

  add(ipAddress) {
    const watcher = new Watcher(ipAddress, deviceStore, fetch, config);
    watcher.start();
    this.map.set(ipAddress, watcher);
    this.obj = { ...this.obj, ipAddress: watcher };
  }
});
