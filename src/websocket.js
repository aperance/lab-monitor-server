exports.createWebsocket = (
  ws,
  net,
  url,
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
      console.log("client connected");

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

      deviceStore.onUpdate(data => {
        socket.send(JSON.stringify({ type: "DEVICE_DATA_UPDATE", ...data }));
      });

      socket.on("message", function incoming(message) {
        const data = JSON.parse(message);

        switch (data.type) {
          case "DEVICE_ACTION":
            console.log("DEVICE_ACTION received");
            actionHandler(data.targets, data.action, data.parameters)
              .then(results => {
                console.log(result);
                socket.send(
                  JSON.stringify({ type: "DEVICE_ACTION_RESPONSE", result })
                );
              })
              .catch(err => console.log(err));
            break;

          case "PSTOOLS_COMMAND":
            console.log("PSTOOLS command received");
            psToolsHandler(data.target, data.mode, data.cmd)
              .then(result => {
                console.log(result);
                JSON.stringify({ type: "PSTOOLS_COMMAND_RESPONSE", result });
              })
              .catch(err => console.log(err));
            break;

          default:
            break;
        }
      });
    }
  });
};
