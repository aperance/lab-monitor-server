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
    this.obj[ipAddress] = new Watcher(ipAddress);
  },

  refresh(ipAddress) {
    this.obj[ipAddress].kill();
    this.obj[ipAddress] = new Watcher(ipAddress);
  },

  refreshAll() {
    Object.entries(this.obj).map(([ipAddress, watcher]) => {
      watcher.kill();
      this.obj[ipAddress] = new Watcher(ipAddress);
    });
  }
});
