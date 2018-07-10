import engine from "./engine";
import "./httpProxy";
import "./vncProxy";
import "./websocket";

engine.start();

/*** Express ***/
import * as express from "express";
import * as http from "http";

const app = express();

app.get("/", (req, res) => res.send("GET request to the homepage"));

app.get("/refresh", (req, res) => {
  engine.refresh();
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

// /* Load Demo Store Data */
// const testData = require("../testData.json");
// if (config.loadTestData)
//   deviceStore._deviceData = new Map(Object.entries(testData));
