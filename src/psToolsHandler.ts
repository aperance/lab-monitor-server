const config = require("../config.json");
import { exec } from "child_process";

const psToolsHandler = (target, mode, cmd) => {
  const str =
    "C:\\PSTools\\" +
    (mode === "psExec" ? "psexec -d -i " : "") +
    (mode === "psKill" ? "pskill -t " : "") +
    "\\\\" +
    target +
    " -u \\" +
    config.psTools.user +
    " -p " +
    config.psTools.password +
    " " +
    cmd;

  return new Promise((resolve, reject) => {
    exec(str, (err, stdout, stderr) => {
      resolve("$ " + str + "\r\n" + stdout + stderr);
    });
  });
};

export default psToolsHandler;
