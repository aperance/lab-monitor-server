import express from "express";
import http from "http";

import engine from "./engine.js";
import { startDemo } from "./demo.js";
import "./httpProxy.js";
import "./vncProxy.js";
import "./websocket.js";

if (process.env.DEMO === "true") startDemo();
else {
  engine.start();

  /*** Express ***/

  const app = express();

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

  app.use(
    express.static("public", {
      setHeaders: (res, path, stat) => {
        res.set("Access-Control-Allow-Origin", "*");
      },
    })
  );

  const server = http.createServer(app);
  server.listen(80);
}
