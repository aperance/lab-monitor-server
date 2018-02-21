exports.createWebsocket = (io, deviceStore, config) => {
  io.on("connection", function(socket) {
    console.log("websocket conneted");
    socket.emit("SET_CONFIGURATION", config.client);
    socket.emit("POPULATE_TABLE", deviceStore.getAllState());
  });

  deviceStore.emitter.on("update", obj => {
    console.log("emitter fired");
    io.emit("update", obj);
  });
};
