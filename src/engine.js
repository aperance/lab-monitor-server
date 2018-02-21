exports.createEngine = (watchList, deviceStore, config, fetch) => {
  const poll = createPoll(watchList, deviceStore, config, fetch);
  const checkWatchList = createCheckWatchList(watchList, poll);
  setInterval(checkWatchList, config.watchList.checkInterval);
  checkWatchList();
};

const createCheckWatchList = (watchList, poll) => () => {
  watchList.get().forEach(ipAddress => {
    poll(poll, ipAddress, 0, 0);
  });
};

const createPoll = (watchList, deviceStore, config, fetch) => {
  return async (poll, ipAddress, sequence, count) => {
    const {
      fetch: { port, resource, sequenceKey, timeout },
      retryInterval,
      maxRetries
    } = config.polling;
    const url =
      ipAddress + ":" + port + resource + "?" + sequenceKey + "=" + sequence;

    if (watchList.has(ipAddress) == false) return;
    else watchList.update(ipAddress);

    try {
      console.log("fetching " + url);
      var res = await (await fetch("http://" + url, { timeout })).text();
    } catch (err) {
      if (err.type == "request-timeout") {
        if (count < maxRetries) {
          console.log("retry " + (count + 1));
          setTimeout(poll, retryInterval, poll, ipAddress, 0, count + 1);
        }
      } else console.log(err);
      return;
    }

    try {
      var state = eval(res.replace("display(", "("));
      deviceStore.set(ipAddress, state);
    } catch (err) {
      console.log(err);
      return;
    }

    poll(poll, ipAddress, state[sequenceKey] || 0, 0);
  };
};

/* For unit testing */
exports.createCheckWatchList = createCheckWatchList;
exports.createPoll = createPoll;
