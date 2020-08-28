/* eslint-disable @typescript-eslint/no-explicit-any */
import got from "got";
import querystring from "querystring";
import { actions } from "./configuration.js";
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
const actionHandler = async (request: {
  [key: string]: any;
}): Promise<ActionResponse> => {
  /** Immediate response to client when in demo mode */
  if (process.env.DEMO === "true") {
    return {
      err: new Error("Functionality not available in demo mode."),
      results: null,
    };
  }

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
 * @throws {Error} on mismatch
 */
const validateParamaters = (request: { [key: string]: any }): ActionRequest => {
  if (!actions[request.type])
    throw new Error("Unknown action type specified: " + request.type);
  const expected = actions[request.type].parameters.sort();
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
 */
const sendRequests = (
  actionRequest: ActionRequest
): Promise<ActionResult[]> => {
  const { path, parameters } = actions[actionRequest.type];
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
