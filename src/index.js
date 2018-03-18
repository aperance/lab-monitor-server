const app = require("express")();
const server = require("http").createServer(app);
const ws = require("ws");
const net = require("net");
const fetch = require("node-fetch");
const exec = require("child_process").exec;

const config = require("../config.json");
const watchList = require("./watchList.js").createWatchList(config);
const deviceStore = require("./deviceStore.js").createDeviceStore(config);
const poll = require("./poll.js").createPoll(
  watchList,
  deviceStore,
  config,
  fetch
);
const engine = require("./engine.js").createEngine(watchList, poll, config);

const actionHandler = require("./actionHandler.js").createActionHandler(
  config,
  fetch
);
const psToolsHandler = require("./psToolsHandler.js").createPsToolsHandler(
  config,
  exec
);
const vncProxy = require("./vncProxy.js").createVncProxy(net);

const websocket = require("./webSocket.js").createWebsocket(
  ws,
  deviceStore,
  actionHandler,
  psToolsHandler,
  vncProxy,
  config
);

app.get("/", (req, res) => res.send("GET request to the homepage"));

server.listen(8080);

/* Load Demo Store Data */
const testData = require("../testData.json");
if (config.loadTestData)
  deviceStore._deviceData = new Map(Object.entries(testData));
