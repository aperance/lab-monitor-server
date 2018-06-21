import * as got from "got";
import { actionHandler as log } from "./logger";

const actionLookup: {
  [type: string]: {
    path: string;
    parameters: string[];
  };
} = require("../config.json").actions;

const actionHandler = (
  targets: string[],
  type: string,
  parameters?: { [x: string]: string }
) => {
  const action = actionLookup[type];
  if (action)
    return Promise.all(
      targets.map(ipAddress => {
        let url = "http://" + ipAddress + action.path;
        if (type === "logLevel" && parameters) {
          url =
            url +
            "?namespace=" +
            parameters.namespace +
            "&level=" +
            parameters.level;
        }
        log.info(url);
        return got(url, { retries: 0 })
          .then(res => true)
          .catch(err => false);
      })
    );
  else return Promise.reject(new Error("Unknown action requested: " + type));
};

export default actionHandler;
