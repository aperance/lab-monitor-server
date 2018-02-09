exports.createWebsocket = (io, deviceStore) => {
  io.on("connection", function(socket) {
    console.log("websocket conneted");
    socket.on("iviewListRequest", () => {
      socket.emit("initialState", deviceStore.getAll());
    });
  });

  deviceStore.emitter.on("update", obj => {
    console.log("emitter fired");
    io.emit("update", obj);
  });
};
