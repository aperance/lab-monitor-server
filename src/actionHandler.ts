const fetch = require("node-fetch");
const config = require("../config.json");

const actionHandler = (
  targets: string[],
  type: string,
  { namespace, level }
) => {
  const action = config.actions[type] || null;
  if (!action)
    return Promise.reject(new Error("Unknown action requested: " + type));
  const promiseArray = targets.map(ipAddress => {
    let url = "http://" + ipAddress + action.path;
    if (type === "logLevel")
      url = url + "?namespace=" + namespace + "&level=" + level;
    console.log("Fetching " + url);
    return fetch(url)
      .then(res => res.ok)
      .catch(err => false);
  });

  return Promise.all(promiseArray);
};

export default actionHandler;
