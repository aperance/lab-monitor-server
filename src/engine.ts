import Watcher from "./watcher";

const {
  addressRanges
}: {
  addressRanges: Array<{
    subnet: string;
    start: number;
    end: number;
  }>;
} = require("../config.json").engine;

interface WatcherList {
  [key: string]: Watcher;
}

const engine = {
  watcherList: {} as WatcherList,

  start() {
    addressRanges.forEach(({ subnet, start, end }) => {
      for (let i = start; i <= end; i++) {
        this.add(subnet.slice(0, -1) + i);
      }
    });
  },

  stop() {
    Object.values(this.watcherList).map(watcher => watcher.kill());
    this.watcherList = {};
  },

  add(ipAddress: string) {
    this.watcherList[ipAddress] = this.createWatcher(ipAddress);
  },

  refresh(ipAddressArray: string[]) {
    ipAddressArray.forEach(ipAddress => {
      this.watcherList[ipAddress].kill();
      this.watcherList[ipAddress] = this.createWatcher(ipAddress);
    });
  },

  refreshAll() {
    Object.entries(this.watcherList).map(([ipAddress, watcher]) => {
      watcher.kill();
      this.watcherList[ipAddress] = this.createWatcher(ipAddress);
    });
  },

  createWatcher(ipAddress: string) {
    return new Watcher(ipAddress);
  }
};

export default engine;
