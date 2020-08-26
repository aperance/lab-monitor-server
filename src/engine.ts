import { getEngineConfig } from "./configuration.js";
import Watcher from "./watcher.js";

const { addressRanges } = getEngineConfig();

const engine = {
  watcherList: {} as {
    [ipAddress: string]: Watcher;
  },

  /**
   * Iterates over the ranges of IP addresses specified in the config file.
   * Spawns a watcher instance for each and stores reference in watcherList.
   */
  start(): void {
    // tslint:disable-next-line:no-console
    console.log("Engine Started");
    addressRanges.forEach(({ subnet, start, end }) => {
      for (let i = start; i <= end; i++) {
        const ipAddress = subnet.slice(0, -1) + i;
        this.watcherList[ipAddress] = new Watcher(ipAddress);
        this.watcherList[ipAddress].start();
      }
    });
  },

  /**
   * For given IP addresses, kills current instance and spawns a new instance.
   * Refreshes all IP addresses in watcherList if specific list not provided.
   */
  refresh(ipAddressArray?: string[]): void {
    if (!ipAddressArray) ipAddressArray = Object.keys(this.watcherList);
    ipAddressArray.forEach((ipAddress) => {
      if (this.watcherList[ipAddress]) {
        this.watcherList[ipAddress].kill();
        this.watcherList[ipAddress] = new Watcher(ipAddress);
        this.watcherList[ipAddress].start();
      }
    });
  },
};

export default engine;
