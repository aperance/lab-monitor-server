exports.createPoll = (deviceStore, config, fetch) => {
  const poll = (ipAddress, watchList, sequence = 0, count = 0) => {
    const {
      fetch: { port, resource, sequenceKey, timeout },
      retryInterval,
      maxRetries
    } = config.polling;

    if (!watchList.check(ipAddress)) return;

    const url = "http://" + ipAddress + ":" + port + resource;
    console.log("Fetching " + ipAddress + (count ? ", retry " + count : ""));

    fetch(url + "?" + sequenceKey + "=" + sequence, { timeout })
      .then(res => res.text())
      .then(res => {
        const state = evalWrapper(res.replace("display(", "("));
        console.log("Received state from " + ipAddress);
        deviceStore.set(ipAddress, state);
        poll(ipAddress, watchList, state[sequenceKey] || 0, 0);
      })
      .catch(err => {
        if (err == "EvalError")
          console.log("Error parsing state object from " + ipAddress);
        else if (err.type == "request-timeout") {
          if (count < maxRetries) {
            console.log("No reponse received from " + ipAddress);
            setTimeout(poll, retryInterval, ipAddress, watchList, 0, count + 1);
          }
        } else console.log(err);
      });

    const evalWrapper = x => {
      try {
        return eval(x);
      } catch (e) {
        throw new EvalError();
      }
    };
  };
  return poll;
};
