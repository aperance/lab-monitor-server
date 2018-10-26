const actionHandler = require("../actionHandler.js").default;

jest.mock(
  "../configuration.js",
  () => ({
    default: {
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
    }
  }),
  { virtual: true }
);

jest.mock("got");
const got = require("got");
const sendToClient = jest.fn();

beforeEach(() => {
  got.mockClear();
  sendToClient.mockClear();
});

describe("Performing action requests", () => {
  describe("action without parameters", () => {
    describe("single target IP address", () => {
      test("request returns without error", () => {
        got.mockImplementation(() => Promise.resolve());
        const input = { targets: ["127.0.0.1"], type: "testActionOne" };
        return actionHandler(input).then(result => {
          expect(got).toHaveBeenCalledTimes(1);
          expect(got.mock.calls[0][0]).toEqual(
            "http://127.0.0.1:9999/path/for/testActionOne"
          );
          expect(result).toEqual({
            err: null,
            results: [{ success: true, err: null }]
          });
        });
      });

      test("request returns an error", () => {
        got.mockImplementation(() => Promise.reject("testError"));
        const input = { targets: ["127.0.0.1"], type: "testActionOne" };
        return actionHandler(input).then(result => {
          expect(got).toHaveBeenCalledTimes(1);
          expect(got.mock.calls[0][0]).toEqual(
            "http://127.0.0.1:9999/path/for/testActionOne"
          );
          expect(result).toEqual({
            err: null,
            results: [{ success: false, err: "testError" }]
          });
        });
      });
    });

    describe("multiple target IP address", () => {
      test("request returns without error", () => {
        got.mockImplementation(() => Promise.resolve());
        const input = {
          targets: ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
          type: "testActionOne"
        };
        return actionHandler(input).then(result => {
          expect(got).toHaveBeenCalledTimes(3);
          expect(got.mock.calls[0][0]).toEqual(
            "http://127.0.0.1:9999/path/for/testActionOne"
          );
          expect(got.mock.calls[1][0]).toEqual(
            "http://127.0.0.2:9999/path/for/testActionOne"
          );
          expect(got.mock.calls[2][0]).toEqual(
            "http://127.0.0.3:9999/path/for/testActionOne"
          );
          expect(result).toEqual({
            err: null,
            results: [
              { success: true, err: null },
              { success: true, err: null },
              { success: true, err: null }
            ]
          });
        });
      });

      test("request returns an error", () => {
        got
          .mockImplementationOnce(() => Promise.reject("testError"))
          .mockImplementationOnce(() => Promise.resolve())
          .mockImplementationOnce(() => Promise.reject("testError"));
        const input = {
          targets: ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
          type: "testActionOne"
        };
        return actionHandler(input).then(result => {
          expect(got).toHaveBeenCalledTimes(3);
          expect(got.mock.calls[0][0]).toEqual(
            "http://127.0.0.1:9999/path/for/testActionOne"
          );
          expect(got.mock.calls[1][0]).toEqual(
            "http://127.0.0.2:9999/path/for/testActionOne"
          );
          expect(got.mock.calls[2][0]).toEqual(
            "http://127.0.0.3:9999/path/for/testActionOne"
          );
          expect(result).toEqual({
            err: null,
            results: [
              { success: false, err: "testError" },
              { success: true, err: null },
              { success: false, err: "testError" }
            ]
          });
        });
      });
    });
  });

  describe("action with parameters", () => {
    describe("single target IP address", () => {
      test("request returns without error", () => {
        got.mockImplementation(() => Promise.resolve());
        const input = {
          targets: ["127.0.0.1"],
          type: "testActionTwo",
          parameters: {
            parameterX: "valueX",
            parameterY: "valueY"
          }
        };
        return actionHandler(input).then(result => {
          expect(got).toHaveBeenCalledTimes(1);
          expect(got.mock.calls[0][0]).toEqual(
            "http://127.0.0.1:9999/path/for/testActionTwo?parameterX=valueX&parameterY=valueY"
          );
          expect(result).toEqual({
            err: null,
            results: [{ success: true, err: null }]
          });
        });
      });

      test("request returns an error", () => {
        got.mockImplementation(() => Promise.reject("testError"));
        const input = {
          targets: ["127.0.0.1"],
          type: "testActionTwo",
          parameters: {
            parameterX: "valueX",
            parameterY: "valueY"
          }
        };
        return actionHandler(input).then(result => {
          expect(got).toHaveBeenCalledTimes(1);
          expect(got.mock.calls[0][0]).toEqual(
            "http://127.0.0.1:9999/path/for/testActionTwo?parameterX=valueX&parameterY=valueY"
          );
          expect(result).toEqual({
            err: null,
            results: [{ success: false, err: "testError" }]
          });
        });
      });
    });

    describe("multiple target IP address", () => {
      test("request returns without error", () => {
        got.mockImplementation(() => Promise.resolve());
        const input = {
          targets: ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
          type: "testActionTwo",
          parameters: {
            parameterX: "valueX",
            parameterY: "valueY"
          }
        };
        return actionHandler(input).then(result => {
          expect(got).toHaveBeenCalledTimes(3);
          expect(got.mock.calls[0][0]).toEqual(
            "http://127.0.0.1:9999/path/for/testActionTwo?parameterX=valueX&parameterY=valueY"
          );
          expect(got.mock.calls[1][0]).toEqual(
            "http://127.0.0.2:9999/path/for/testActionTwo?parameterX=valueX&parameterY=valueY"
          );
          expect(got.mock.calls[2][0]).toEqual(
            "http://127.0.0.3:9999/path/for/testActionTwo?parameterX=valueX&parameterY=valueY"
          );
          expect(result).toEqual({
            err: null,
            results: [
              { success: true, err: null },
              { success: true, err: null },
              { success: true, err: null }
            ]
          });
        });
      });

      test("request returns an error", () => {
        got
          .mockImplementationOnce(() => Promise.reject("testError"))
          .mockImplementationOnce(() => Promise.resolve())
          .mockImplementationOnce(() => Promise.reject("testError"));
        const input = {
          targets: ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
          type: "testActionTwo",
          parameters: {
            parameterX: "valueX",
            parameterY: "valueY"
          }
        };
        return actionHandler(input).then(result => {
          expect(got).toHaveBeenCalledTimes(3);
          expect(got.mock.calls[0][0]).toEqual(
            "http://127.0.0.1:9999/path/for/testActionTwo?parameterX=valueX&parameterY=valueY"
          );
          expect(got.mock.calls[1][0]).toEqual(
            "http://127.0.0.2:9999/path/for/testActionTwo?parameterX=valueX&parameterY=valueY"
          );
          expect(got.mock.calls[2][0]).toEqual(
            "http://127.0.0.3:9999/path/for/testActionTwo?parameterX=valueX&parameterY=valueY"
          );
          expect(result).toEqual({
            err: null,
            results: [
              { success: false, err: "testError" },
              { success: true, err: null },
              { success: false, err: "testError" }
            ]
          });
        });
      });
    });
  });
});

