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

export interface ActionResponse {
  err: string | null;
  ack: boolean | null;
}

/**
 * Handles request from client to perform actions on devices.
 */
const actionHandler = async (
  request: ActionRequest
): Promise<ActionResponse> => {
  log.info(request);

  try {
    /** Immediate response to client when in demo mode */
    if (process.env.DEMO === "true")
      throw Error("Functionality not available in demo mode.");

    validateParamaters(request);
    const ack = await sendRequests(request);
    return { err: null, ack };
  } catch (err) {
    log.error(err);
    return { err: "Error performing request. See server logs.", ack: null };
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
const sendRequests = async (actionRequest: ActionRequest): Promise<boolean> => {
  const { type, targets, parameters } = actionRequest;
  const path = config.actions[type].path;
  const query = parameters ? `?${querystring.stringify(parameters)}` : "";

  const results = await Promise.allSettled(
    targets.map(async (ipAddress) => {
      const url = `http://${ipAddress}${path}${query}`;
      log.info(`Requesting ${url}`);
      const { statusCode } = await got(url, { retries: 0 });
      return `${ipAddress} responded with ${statusCode}`;
    })
  );
  results.forEach((result) => log.info(result));
  return results.every(({ status }) => status === "fulfilled");
};

export default actionHandler;
