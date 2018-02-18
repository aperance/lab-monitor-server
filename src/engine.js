exports.createEngine = (watchList, deviceStore, config, fetch) => {
  const poll = createPoll(watchList, deviceStore, config, fetch);
  const checkWatchList = createCheckWatchList(watchList, poll);
  setInterval(checkWatchList, 300000);
  checkWatchList();
};

const createCheckWatchList = (watchList, poll) => () => {
  watchList.get().forEach(ipAddress => poll(poll, ipAddress, 0, 0));
};

const createPoll = (watchList, deviceStore, config, fetch) => {
  return async (poll, ipAddress, sequence, count) => {
    if (watchList.has(ipAddress) == false) return;
    else watchList.update(ipAddress);

    const { port, resource, sequenceKey } = config.fetch;
    const url = "http://" + ipAddress + ":" + port + "/" + resource + sequence;

    try {
      var res = await (await fetch(url)).text();
    } catch (err) {
      if (err == "TIMEOUT") poll(poll, ipAddress, 0, 0);
      else if (err == "ETIMEDOUT") {
        if (count < 10) setTimeout(poll, 1000, poll, ipAddress, 0, count++);
      } else if (err == ("ECONNREFUSED" || "ECONNRESET")) {
        if (count < 10) setTimeout(poll, 30000, poll, ipAddress, 0, count++);
      } else throw err;
    }

    try {
      var state = eval(res.replace("display(", "("));
    } catch (err) {
      return;
    }

    deviceStore.set(ipAddress, state);

    poll(poll, ipAddress, state[sequenceKey] || 0, 0);
  };
};

/* For unit testing */
exports.createCheckWatchList = createCheckWatchList;
exports.createPoll = createPoll;
