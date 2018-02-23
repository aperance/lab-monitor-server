exports.createWebsocket = (io, deviceStore, config) => {
  io.on("connection", socket => {
    console.log("websocket conneted");
    socket.emit("SET_CONFIGURATION", config.client);
    socket.emit("POPULATE_TABLE", deviceStore.getAllState());
  });

  deviceStore.emitter.on("update", updatedRow => {
    console.log("emitter fired");
    io.emit("UPDATE_ROW", updatedRow);
  });
};
