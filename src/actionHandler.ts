/** @module actionHandler */

import * as got from "got";
import * as querystring from "querystring";
import { actionHandler as log } from "./logger";

const actionLookup: {
  [type: string]: {
    path: string;
    parameters: string[];
  };
} = require("../config.json").actions;

interface ActionRequest {
  targets: string[];
  type: string;
  parameters?: { [key: string]: any };
}

interface ActionResult {
  err: Error | null;
  success: boolean;
}

interface ActionResponse {
  err: Error | null;
  results: ActionResult[] | null;
}

/**
 * Handles request from client to perform actions on devices.
 * @async
 * @param {actionRequest} action Type, parameters, and targets for action.
 * @returns {Promise} Results to be sent back to client. Should not reject.
 */
const actionHandler = async (request: any): Promise<ActionResponse> => {
  try {
    const validatedRequest: ActionRequest = validateParamaters(request);
    log.info(validatedRequest);
    const results: ActionResult[] = await sendRequests(validatedRequest);
    log.info(results);
    return { err: null, results };
  } catch (err) {
    log.error(err);
    return { err, results: null };
  }
};

/**
 * Ensure parameter names exactly match thoes listed in config file.
 * @param {actionRequest}
 * @throws {Error} on mismatch
 */
const validateParamaters = (actionRequest: any): ActionRequest => {
  const actionConfig = actionLookup[actionRequest.type];
  if (!actionConfig)
    throw new Error("Unknown action type specified: " + actionRequest.type);
  const expected = actionLookup[actionRequest.type].parameters.sort();
  const received = Object.keys(actionRequest.parameters || {}).sort();
  if (
    expected.length !== received.length ||
    !expected.every((param: string, index: number) => param === received[index])
  )
    throw new Error(`Invalid parameters for action: ${actionRequest.type}.
      Expected ${expected}. Recevied ${received}.`);
  return actionRequest;
};

/**
 * Sends specified action request to all target devices.
 * @param {actionRequest}
 * @returns {Promise} Array of results for each request.
 */
const sendRequests = (actionRequest: ActionRequest) => {
  const { path, parameters } = actionLookup[actionRequest.type];
  return Promise.all(
    actionRequest.targets.map((ipAddress: string) => {
      let url = "http://" + ipAddress + path;
      if (parameters.length !== 0)
        url += "?" + querystring.stringify(actionRequest.parameters);
      log.info(url);

      return (
        got(url, { retries: 0 })
          .then(res => ({ success: true, err: null }))
          /**
           * Promise not rejected on errors, so that
           * parallel requests are not interrupted.
           */
          .catch(err => ({ success: false, err }))
      );
    })
  );
};

export default actionHandler;
