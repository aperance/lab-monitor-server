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

test("without error", async () => {
  exec.mockImplementation((str, cb) => cb(null, "(stdout)", "(stderr)"));
  expect.assertions(1);
  const result = await psToolsHandler("127.0.0.1", "psExec", "(testString)");
  expect(result).toEqual(
    "$ C:\\PSTools\\psexec -d -i \\\\127.0.0.1 -u \\(testUser) -p (testPassword) (testString)\r\n(stdout)(stderr)"
  );
});
