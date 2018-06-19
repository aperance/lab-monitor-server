import actionHandler from "../actionHandler";

jest.mock(
  "../../config.json",
  () => ({
    actions: {
      testActionOne: {
        path: ":9999/path/for/testActionOne",
        parameters: []
      }
    }
  }),
  { virtual: true }
);

jest.mock("got");
const got = require("got");

describe("Provides correct results", () => {
  describe("for single target IP address", () => {
    test("without error", async () => {
      got.mockImplementation(() => Promise.resolve());
      expect.assertions(1);
      const result = await actionHandler(["127.0.0.1"], "testActionOne");
      expect(result).toEqual([true]);
    });
    test("with an error", async () => {
      got.mockImplementation(() => Promise.reject());
      expect.assertions(1);
      const result = await actionHandler(["127.0.0.1"], "testActionOne");
      expect(result).toEqual([false]);
    });
  });
  describe("for multiple target IP address", () => {
    test("without error", async () => {
      got.mockImplementation(() => Promise.resolve());
      expect.assertions(1);
      const result = await actionHandler(
        ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
        "testActionOne"
      );
      expect(result).toEqual([true, true, true]);
    });
    test("with an error", async () => {
      got
        .mockImplementationOnce(() => Promise.resolve())
        .mockImplementationOnce(() => Promise.reject())
        .mockImplementationOnce(() => Promise.resolve());
      expect.assertions(1);
      const result = await actionHandler(
        ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
        "testActionOne"
      );
      expect(result).toEqual([true, false, true]);
    });
  });
});