// describe("For action with no parameters", () => {

//   describe("invalid parameters provided", () => {
//     describe("single target IP address", () => {
//       test("throws an error", () =>
//         expect(
//           actionHandler(["127.0.0.1"], "testActionOne", {
//             parameterX: "valueX"
//           })
//         ).rejects.toThrow("Required parameters not provided"));
//     });

//     describe("multiple target IP address", () => {
//       test("throws an error", () =>
//         expect(
//           actionHandler(
//             ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
//             "testActionOne",
//             {
//               parameterX: "valueX"
//             }
//           )
//         ).rejects.toThrow("Required parameters not provided"));
//     });
//   });
// });

// describe("For action with parameters", () => {
//   describe("two parameters provided", () => {
//     describe("single target IP address", () => {
//       test("request returns without error", async () => {
//         got.mockImplementation(() => Promise.resolve());
//         expect.assertions(1);
//         const result = await actionHandler(["127.0.0.1"], "testActionTwo", {
//           parameterX: "valueX",
//           parameterY: "valueY"
//         });
//         expect(result).toEqual([true]);
//       });
//       test("request returns an error", async () => {
//         got.mockImplementation(() => Promise.reject());
//         expect.assertions(1);
//         const result = await actionHandler(["127.0.0.1"], "testActionTwo", {
//           parameterX: "valueX",
//           parameterY: "valueY"
//         });
//         expect(result).toEqual([false]);
//       });
//     });

