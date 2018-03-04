const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io").listen(server);
const fetch = require("node-fetch");
const events = require("events");
const exec = require("child_process").exec;
const graphqlHTTP = require("express-graphql");

const config = require("../config.json");
const watchList = require("./watchList.js").createWatchList(config);
const deviceStore = require("./deviceStore.js").createDeviceStore(config);
const engine = require("./engine.js").createEngine(
  watchList,
  deviceStore,
  config,
  fetch
);

const actionHandler = require("./actionHandler.js").createActionHandler(
  config,
  fetch
);
const psToolsHandler = require("./psToolsHandler.js").createPsToolsHandler(
  config,
  exec
);
const schema = require("./graphql.js").createSchema(watchList, deviceStore);
const websocket = require("./websocket.js").createWebsocket(
  io,
  deviceStore,
  actionHandler,
  psToolsHandler,
  config
);

app.use("/graphql", graphqlHTTP({ schema, rootValue: global, graphiql: true }));

app.get("/", (req, res) => res.send("GET request to the homepage"));

server.listen(8080, () => console.log("Example app listening on port 8080"));

/* Load Demo Store Data */
const testData = require("../testData.json");
if (config.loadTestData)
  deviceStore._deviceData = new Map(Object.entries(testData));
