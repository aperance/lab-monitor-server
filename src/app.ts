import http from "http";
import url from "url";
import { connectionHandler as primaryWsServer } from "./websocket.js";
import { connectionHandler as vncWsServer } from "./vncProxy.js";
import config from "./configuration.js";
import Watcher from "./watcher.js";
import deviceStore, { State, Status } from "./deviceStore.js";
import httpProxyHandler from "./httpProxy.js";

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

/**
 * Start server in demo mode. Populates device store with random data to
 * simulate connected devices. Watcher class is not utilized.
 * For use only with live demo at http://qa.aperance.dev.
 */
function startDemo() {
  console.log(`Starting in demo mode, role: ${process.env.DEMO_ROLE}`);

  const deviceCount = 50;
  const hardwareOptions = ["Rev A", "Rev B", "Rev C", "Rev D", "Rev E"];
  const firmwareOptions = ["v1.0.5", "v2.0.4", "v3.0.3", "v4.0.2", "v5.0.1"];
  const randomProperties = [...Array(26)].map(
    (_, i) => "property" + String.fromCharCode(65 + i)
  );

  const getRandomString = () =>
    Math.random().toString().substr(2, 10).padStart(10, "0").toUpperCase();

  const pickFrom = (arr: string[]) =>
    arr[Math.floor(Math.random() * arr.length)];

  for (let i = 1; i <= deviceCount; i++) {
    const ipAddress = "127.0.0." + i;
    const state: State = {
      ipAddress,
      serial: getRandomString(),
      hardware: pickFrom(hardwareOptions),
      firmware: pickFrom(firmwareOptions)
    };
    randomProperties.forEach((prop) => (state[prop] = getRandomString()));
    deviceStore.set(ipAddress, Status.Connected, state);
  }

  setInterval(() => {
    const ipAddress = "127.0.0." + Math.ceil(Math.random() * deviceCount);
    const state = { ...deviceStore.getAccumulatedRecords().state[ipAddress] };
    randomProperties.forEach((prop) => (state[prop] = getRandomString()));
    deviceStore.set(ipAddress, Status.Connected, state);
  }, 200);
}

if (process.env.DEMO === "true") startDemo();
else start();

/**
 *
 */
http
  .createServer(httpProxyHandler)
  .on("upgrade", function upgrade(request, socket, head) {
    const { pathname } = url.parse(request.url);
    if (pathname === "/data") primaryWsServer(request, socket, head);
    else if (pathname === "/vnc") vncWsServer(request, socket, head);
    else socket.destroy();
  })
  .listen(parseInt(process.env.PORT || "4000"));

export { refresh };
