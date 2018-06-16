import { exec } from "child_process";

const {
  user,
  password
}: { user: string; password: string } = require("../config.json").psTools;

const psToolsHandler = (target: string, mode: string, cmd: string) => {
  const str =
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
    cmd;

  return new Promise((resolve, reject) => {
    exec(str, (err, stdout, stderr) => {
      resolve("$ " + str + "\r\n" + stdout + stderr);
    });
  });
};

export default psToolsHandler;
