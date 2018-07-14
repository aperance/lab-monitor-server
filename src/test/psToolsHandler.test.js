const psToolsHandler = require("../psToolsHandler.js").default;

jest.mock(
  "../../config.json",
  () => ({
    psTools: {
      user: "(testUser)",
      password: "(testPassword)"
    }
  }),
  { virtual: true }
);

jest.mock("child_process");
const exec = require("child_process").exec;

test("psExec without error", () => {
  exec.mockImplementation((str, cb) => cb(null, "(stdout)", "(stderr)"));
  const request = {
    target: "127.0.0.1",
    mode: "psExec",
    argument: "(testString)"
  };
  return psToolsHandler(request).then(result => {
    expect(result).toEqual({
      err: null,
      result:
        "$ C:\\PSTools\\psexec -d -i \\\\127.0.0.1 -u \\(testUser) " +
        "-p (testPassword) (testString)\r\n(stdout)(stderr)"
    });
  });
});

test("psKill without error", () => {
  exec.mockImplementation((str, cb) => cb(null, "(stdout)", "(stderr)"));
  const request = {
    target: "127.0.0.1",
    mode: "psKill",
    argument: "(testString)"
  };
  return psToolsHandler(request).then(result => {
    expect(result).toEqual({
      err: null,
      result:
        "$ C:\\PSTools\\pskill -t \\\\127.0.0.1 -u \\(testUser) " +
        "-p (testPassword) (testString)\r\n(stdout)(stderr)"
    });
  });
});

test("invalid mode", () => {
  const request = {
    target: "127.0.0.1",
    mode: "psError",
    argument: "(testString)"
  };
  return psToolsHandler(request).then(result => {
    expect(result).toEqual({
      err: Error("Invalid mode specified."),
      result: null
    });
  });
});

test("exec returns error", () => {
  exec.mockImplementation((str, cb) => cb(new Error("TEST ERROR")));
  const request = {
    target: "127.0.0.1",
    mode: "psExec",
    argument: "(testString)"
  };
  return psToolsHandler(request).then(result => {
    expect(result).toEqual({
      err: Error("TEST ERROR"),
      result: null
    });
  });
});
