exports.createPsToolsHandler = (config, exec) => {
  return (target, mode, cmd, response) => {
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

    exec(str, (err, stdout, stderr) => {
      response("$ " + str + "\r\n" + stdout + stderr);
    });
  };
};
