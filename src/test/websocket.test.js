const websocket = require("../websocket.js");
const { serverMock, socketMock } = require("ws");
const util = require("util");
const setTimeoutPromise = util.promisify(setTimeout);

jest.mock("../engine.js");
const engine = require("../engine.js").default;

jest.mock("../actionHandler.js");
const actionHandler = require("../actionHandler.js").default;

jest.mock("../psToolsHandler.js");
const psToolsHandler = require("../psToolsHandler.js").default;

jest.mock(
  "../configuration.js",
  () => ({
    default: {
      client: {
        testKeyOne: "testValueOne",
        testKeyTwo: "testValueTwo"
      },
      engine: {
        addressRanges: [
          { subnet: "127.0.1.0", start: 1, end: 3 },
          { subnet: "127.0.2.0", start: 201, end: 203 }
        ]
      },
      watcher: {
        port: 9999,
        path: "testPath",
        sequenceKey: "testSequenceKey"
      },
      deviceStore: {
        maxHistory: 5,
        dateFormat: {
          weekday: "short",
          month: "numeric",
          day: "numeric"
        }
      },
      actions: {
        testActionOne: {
          path: ":9999/path/for/testActionOne",
          parameters: []
        },
        testActionTwo: {
          path: ":9999/path/for/testActionTwo",
          parameters: ["parameterX", "parameterY"]
        }
      },
      psTools: {
        user: "(testUser)",
        password: "(testPassword)"
      }
    }
  }),
  { virtual: true }
);

test("sends correct repsponse on client connection", () => {
  serverMock.emit("connection", socketMock);
  expect(socketMock.send.mock.calls.length).toBe(2);
  expect(socketMock.send.mock.calls[0][0]).toBe(
    '{"type":"CONFIGURATION","payload":{"testKeyOne":"testValueOne","testKeyTwo":"testValueTwo"}}'
  );
  expect(socketMock.send.mock.calls[1][0]).toBe(
    '{"type":"DEVICE_DATA_ALL","payload":{"state":{},"history":{}}}'
  );
});

test("correctly acts on REFRESH_DEVICE request", () => {
  const message = {
    type: "REFRESH_DEVICE",
    payload: { targets: ["127.0.0.1", "127.0.0.2", "127.0.0.3"] }
  };
  socketMock.emit("message", JSON.stringify(message));
  expect(engine.refresh.mock.calls.length).toBe(1);
  expect(actionHandler.mock.calls.length).toBe(0);
  expect(psToolsHandler.mock.calls.length).toBe(0);
  expect(engine.refresh.mock.calls[0][0]).toEqual(message.payload.targets);
});

test("correctly acts on DEVICE_ACTION request", async () => {
  const message = {
    type: "DEVICE_ACTION",
    payload: {
      targets: ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
      action: "testAction",
      parameters: {}
    }
  };
  jest.clearAllMocks();
  actionHandler.mockResolvedValue([true, false, true]);
  socketMock.emit("message", JSON.stringify(message));
  await setTimeoutPromise(100);
  expect(engine.refresh.mock.calls.length).toBe(0);
  expect(actionHandler.mock.calls.length).toBe(1);
  expect(psToolsHandler.mock.calls.length).toBe(0);
  expect(actionHandler.mock.calls[0][0]).toEqual(message.payload);
});
