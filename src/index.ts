import engine from "./engine.js";
import { startDemo } from "./demo.js";
import "./httpProxy.js";
import "./vncProxy.js";
import "./websocket.js";

if (process.env.DEMO === "true") startDemo();
else {
  engine.start();
}
