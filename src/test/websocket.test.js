const websocket = require("../websocket.js");
const { serverMock, socketMock } = require("ws");

jest.mock("../engine.js");
const engine = require("../engine.js").default;

jest.mock("../actionHandler.js");
const actionHandler = require("../actionHandler.js").default;

jest.mock("../psToolsHandler.js");
const psToolsHandler = require("../psToolsHandler.js").default;

test("ws test", () => {
  serverMock.emit("connection", socketMock);
  expect(socketMock.send.mock.calls.length).toBe(1);
  expect(socketMock.send.mock.calls[0][0]).toBe(
    '{"type":"DEVICE_DATA_ALL","message":{"state":{},"history":{}}}'
  );
});

test("ws test 2", () => {
  const message = {
    type: "REFRESH_DEVICE",
    targets: ["127.0.0.1", "127.0.0.2", "127.0.0.3"]
  };
  socketMock.emit("message", JSON.stringify(message));
  expect(engine.refresh.mock.calls.length).toBe(1);
  expect(actionHandler.mock.calls.length).toBe(0);
  expect(psToolsHandler.mock.calls.length).toBe(0);
  expect(engine.refresh.mock.calls[0][0]).toEqual(message.targets);
});

test("ws test 3", done => {
  const message = {
    type: "DEVICE_ACTION",
    targets: ["127.0.0.1", "127.0.0.2", "127.0.0.3"],
    action: "testAction",
    parameters: {}
  };
  jest.clearAllMocks();
  actionHandler.mockResolvedValue([true, true, true]);
  socketMock.emit("message", JSON.stringify(message));
  expect(engine.refresh.mock.calls.length).toBe(0);
  expect(actionHandler.mock.calls.length).toBe(1);
  expect(psToolsHandler.mock.calls.length).toBe(0);
  expect(actionHandler.mock.calls[0][0]).toEqual(message.targets);
  setTimeout(() => {
    expect(socketMock.send.mock.calls.length).toBe(1);
    expect(socketMock.send.mock.calls[0][0]).toBe(
      '{"type":"DEVICE_ACTION_RESPONSE","message":{"result":[true,true,true]}}'
    );
    done();
  }, 500);
});
