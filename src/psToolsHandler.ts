import { exec } from "child_process";
import { psToolsHandler as log } from "./logger";

const {
  user,
  password
}: { user: string; password: string } = require("../config.json").psTools;

const psToolsHandler = (target: string, mode: string, argument: string) => {
  const command: string =
    "C:\\PSTools\\" +
    (mode === "psExec" ? "psexec -d -i " : "") +
    (mode === "psKill" ? "pskill -t " : "") +
    "\\\\" +
    target +
    " -u \\" +
    user +
    " -p " +
    password +
    " " +
    argument;

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
