import { spawn } from "child_process";
import { getPsToolsConfig } from "./configuration.js";

interface PsToolsRequest {
  [x: string]: string | undefined;
}

interface PsToolsResponse {
  err: Error | null;
  result: string | null;
}

const { user, password } = getPsToolsConfig();

/**
 * Utilizes PSTools (as child process) to run the provided command on the
 * target device. Errors are caught and included in response to client.
 */
const psToolsHandler = (
  request: PsToolsRequest,
  sendResponse: (payload: PsToolsResponse) => void
): void => {
  try {
    const { target, mode, argument } = request;

    if (typeof target !== "string" || typeof argument !== "string")
      throw Error(`Missing or invalid parameters: ${JSON.stringify(request)}`);

    let args = `\\\\${target} -u \\${user} -p ${password} ${argument}`;

    if (mode === "psExec") args = "-d -i " + args;
    else if (mode === "psKill") args = "-t " + args;
    else
      throw Error(`Missing or invalid parameters: ${JSON.stringify(request)}`);

    const process = spawn(mode, [args], { cwd: "C:\\PSTools\\", shell: true });

    sendResponse({
      err: null,
      result: `$ C:\\PSTools\\${mode} ${args}\r\n`,
    });

    process.on("error", (err) => {
      throw err;
    });

    process.stdout.on("data", (data) =>
      sendResponse({
        err: null,
        result: data.toString(),
      })
    );

    process.stderr.on("data", (data) =>
      sendResponse({
        err: null,
        result: data.toString().replace(/\.{3}/g, "...\r\n"),
      })
    );
  } catch (err) {
    sendResponse({
      err,
      result: "Error running PsTools command. See console for details.",
    });
  }
};

export default psToolsHandler;
