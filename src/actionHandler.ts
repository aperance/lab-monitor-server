const fetch = require("node-fetch");

const actions: {
  [type: string]: {
    path: string;
    parameters: string[];
  };
} = require("../config.json").actions;

const actionHandler = (
  targets: string[],
  type: string,
  // @ts-ignore
  { namespace, level }
) => {
  const action = actions[type] || null;
  if (!action)
    return Promise.reject(new Error("Unknown action requested: " + type));
  const promiseArray = targets.map(
    (ipAddress): Promise<any> => {
      let url = "http://" + ipAddress + action.path;
      if (type === "logLevel")
        url = url + "?namespace=" + namespace + "&level=" + level;
      console.log("Fetching " + url);
      return fetch(url)
        .then((res: any) => res.ok)
        .catch((err: any) => false);
    }
  );

  return Promise.all(promiseArray);
};

export default actionHandler;
