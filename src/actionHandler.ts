/* eslint-disable @typescript-eslint/no-explicit-any */
import got from "got";
import _ from "lodash";
import { stringify } from "querystring";
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
const actionHandler = async (req: ActionRequest): Promise<ActionResponse> => {
  log.info(req);

  /** Immediate response to client when in demo mode */
  if (process.env.DEMO === "true")
    return { err: "Functionality not available in demo mode.", ack: null };

  try {
    const { targets, type, parameters } = req;

    if (!config.actions[type])
      throw Error("Unknown action type specified: " + type);

    /** Ensure parameter names exactly match thoes listed in config file. */
    const expected = config.actions[type].parameters;
    const received = Object.keys(parameters || {});
    if (!_.isEqual(expected, received))
      throw Error(`Invalid parameters for action: ${type}`);

    /** Send action request to specified devices. */
    const results = await Promise.allSettled(
      targets.map(async (ipAddress) => {
        const url =
          `http://${ipAddress}${config.actions[type].path}` +
          `${parameters ? "?" : ""}${stringify(parameters)}`;
        log.info(`Requesting ${url}`);
        const res = await got(url, { retries: 0 });
        return `${ipAddress} responded with ${res.statusCode}`;
      })
    );
    results.forEach((result) => log.info(result));

    return {
      err: null,
      ack: results.every(({ status }) => status === "fulfilled")
    };
  } catch (err) {
    log.error(err);
    return { err: "Error performing request. See server logs.", ack: null };
  }
};

export default actionHandler;
