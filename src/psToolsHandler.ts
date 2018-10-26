/** @module psToolsHandler */

import { exec } from "child_process";
import configuration from "./configuration";
import { psToolsHandler as log } from "./logger";

const {
  user,
  password
}: { user: string; password: string } = configuration.psTools;

interface Request {
  [x: string]: string | undefined;
}

interface Response {
  err: Error | null;
  result: string | null;
}

/**
 * Utilizes PSTools (as child process) to run the provided command on the
 * target device. Errors are caught and included in response to client.
 *
 * @async
 * @param {Request} request
 * @returns {Promise<Response>}
 */
const psToolsHandler = async (request: Request): Promise<Response> => {
  try {
    const { target, mode, argument } = request;
    let command: string = "C:\\PSTools\\";

    if (typeof target !== "string")
      throw Error("Missing or invalid 'target' parameter");
    if (typeof argument !== "string")
      throw Error("Missing or invalid 'argument' parameter");

    if (mode === "psExec") command += "psexec -d -i ";
    else if (mode === "psKill") command += "pskill -t ";
    else throw Error("Missing or invalid 'mode' parameter");

    command += `\\\\${target} -u \\${user} -p ${password} ${argument}`;
    const output = await executeCommand(command);
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
const executeCommand = (command: string): Promise<string | Error> => {
  log.info("STDIN: " + command);
  return new Promise((resolve, reject) => {
    exec(command, (err: any, stdout: string, stderr: string) => {
      /** If error includes exit code, then command was successfull */
      if (err && typeof err.code !== "number") reject(err);
      else {
        log.info("STDOUT: " + stdout);
        log.info("STDERR: " + stderr);
        resolve(stdout + stderr);
      }
    });
  });
};

export default psToolsHandler;
