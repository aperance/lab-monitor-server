exports.createWebsocket = (io, deviceStore) => {
  io.on("connection", function(socket) {
    console.log("websocket conneted");
    socket.emit("SET_CONFIGURATION", {
      columns: [
        { property: "Property_A", title: "A" },
        { property: "Property_B", title: "B" }
      ]
    });
    socket.emit("POPULATE_TABLE", deviceStore.getAllState());
  });

  deviceStore.emitter.on("update", obj => {
    console.log("emitter fired");
    io.emit("update", obj);
  });
};
