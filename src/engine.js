exports.createEngine = (Watcher, config) => ({
  //map: new Map(),
  obj: {},

  start() {
    config.watchList.range.forEach(({ subnet, start, end }) => {
      for (let i = start; i <= end; i++) {
        this.add(subnet.slice(0, -1) + i);
      }
    });
  },

  stop() {
    Object.values(this.obj).map(watcher => watcher.kill());
    this.obj = {};
  },

  add(ipAddress) {
    const watcher = new Watcher(ipAddress);
    //this.map.set(ipAddress, watcher);
    this.obj[ipAddress] = watcher;
  }
});
