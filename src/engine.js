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
  return (poll, ipAddress, sequence, count) => {
    const {
      fetch: { port, resource, sequenceKey, timeout },
      retryInterval,
      maxRetries
    } = config.polling;
    const url =
      ipAddress + ":" + port + resource + "?" + sequenceKey + "=" + sequence;

    if (watchList.has(ipAddress) == false) return;
    else watchList.update(ipAddress);

    console.log("fetching " + url);

    fetch("http://" + url, { timeout })
      .then(res => res.text())
      .then(res => {
        const state = evalWrapper(res.replace("display(", "("));
        deviceStore.set(ipAddress, state);
        poll(poll, ipAddress, state[sequenceKey] || 0, 0);
      })
      .catch(err => {
        if (err == "EvalError") console.log("Error parsing state object");
        else if (err.type == "request-timeout") {
          if (count < maxRetries) {
            console.log("retry " + (count + 1));
            setTimeout(poll, retryInterval, poll, ipAddress, 0, count + 1);
          }
        } else console.log(err);
      });
  };
};

const evalWrapper = x => {
  try {
    return eval(x);
  } catch (e) {
    throw new EvalError();
  }
};

/* For unit testing */
exports.createCheckWatchList = createCheckWatchList;
exports.createPoll = createPoll;
