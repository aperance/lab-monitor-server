exports.createActionHandler = (config, fetch) => {
  return (targets, type, { namespace, level }) => {
    const promiseArray = targets.map(ipAddress => {
      let url = "http://" + ipAddress + config.actions[type].path;
      if (type === "logLevel")
        url = url + "?namespace=" + namespace + "&level=" + level;
      console.log("Fetching " + url);
      return fetch(url)
        .then(res => res.ok)
        .catch(err => false);
    });

    return Promise.all(promiseArray);
  };
};
