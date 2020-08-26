import got from "got";
import querystring from "querystring";
import { getActionConfig } from "./configuration.js";
import { actionHandler as log } from "./logger.js";

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

const actionLookup = getActionConfig();

/**
 * Handles request from client to perform actions on devices.
 *
 * @async
 * @param {WsPayload} request Type, parameters, and targets for action.
 * @returns {Promise} Results to be sent back to client. Should not reject.
 */
const actionHandler = async (request: {
  [key: string]: any;
}): Promise<ActionResponse> => {
  try {
    const validatedRequest: ActionRequest = validateParamaters(request);
    log.info(validatedRequest);
    const results: ActionResult[] = await sendRequests(validatedRequest);
    log.info(results);
    return { err: null, results };
  } catch (err) {
    log.error(err);
    return { err: err.message, results: null };
  }
};

/**
 * Ensure parameter names exactly match thoes listed in config file.
 *
 * @param {WsPayload} request
 * @returns {ActionRequest}
 * @throws {Error} on mismatch
 */
const validateParamaters = (request: { [key: string]: any }): ActionRequest => {
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
  return request as ActionRequest;
};

/**
 * Sends specified action request to all target devices.
 *
 * @param {ActionRequest} actionRequest
 * @returns {Promise<ActionResult[]>} Array of results for each request.
 */
const sendRequests = (
  actionRequest: ActionRequest
): Promise<ActionResult[]> => {
  const { path, parameters } = actionLookup[actionRequest.type];
  return Promise.all(
    actionRequest.targets.map((ipAddress: string) => {
      let url = "http://" + ipAddress + path;
      if (parameters.length !== 0)
        url += "?" + querystring.stringify(actionRequest.parameters);
      log.info(url);

      return (
        got(url, { retries: 0 })
          .then(() => ({ success: true, err: null }))
          /**
           * Promise not rejected on errors, so that
           * parallel requests are not interrupted.
           */
          .catch((err) => ({ success: false, err }))
      );
    })
  );
};

export default actionHandler;
