/** @module actionHandler */

import * as got from "got";
import * as querystring from "querystring";
import configuration from "./configuration";
import { actionHandler as log } from "./logger";

const actionLookup: {
  [type: string]: {
    path: string;
    parameters: string[];
  };
} = configuration.actions;

interface Request {
  [x: string]: any;
}

interface ValidatedRequest {
  targets: string[];
  type: string;
  parameters?: { [key: string]: any };
}

interface Result {
  err: Error | null;
  success: boolean;
}

interface Response {
  err: Error | null;
  results: Result[] | null;
}

/**
 * Handles request from client to perform actions on devices.
 *
 * @async
 * @param {actionRequest} action Type, parameters, and targets for action.
 * @returns {Promise} Results to be sent back to client. Should not reject.
 */
const actionHandler = async (request: Request): Promise<Response> => {
  try {
    const validatedRequest: ValidatedRequest = validateParamaters(request);
    log.info(validatedRequest);
    const results: Result[] = await sendRequests(validatedRequest);
    log.info(results);
    return { err: null, results };
  } catch (err) {
    log.error(err);
    return { err, results: null };
  }
};

/**
 * Ensure parameter names exactly match thoes listed in config file.
 *
 * @param {Request} request
 * @returns {ValidatedRequest}
 * @throws {Error} on mismatch
 */
const validateParamaters = (request: Request): ValidatedRequest => {
  if (!actionLookup[request.type])
    throw new Error("Unknown action type specified: " + request.type);
  const expected = actionLookup[request.type].parameters.sort();
  const received = Object.keys(request.parameters || {}).sort();
  if (
    expected.length !== received.length ||
    !expected.every((param: string, index: number) => param === received[index])
  )
    throw new Error(`Invalid parameters for action: ${request.type}.
      Expected ${expected}. Recevied ${received}.`);
  return request as ValidatedRequest;
};

/**
 * Sends specified action request to all target devices.
 *
 * @param {ValidatedRequest} actionRequest
 * @returns {Promise<Result[]>} Array of results for each request.
 */
const sendRequests = (actionRequest: ValidatedRequest): Promise<Result[]> => {
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
