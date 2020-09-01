/* eslint-disable @typescript-eslint/no-explicit-any */
import got from "got";
import querystring from "querystring";
import config from "./configuration.js";
import { actionHandler as log } from "./logger.js";

export interface ActionRequest {
  targets: string[];
  type: string;
  parameters?: { [key: string]: string };
}

interface ActionResult {
  err: Error | null;
  success: boolean;
}

export interface ActionResponse {
  err: Error | null;
  results: ActionResult[] | null;
}

/**
 * Handles request from client to perform actions on devices.
 */
const actionHandler = async (
  request: ActionRequest
): Promise<ActionResponse> => {
  try {
    /** Immediate response to client when in demo mode */
    if (process.env.DEMO === "true")
      throw Error("Functionality not available in demo mode.");
    log.info(request);
    validateParamaters(request);
    const results: ActionResult[] = await sendRequests(request);
    log.info(results);
    return { err: null, results };
  } catch (err) {
    log.error(err);
    return { err: err.message, results: null };
  }
};

/**
 * Ensure parameter names exactly match thoes listed in config file.
 * @throws {Error} on mismatch
 */
const validateParamaters = (request: ActionRequest): void => {
  if (!config.actions[request.type])
    throw Error("Unknown action type specified: " + request.type);

  const expected = config.actions[request.type].parameters.sort();
  const received = Object.keys(request.parameters || {}).sort();
  if (
    expected.length !== received.length ||
    !expected.every((param: string, i: number) => param === received[i])
  )
    throw Error(`Invalid parameters for action: ${request.type}.
      Expected ${expected}. Recevied ${received}.`);
};

/**
 * Sends specified action request to all target devices.
 */
const sendRequests = (
  actionRequest: ActionRequest
): Promise<ActionResult[]> => {
  const { path, parameters } = config.actions[actionRequest.type];
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
