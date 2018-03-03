exports.createWebsocket = (io, deviceStore, actionHandler, config) => {
  io.on("connection", socket => {
    console.log("websocket conneted");

    socket.emit("SET_CONFIGURATION", config.client);
    socket.emit("POPULATE_TABLE", deviceStore.getAllState());
    socket.emit("POPULATE_HISTORY", deviceStore.getAllHistory());

    socket.on("REQUEST_ACTION", (targets, type, parameters, response) => {
      console.log("REQUEST_ACTION received");
      actionHandler(targets, type, parameters)
        .then(result => response(result))
        .catch(err => response(err));
    });
  });

  deviceStore.emitter.on("update", updatedRow => {
    console.log("emitter fired");
    io.emit("UPDATE_ROW", updatedRow);
  });
};
