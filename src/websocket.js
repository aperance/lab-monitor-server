exports.createWebsocket = (
  io,
  deviceStore,
  actionHandler,
  psToolsHandler,
  config
) => {
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

    socket.on("PSTOOLS", (target, mode, cmd, response) => {
      psToolsHandler(target, mode, cmd, (err, stdout, stderr) => {
        console.log(err);
        console.log("stdout: " + stdout);
        console.log("stderr: " + stderr);

        response("$" + "\r\n" + stderr + stdout);
      });
    });
  });

  deviceStore.emitter.on("update", data => {
    console.log("emitter fired");
    io.emit("UPDATE_ROW", data);
  });
};
