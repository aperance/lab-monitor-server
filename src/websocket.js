const net = require("net");
const url = require("url");

exports.createWebsocket = (
  ws,
  deviceStore,
  actionHandler,
  psToolsHandler,
  config
) => {
  const server = new ws.Server({ port: 4000 });
  console.log("ws listening");

  server.on("connection", (socket, req) => {
    const { pathname, query } = url.parse(req.url, true);

    if (pathname === "/data") {
      console.log("data ws received");

      socket.send(
        JSON.stringify({
          type: "CONFIGURATION",
          configuration: config.client
        })
      );

      socket.send(
        JSON.stringify({
          type: "DEVICE_DATA_ALL",
          ...deviceStore.getAll()
        })
      );

      socket.on("message", function incoming(message) {
        const data = JSON.parse(message);
        switch (data.type) {
          case "DEVICE_ACTION":
            console.log("DEVICE_ACTION received");
            actionHandler(data.targets, data.action, data.parameters)
              //.then(result => response(result))
              .catch(err => response(err));
            break;
          default:
            break;
        }
      });

      deviceStore.onUpdate(data => {
        socket.send(JSON.stringify({ type: "DEVICE_DATA_UPDATE", ...data }));
      });
    } else if (pathname === "/vnc") {
      console.log("vnc ws received");

      const vnc = net.createConnection(query.port, query.ip, () => {
        console.log("VNC connection established");
      });

      vnc.on("data", data => {
        try {
          socket.send(data);
        } catch (e) {
          console.log("Client closed, cleaning up target");
          vnc.end();
        }
      });

      vnc.on("end", () => {
        console.log("target disconnected");
        socket.close();
      });

      vnc.on("error", () => {
        console.log("target connection error");
        vnc.end();
        socket.close();
      });

      socket.on("message", msg => vnc.write(msg));

      socket.on("close", (code, reason) => {
        console.log(
          "WebSocket client disconnected: " + code + " [" + reason + "]"
        );
        vnc.end();
      });

      socket.on("error", e => {
        console.log("WebSocket client error: " + e);
        vnc.end();
      });
    }
  });
};

// socket.on("PSTOOLS", (target, mode, cmd, response) => {
//   psToolsHandler(target, mode, cmd, (err, stdout, stderr) => {
//     console.log(err);
//     console.log("stdout: " + stdout);
//     console.log("stderr: " + stderr);

//     response("$" + "\r\n" + stderr + stdout);
//   });
// });
