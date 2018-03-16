exports.createWebsocket = (
  io,
  deviceStore,
  actionHandler,
  psToolsHandler,
  config
) => {
  io.on("connection", socket => {
    socket.emit("CONFIGURATION", config.client);
    socket.emit("DEVICE_DATA_ALL", deviceStore.getAll());

    deviceStore.onUpdate(data => {
      socket.emit("DEVICE_DATA_UPDATE", data);
    });

    socket.on("REQUEST_ACTION", (targets, type, parameters, response) => {
      console.log("REQUEST_ACTION received");
      actionHandler(targets, type, parameters)
        .then(result => response(result))
        .catch(err => response(err));
    });

    socket.on("PSTOOLS", (target, mode, cmd, response) => {
      psToolsHandler(target, mode, cmd, response);
    });
  });
};
