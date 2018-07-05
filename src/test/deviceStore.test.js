jest.mock("../websocket.js", () => ({
  broadcast: jest.fn()
}));

const deviceStore = require("../deviceStore.js").default;
const broadcast = require("../websocket.js").broadcast;

const timestamp = new Date()
  .toLocaleString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
  })
  .replace(/,/g, "");

test("add a new device record", () => {
  const state = { key1: "value1", key2: "value2", key3: "value3" };
  deviceStore.set("127.0.0.1", "CONNECTED", state);
  expect(deviceStore.deviceData.get("127.0.0.1")).toEqual({
    state: { ...state, status: "CONNECTED", timestamp },
    history: {
      key1: [[timestamp, "value1"]],
      key2: [[timestamp, "value2"]],
      key3: [[timestamp, "value3"]]
    }
  });
  expect(broadcast.mock.calls.length).toBe(1);
  expect(broadcast.mock.calls[0][1]).toEqual({
    id: "127.0.0.1",
    state: { ...state, status: "CONNECTED", timestamp },
    history: [
      ["key1", [timestamp, "value1"]],
      ["key2", [timestamp, "value2"]],
      ["key3", [timestamp, "value3"]]
    ]
  });
});

test("new data included in accumulated records", () => {
  const state = { key1: "value1", key2: "value2", key3: "value3" };
  expect(deviceStore.getAccumulatedRecords()).toEqual({
    state: { "127.0.0.1": { ...state, status: "CONNECTED", timestamp } },
    history: {
      "127.0.0.1": {
        key1: [[timestamp, "value1"]],
        key2: [[timestamp, "value2"]],
        key3: [[timestamp, "value3"]]
      }
    }
  });
});
