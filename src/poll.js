exports.createPoll = (watchList, deviceStore, config, fetch) => {
  return (poll, ipAddress, sequence, count) => {
    const {
      fetch: { port, resource, sequenceKey, timeout },
      retryInterval,
      maxRetries
    } = config.polling;

    if (watchList.has(ipAddress)) {
      watchList.update(ipAddress);

      const url =
        ipAddress + ":" + port + resource + "?" + sequenceKey + "=" + sequence;

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

      const evalWrapper = x => {
        try {
          return eval(x);
        } catch (e) {
          throw new EvalError();
        }
      };
    }
  };
};
