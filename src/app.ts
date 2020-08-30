import "./httpProxy.js";
import "./vncProxy.js";
import "./websocket.js";
import { engine as config } from "./configuration.js";
import Watcher from "./watcher.js";
import { startDemo } from "./demo.js";

/**
 * Collection of all active Watcher instances, accessable by IP address.
 */
const watcherList: { [key: string]: Watcher } = {};

/**
 * Iterates over the ranges of IP addresses specified in the config file.
 * Spawns a watcher instance for each and stores reference in watcherList.
 */
function start(): void {
  console.log("Engine Started");
  config.addressRanges.forEach(({ subnet, start, end }) => {
    for (let i = start; i <= end; i++) {
      const ipAddress = subnet.slice(0, -1) + i;
      watcherList[ipAddress] = new Watcher(ipAddress);
      watcherList[ipAddress].start();
    }
  });
}

/**
 * For given IP addresses, kills current instance and spawns a new instance.
 * Refreshes all IP addresses in watcherList if specific list not provided.
 */
function refresh(ipAddressArray?: string[]): void {
  if (!ipAddressArray) ipAddressArray = Object.keys(watcherList);
  ipAddressArray.forEach((ipAddress) => {
    if (watcherList[ipAddress]) {
      watcherList[ipAddress].kill();
      watcherList[ipAddress] = new Watcher(ipAddress);
      watcherList[ipAddress].start();
    }
  });
}

if (process.env.DEMO === "true") startDemo();
else start();

export { refresh };
