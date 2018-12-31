/** @module psToolsHandler */

import { exec, execFile } from "child_process";
import { getPsToolsConfig } from "./configuration";
import { psToolsHandler as log } from "./logger";
import { PsToolsRequest, PsToolsResponse } from "./types";

const { user, password } = getPsToolsConfig();

/**
 * Utilizes PSTools (as child process) to run the provided command on the
 * target device. Errors are caught and included in response to client.
 *
 * @async
 * @param {PsToolsRequest} request
 * @returns {Promise<PsToolsResponse>}
 */
const psToolsHandler = async (
  request: PsToolsRequest
): Promise<PsToolsResponse> => {
  try {
    const { target, mode, argument } = request;

    if (typeof target !== "string")
      throw Error("Missing or invalid 'target' parameter");
    if (typeof argument !== "string")
      throw Error("Missing or invalid 'argument' parameter");

    const args = [`\\\\${target}`, `-u \\${user}`, `-p ${password}`, argument];
    if (mode === "psExec") args.unshift("-d -i");
    else if (mode === "psKill") args.unshift("-t");
    else throw Error("Missing or invalid 'mode' parameter");
    const output = await executeCommand(mode, args);

    const command = `\\\\${target} -u \\${user} -p ${password} ${argument}`;
    return { err: null, result: "$ " + command + "\r\n" + output };
  } catch (err) {
    log.error(err);
    return { err, result: null };
  }
};

/**
 * Executes PsTools as child process. Returns promise that resolves with
 * output string received from target device, or rejects with error.
 *
 * @param {string} command
 * @returns {Promise<string | Error>}
 */
const executeCommand = (
  command: string,
  args: string[]
): Promise<string | Error> => {
  log.info("STDIN: " + command);
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      // @ts-ignore
      { cwd: "C:\\PSTools\\", shell: true },
      (err: any, stdout: string, stderr: string) => {
        /** If error includes exit code, then command was successfull */
        if (err && typeof err.code !== "number") reject(err);
        else {
          log.info("STDOUT: " + stdout);
          log.info("STDERR: " + stderr);
          resolve(stdout + stderr);
        }
      }
    );
  });
};

export default psToolsHandler;
