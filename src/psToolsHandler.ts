import { spawn } from "child_process";
import config from "./configuration.js";
import { psToolsHandler as log } from "./logger.js";

export interface PsToolsRequest {
  target: string;
  mode: string;
  argument: string;
}

export interface PsToolsResponse {
  result: string;
}

/**
 * Utilizes PSTools (as child process) to run the provided command on the
 * target device. Errors are caught and included in response to client.
 */
function psToolsHandler(
  request: PsToolsRequest,
  sendResponse: (payload: PsToolsResponse) => void
): void {
  try {
    const { target, mode, argument } = request;
    const { user, password } = config.psTools;

    let args = `\\\\${target} -u \\${user} -p ${password} ${argument}`;

    if (mode === "psExec") args = "-d -i " + args;
    else if (mode === "psKill") args = "-t " + args;
    else
      throw Error(`Missing or invalid parameters: ${JSON.stringify(request)}`);

    const process = spawn(mode, [args], { cwd: "C:\\PSTools\\", shell: true });

    sendResponse({
      result: `$ C:\\PSTools\\${mode} ${args}\r\n`
    });

    process.on("error", (err) => {
      throw err;
    });

    process.stdout.on("data", (data) =>
      sendResponse({
        result: data.toString()
      })
    );

    process.stderr.on("data", (data) =>
      sendResponse({
        result: data.toString().replace(/\.{3}/g, "...\r\n")
      })
    );
  } catch (err) {
    log.error(err);
    sendResponse({
      result: "Error running PsTools command. See console for details."
    });
  }
}

export default psToolsHandler;
