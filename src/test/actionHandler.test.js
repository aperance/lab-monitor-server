const actionHandler = require("../actionHandler.js").default;

jest.mock(
  "../../config.json",
  () => ({
    actions: {
      testActionOne: {
        path: ":9999/path/for/testActionOne",
        parameters: []
      },
      testActionTwo: {
        path: ":9999/path/for/testActionTwo",
        parameters: ["parameterX", "parameterY"]
      }
    }
  }),
  { virtual: true }
);

jest.mock("got");
const got = require("got");

describe("For action with no parameters", () => {
  describe("no parameters provided", () => {
    describe("single target IP address", () => {
      test("request returns without error", async () => {
        got.mockImplementation(() => Promise.resolve());
        expect.assertions(1);
        const result = await actionHandler(["127.0.0.1"], "testActionOne");
        expect(result).toEqual([true]);
      });
      test("request returns an error", async () => {
        got.mockImplementation(() => Promise.reject());
        expect.assertions(1);
        const result = await actionHandler(["127.0.0.1"], "testActionOne");
        expect(result).toEqual([false]);
      });
    });

    describe("multiple target IP address", () => {
      test("request returns without error", async () => {
        got.mockImplementation(() => Promise.resolve());
        expect.assertions(1);
        const result = await actionHandler(
          ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
          "testActionOne"
        );
        expect(result).toEqual([true, true, true]);
      });
      test("request returns an error", async () => {
        got
          .mockImplementationOnce(() => Promise.resolve())
          .mockImplementationOnce(() => Promise.reject())
          .mockImplementationOnce(() => Promise.resolve());
        expect.assertions(1);
        await expect(
          actionHandler(
            ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
            "testActionOne"
          )
        ).resolves.toEqual([true, false, true]);
      });
    });
  });

  describe("invalid parameters provided", () => {
    describe("single target IP address", () => {
      test("throws an error", () =>
        expect(
          actionHandler(["127.0.0.1"], "testActionOne", {
            parameterX: "valueX"
          })
        ).rejects.toThrow("Required parameters not provided"));
    });

    describe("multiple target IP address", () => {
      test("throws an error", () =>
        expect(
          actionHandler(
            ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
            "testActionOne",
            {
              parameterX: "valueX"
            }
          )
        ).rejects.toThrow("Required parameters not provided"));
    });
  });
});

describe("For action with parameters", () => {
  describe("two parameters provided", () => {
    describe("single target IP address", () => {
      test("request returns without error", async () => {
        got.mockImplementation(() => Promise.resolve());
        expect.assertions(1);
        const result = await actionHandler(["127.0.0.1"], "testActionTwo", {
          parameterX: "valueX",
          parameterY: "valueY"
        });
        expect(result).toEqual([true]);
      });
      test("request returns an error", async () => {
        got.mockImplementation(() => Promise.reject());
        expect.assertions(1);
        const result = await actionHandler(["127.0.0.1"], "testActionTwo", {
          parameterX: "valueX",
          parameterY: "valueY"
        });
        expect(result).toEqual([false]);
      });
    });

    describe("multiple target IP address", () => {
      test("request returns without error", async () => {
        got.mockImplementation(() => Promise.resolve());
        expect.assertions(1);
        const result = await actionHandler(
          ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
          "testActionTwo",
          { parameterX: "valueX", parameterY: "valueY" }
        );
        expect(result).toEqual([true, true, true]);
      });
      test("request returns an error", async () => {
        got
          .mockImplementationOnce(() => Promise.resolve())
          .mockImplementationOnce(() => Promise.reject())
          .mockImplementationOnce(() => Promise.resolve());
        expect.assertions(1);
        await expect(
          actionHandler(
            ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
            "testActionTwo",
            { parameterX: "valueX", parameterY: "valueY" }
          )
        ).resolves.toEqual([true, false, true]);
      });
    });
  });

  describe("invalid parameters provided", () => {
    describe("single target IP address", () => {
      test("throws an error", () =>
        expect(
          actionHandler(["127.0.0.1"], "testActionTwo", {
            parameterQ: "valueQ",
            parameterR: "valueR"
          })
        ).rejects.toThrow("Required parameters not provided"));
    });

    describe("multiple target IP address", () => {
      test("throws an error", () =>
        expect(
          actionHandler(
            ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
            "testActionTwo",
            { parameterQ: "valueQ", parameterR: "valueR" }
          )
        ).rejects.toThrow("Required parameters not provided"));
    });
  });

  describe("extra parameters provided", () => {
    describe("single target IP address", () => {
      test("throws an error", () =>
        expect(
          actionHandler(["127.0.0.1"], "testActionTwo", {
            parameterX: "valueX",
            parameterY: "valueY",
            parameterR: "valueR"
          })
        ).rejects.toThrow("Required parameters not provided"));
    });

    describe("multiple target IP address", () => {
      test("throws an error", () =>
        expect(
          actionHandler(
            ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
            "testActionTwo",
            { parameterX: "valueX", parameterY: "valueY", parameterR: "valueR" }
          )
        ).rejects.toThrow("Required parameters not provided"));
    });
  });

  describe("no parameters provided", () => {
    describe("single target IP address", () => {
      test("throws an error", () =>
        expect(actionHandler(["127.0.0.1"], "testActionTwo")).rejects.toThrow(
          "Required parameters not provided"
        ));
    });

    describe("multiple target IP address", () => {
      test("throws an error", () =>
        expect(
          actionHandler(
            ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
            "testActionTwo"
          )
        ).rejects.toThrow("Required parameters not provided"));
    });
  });
});

describe("invalid action type", () => {
  describe("single target IP address", () => {
    test("throws an error", () =>
      expect(actionHandler(["127.0.0.1"], "testActionThree")).rejects.toThrow(
        "Unknown action requested: testActionThree"
      ));
  });

  describe("multiple target IP address", () => {
    test("throws an error", () =>
      expect(
        actionHandler(
          ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
          "testActionThree"
        )
      ).rejects.toThrow("Unknown action requested: testActionThree"));
  });
});
