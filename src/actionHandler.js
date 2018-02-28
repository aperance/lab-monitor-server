exports.createActionHandler = (config, fetch) => {
  return (targets, type) => {
    const promiseArray = targets.map(ipAddress =>
      fetch("http://" + ipAddress + config.actions[type].path)
        .then(res => res.ok)
        .catch(err => false)
    );
    return Promise.all(promiseArray);
  };
};
