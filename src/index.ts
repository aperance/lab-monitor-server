import * as express from "express";
import * as http from "http";

import "./deviceStore";
import engine from "./engine";
import "./websocket";
import "./httpProxy";

engine.start();

const app = express();

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

// /* Load Demo Store Data */
// const testData = require("../testData.json");
// if (config.loadTestData)
//   deviceStore._deviceData = new Map(Object.entries(testData));
