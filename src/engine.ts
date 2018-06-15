const config = require("../config.json");
import Watcher from "./watcher";

const engine = {
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
    // @ts-ignore
    Object.values(this.obj).map(watcher => watcher.kill());
    this.obj = {};
  },

  add(ipAddress: string) {
    this.obj[ipAddress] = this.createWatcher(ipAddress);
  },

  refresh(ipAddressArray: string[]) {
    ipAddressArray.forEach(ipAddress => {
      this.obj[ipAddress].kill();
      this.obj[ipAddress] = this.createWatcher(ipAddress);
    });
  },

  refreshAll() {
    Object.entries(this.obj).map(([ipAddress, watcher]) => {
      // @ts-ignoreS
      watcher.kill();
      this.obj[ipAddress] = this.createWatcher(ipAddress);
    });
  },

  createWatcher(ipAddress: string) {
    return new Watcher(ipAddress);
  }
};

export default engine;
