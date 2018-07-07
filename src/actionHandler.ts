import * as got from "got";
import * as querystring from "querystring";
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
  parameters: { [x: string]: string } = {}
): Promise<boolean[]> => {
  const actionConfig = actionLookup[type];

  if (!actionConfig)
    return Promise.reject(new Error("Unknown action requested: " + type));

  if (!checkParams(parameters, actionConfig.parameters))
    return Promise.reject(new Error("Required parameters not provided"));

  return Promise.all(
    targets.map(ipAddress => {
      let url = "http://" + ipAddress + actionConfig.path;
      if (actionConfig.parameters.length !== 0)
        url += "?" + querystring.stringify(parameters);
      log.info(url);
      return got(url, { retries: 0 })
        .then(res => true)
        .catch(err => false);
    })
  );
};

const checkParams = (paramObj: {}, paramConfig: string[]): boolean => {
  const a = Object.keys(paramObj).sort();
  const b = paramConfig.sort();
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export default actionHandler;
