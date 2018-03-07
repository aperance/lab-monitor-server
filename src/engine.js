exports.createEngine = (watchList, poll, config) => {
  const checkWatchList = createCheckWatchList(watchList, poll);
  setInterval(checkWatchList, config.watchList.checkInterval);
  checkWatchList();
};

const createCheckWatchList = (watchList, poll) => () => {
  watchList.get().forEach(ipAddress => {
    poll(poll, ipAddress, 0, 0);
  });
};

/* For unit testing */
exports.createCheckWatchList = createCheckWatchList;
