import { exec } from "child_process";

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
    exec(command, (err: Error | null, stdout: string, stderr: string) => {
      resolve("$ " + command + "\r\n" + stdout + stderr);
    });
  });
};

export default psToolsHandler;
