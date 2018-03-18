const net = require("net");
const url = require("url");

exports.createWebsocket = (
  ws,
  deviceStore,
  actionHandler,
  psToolsHandler,
  vncProxy,
  config
) => {
  const server = new ws.Server({ port: 4000 });
  console.log("ws listening");

  server.on("connection", (socket, req) => {
    const { pathname, query } = url.parse(req.url, true);
    if (pathname === "/vnc") vncProxy(socket, query);
    else {
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
