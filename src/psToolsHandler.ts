import { exec } from "child_process";
import { psToolsHandler as log } from "./logger";

const {
  user,
  password
}: { user: string; password: string } = require("../config.json").psTools;

const psToolsHandler = (req: any): Promise<Error | string> => {
  const { target, mode, argument } = req;
  // if (typeof target !== "string") return;

  let command: string = "C:\\PSTools\\";

  if (mode === "psExec") command += "psexec -d -i ";
  else if (mode === "psKill") command += "pskill -t ";
  else return Promise.reject(new Error("Invalid mode specified."));

  command += `\\\\${target} -u \\${user} -p ${password} ${argument}`;

  return new Promise((resolve, reject) => {
    log.info(`STDIN: ${command}`);
    exec(command, (err: Error | null, stdout: string, stderr: string) => {
      if (err) {
        log.error(err);
        reject(err);
      } else {
        log.info(`STDOUT: ${stdout}`);
        log.info(`STDERR: ${stderr}`);
        resolve("$ " + command + "\r\n" + stdout + stderr);
      }
    });
  });
};

export default psToolsHandler;