//     describe("multiple target IP address", () => {
//       test("request returns without error", async () => {
//         got.mockImplementation(() => Promise.resolve());
//         expect.assertions(1);
//         const result = await actionHandler(
//           ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
//           "testActionTwo",
//           { parameterX: "valueX", parameterY: "valueY" }
//         );
//         expect(result).toEqual([true, true, true]);
//       });
//       test("request returns an error", async () => {
//         got
//           .mockImplementationOnce(() => Promise.resolve())
//           .mockImplementationOnce(() => Promise.reject())
//           .mockImplementationOnce(() => Promise.resolve());
//         expect.assertions(1);
//         await expect(
//           actionHandler(
//             ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
//             "testActionTwo",
//             { parameterX: "valueX", parameterY: "valueY" }
//           )
//         ).resolves.toEqual([true, false, true]);
//       });
//     });
//   });

//   describe("invalid parameters provided", () => {
//     describe("single target IP address", () => {
//       test("throws an error", () =>
//         expect(
//           actionHandler(["127.0.0.1"], "testActionTwo", {
//             parameterQ: "valueQ",
//             parameterR: "valueR"
//           })
//         ).rejects.toThrow("Required parameters not provided"));
//     });

//     describe("multiple target IP address", () => {
//       test("throws an error", () =>
//         expect(
//           actionHandler(
//             ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
//             "testActionTwo",
//             { parameterQ: "valueQ", parameterR: "valueR" }
//           )
//         ).rejects.toThrow("Required parameters not provided"));
//     });
//   });

//   describe("extra parameters provided", () => {
//     describe("single target IP address", () => {
//       test("throws an error", () =>
//         expect(
//           actionHandler(["127.0.0.1"], "testActionTwo", {
//             parameterX: "valueX",
//             parameterY: "valueY",
//             parameterR: "valueR"
//           })
//         ).rejects.toThrow("Required parameters not provided"));
//     });

//     describe("multiple target IP address", () => {
//       test("throws an error", () =>
//         expect(
//           actionHandler(
//             ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
//             "testActionTwo",
//             { parameterX: "valueX", parameterY: "valueY", parameterR: "valueR" }
//           )
//         ).rejects.toThrow("Required parameters not provided"));
//     });
//   });

//   describe("no parameters provided", () => {
//     describe("single target IP address", () => {
//       test("throws an error", () =>
//         expect(actionHandler(["127.0.0.1"], "testActionTwo")).rejects.toThrow(
//           "Required parameters not provided"
//         ));
//     });

//     describe("multiple target IP address", () => {
//       test("throws an error", () =>
//         expect(
//           actionHandler(
//             ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
//             "testActionTwo"
//           )
//         ).rejects.toThrow("Required parameters not provided"));
//     });
//   });
// });

// describe("invalid action type", () => {
//   describe("single target IP address", () => {
//     test("throws an error", () =>
//       expect(actionHandler(["127.0.0.1"], "testActionThree")).rejects.toThrow(
//         "Unknown action requested: testActionThree"
//       ));
//   });

//   describe("multiple target IP address", () => {
//     test("throws an error", () =>
//       expect(
//         actionHandler(
//           ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
//           "testActionThree"
//         )
//       ).rejects.toThrow("Unknown action requested: testActionThree"));
//   });
// });
