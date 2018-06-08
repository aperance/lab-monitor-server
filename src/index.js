const app = require("express")();
const http = require("http");
const ws = require("ws");
const net = require("net");
const url = require("url");
const fetch = require("node-fetch");
const winston = require("winston");
const { exec } = require("child_process");
const { promisify } = require("util");

const logger = require("./logger.js").createLoggers(winston);
const got = require("got");

const config = require("../config.json");

const deviceStore = require("./deviceStore.js").createDeviceStore(config);
const Watcher = require("./watcher.js").createWatcherClass(
  config,
  deviceStore,
  got,
  logger
);

const engine = require("./engine.js").createEngine(Watcher, config);

const actionHandler = require("./actionHandler.js").createActionHandler(
  config,
  fetch
);

const psToolsHandler = require("./psToolsHandler.js").createPsToolsHandler(
  config,
  exec
);

const httpProxy = require("./httpProxy.js").createHttpProxy(http);

const vncProxy = require("./vncProxy.js").createVncProxy(net);

const websocket = require("./webSocket.js").createWebsocket(
  ws,
  net,
  url,
  deviceStore,
  engine,
  actionHandler,
  psToolsHandler,
  vncProxy,
  config
);

//watchList.startScanning(poll);
engine.start();

app.get("/", (req, res) => res.send("GET request to the homepage"));

app.get("/stop", (req, res) => {
  engine.stop();
  res.send("OK");
});

app.get("/restart", (req, res) => {
  engine.refreshAll();
  res.send("OK");
});

app.get("/gc", (req, res) => {
  if (global.gc) {
    global.gc();
    res.send("OK");
  } else res.send("You must run program with 'node --expose-gc index.js'");
});

const server = http.createServer(app);
server.listen(8080);

/* Load Demo Store Data */
const testData = require("../testData.json");
if (config.loadTestData)
  deviceStore._deviceData = new Map(Object.entries(testData));
