jest.mock("../websocket.js", () => ({
  sendToAllClients: jest.fn()
}));

jest.mock(
  "../configuration.js",
  () => ({
    default: {
      deviceStore: {
        maxHistory: 5,
        dateFormat: {
          weekday: "short",
          month: "numeric",
          day: "numeric"
        }
      }
    }
  }),
  { virtual: true }
);

const deviceStore = require("../deviceStore.js").default;
const sendToAllClients = require("../websocket.js").sendToAllClients;

const timestamp = new Date()
  .toLocaleString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric"
  })
  .replace(/,/g, "");

beforeEach(() => sendToAllClients.mockClear());

describe("Set an initial device record", () => {
  const state = { key1: "value1", key2: "value2", key3: "value3" };

  test("websocket.sendToAllClients called with modified data", () => {
    deviceStore.set("127.0.0.1", "CONNECTED", state);
    expect(sendToAllClients).toHaveBeenCalledTimes(1);
    expect(sendToAllClients).toHaveBeenCalledWith({
      type: "DEVICE_DATA_UPDATE",
      payload: {
        id: "127.0.0.1",
        state: { ...state, status: "CONNECTED", timestamp },
        history: [
          ["key1", [timestamp, "value1"]],
          ["key2", [timestamp, "value2"]],
          ["key3", [timestamp, "value3"]]
        ]
      }
    });
  });

  test("getAccumulatedRecords provides all records", () => {
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
});

describe("Attempt to set a new device record with INACTIVE status", () => {
  const state = { key1: "value1", key2: "value2", key3: "value3" };

  test("websocket.sendToAllClients NOT called with modified data", () => {
    deviceStore.set("127.0.0.2", "INACTIVE");
    expect(sendToAllClients).not.toHaveBeenCalled();
  });

  test("getAccumulatedRecords provides all records. New device NOT added.", () => {
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
});

describe("Set a new device record", () => {
  const state = { key1: "value1", key2: "value2", key3: "value3" };

  test("websocket.sendToAllClients called with modified data", () => {
    deviceStore.set("127.0.0.2", "CONNECTED", state);
    expect(sendToAllClients).toHaveBeenCalledTimes(1);
    expect(sendToAllClients).toHaveBeenCalledWith({
      type: "DEVICE_DATA_UPDATE",
      payload: {
        id: "127.0.0.2",
        state: { ...state, status: "CONNECTED", timestamp },
        history: [
          ["key1", [timestamp, "value1"]],
          ["key2", [timestamp, "value2"]],
          ["key3", [timestamp, "value3"]]
        ]
      }
    });
  });

  test("getAccumulatedRecords provides all records", () => {
    expect(deviceStore.getAccumulatedRecords()).toEqual({
      state: {
        "127.0.0.1": { ...state, status: "CONNECTED", timestamp },
        "127.0.0.2": { ...state, status: "CONNECTED", timestamp }
      },
      history: {
        "127.0.0.1": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        },
        "127.0.0.2": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        }
      }
    });
  });
});

describe("Set device record with RETRY status", () => {
  test("websocket.sendToAllClients called with modified data", () => {
    deviceStore.set("127.0.0.1", "RETRY");
    expect(sendToAllClients).toHaveBeenCalledTimes(1);
    expect(sendToAllClients).toHaveBeenCalledWith({
      type: "DEVICE_DATA_UPDATE",
      payload: {
        id: "127.0.0.1",
        state: { status: "RETRY" },
        history: []
      }
    });
  });

  test("getAccumulatedRecords provides all records", () => {
    expect(deviceStore.getAccumulatedRecords()).toEqual({
      state: {
        "127.0.0.1": {
          key1: "value1",
          key2: "value2",
          key3: "value3",
          status: "RETRY",
          timestamp
        },
        "127.0.0.2": {
          key1: "value1",
          key2: "value2",
          key3: "value3",
          status: "CONNECTED",
          timestamp
        }
      },
      history: {
        "127.0.0.1": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        },
        "127.0.0.2": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        }
      }
    });
  });
});

describe("Set device record with DISCONNECTED status", () => {
  test("websocket.sendToAllClients called with modified data", () => {
    deviceStore.set("127.0.0.1", "DISCONNECTED");
    expect(sendToAllClients).toHaveBeenCalledTimes(1);
    expect(sendToAllClients).toHaveBeenCalledWith({
      type: "DEVICE_DATA_UPDATE",
      payload: {
        id: "127.0.0.1",
        state: { status: "DISCONNECTED" },
        history: []
      }
    });
  });

  test("getAccumulatedRecords provides all records", () => {
    expect(deviceStore.getAccumulatedRecords()).toEqual({
      state: {
        "127.0.0.1": {
          key1: "value1",
          key2: "value2",
          key3: "value3",
          status: "DISCONNECTED",
          timestamp
        },
        "127.0.0.2": {
          key1: "value1",
          key2: "value2",
          key3: "value3",
          status: "CONNECTED",
          timestamp
        }
      },
      history: {
        "127.0.0.1": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        },
        "127.0.0.2": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        }
      }
    });
  });
});

describe("Set device record with INACTIVE status", () => {
  test("websocket.sendToAllClients called with modified data", () => {
    deviceStore.set("127.0.0.1", "INACTIVE");
    expect(sendToAllClients).toHaveBeenCalledTimes(1);
    expect(sendToAllClients).toHaveBeenCalledWith({
      type: "DEVICE_DATA_UPDATE",
      payload: {
        id: "127.0.0.1",
        state: { status: "INACTIVE" },
        history: []
      }
    });
  });

  test("getAccumulatedRecords provides all records", () => {
    expect(deviceStore.getAccumulatedRecords()).toEqual({
      state: {
        "127.0.0.1": {
          key1: "value1",
          key2: "value2",
          key3: "value3",
          status: "INACTIVE",
          timestamp
        },
        "127.0.0.2": {
          key1: "value1",
          key2: "value2",
          key3: "value3",
          status: "CONNECTED",
          timestamp
        }
      },
      history: {
        "127.0.0.1": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        },
        "127.0.0.2": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        }
      }
    });
  });
});

describe("Set previously INACTIVE device record to CONNECTED", () => {
  const state = { key1: "value1", key2: "value2", key3: "value3" };

  test("websocket.sendToAllClients called with modified data", () => {
    deviceStore.set("127.0.0.1", "CONNECTED", state);
    expect(sendToAllClients).toHaveBeenCalledTimes(1);
    expect(sendToAllClients).toHaveBeenCalledWith({
      type: "DEVICE_DATA_UPDATE",
      payload: {
        id: "127.0.0.1",
        state: { status: "CONNECTED" },
        history: []
      }
    });
  });

  test("getAccumulatedRecords provides all records", () => {
    expect(deviceStore.getAccumulatedRecords()).toEqual({
      state: {
        "127.0.0.1": {
          key1: "value1",
          key2: "value2",
          key3: "value3",
          status: "CONNECTED",
          timestamp
        },
        "127.0.0.2": {
          key1: "value1",
          key2: "value2",
          key3: "value3",
          status: "CONNECTED",
          timestamp
        }
      },
      history: {
        "127.0.0.1": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        },
        "127.0.0.2": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        }
      }
    });
  });
});

describe("Set device record with modified property", () => {
  test("websocket.sendToAllClients called with modified data", () => {
    deviceStore.set("127.0.0.1", "CONNECTED", {
      key1: "value1",
      key2: "value2a",
      key3: "value3"
    });
    expect(sendToAllClients).toHaveBeenCalledTimes(1);
    expect(sendToAllClients).toHaveBeenCalledWith({
      type: "DEVICE_DATA_UPDATE",
      payload: {
        id: "127.0.0.1",
        state: { key2: "value2a" },
        history: [["key2", [timestamp, "value2a"]]]
      }
    });
  });

  test("getAccumulatedRecords provides all records", () => {
    expect(deviceStore.getAccumulatedRecords()).toEqual({
      state: {
        "127.0.0.1": {
          key1: "value1",
          key2: "value2a",
          key3: "value3",
          status: "CONNECTED",
          timestamp
        },
        "127.0.0.2": {
          key1: "value1",
          key2: "value2",
          key3: "value3",
          status: "CONNECTED",
          timestamp
        }
      },
      history: {
        "127.0.0.1": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2a"], [timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        },
        "127.0.0.2": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        }
      }
    });
  });
});

describe("Set device record with added property", () => {
  test("websocket.sendToAllClients called with modified data", () => {
    deviceStore.set("127.0.0.2", "CONNECTED", {
      key1: "value1",
      key2: "value2",
      key3: "value3",
      key4: "value4"
    });
    expect(sendToAllClients).toHaveBeenCalledTimes(1);
    expect(sendToAllClients).toHaveBeenCalledWith({
      type: "DEVICE_DATA_UPDATE",
      payload: {
        id: "127.0.0.2",
        state: { key4: "value4" },
        history: [["key4", [timestamp, "value4"]]]
      }
    });
  });

  test("getAccumulatedRecords provides all records", () => {
    expect(deviceStore.getAccumulatedRecords()).toEqual({
      state: {
        "127.0.0.1": {
          key1: "value1",
          key2: "value2a",
          key3: "value3",
          status: "CONNECTED",
          timestamp
        },
        "127.0.0.2": {
          key1: "value1",
          key2: "value2",
          key3: "value3",
          key4: "value4",
          status: "CONNECTED",
          timestamp
        }
      },
      history: {
        "127.0.0.1": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2a"], [timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        },
        "127.0.0.2": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]],
          key4: [[timestamp, "value4"]]
        }
      }
    });
  });
});

describe("Set device record with removed property", () => {
  test("websocket.sendToAllClients called with modified data", () => {
    deviceStore.set("127.0.0.2", "CONNECTED", {
      key2: "value2",
      key3: "value3",
      key4: "value4"
    });
    expect(sendToAllClients).toHaveBeenCalledTimes(1);
    expect(sendToAllClients).toHaveBeenCalledWith({
      type: "DEVICE_DATA_UPDATE",
      payload: {
        id: "127.0.0.2",
        state: { key1: null },
        history: [["key1", [timestamp, null]]]
      }
    });
  });

  test("getAccumulatedRecords provides all records", () => {
    expect(deviceStore.getAccumulatedRecords()).toEqual({
      state: {
        "127.0.0.1": {
          key1: "value1",
          key2: "value2a",
          key3: "value3",
          status: "CONNECTED",
          timestamp
        },
        "127.0.0.2": {
          key2: "value2",
          key3: "value3",
          key4: "value4",
          status: "CONNECTED",
          timestamp
        }
      },
      history: {
        "127.0.0.1": {
          key1: [[timestamp, "value1"]],
          key2: [[timestamp, "value2a"], [timestamp, "value2"]],
          key3: [[timestamp, "value3"]]
        },
        "127.0.0.2": {
          key1: [[timestamp, null], [timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]],
          key4: [[timestamp, "value4"]]
        }
      }
    });
  });
});

describe("Set device record with added, removed, and modified properties", () => {
  test("websocket.sendToAllClients called with modified data", () => {
    deviceStore.set("127.0.0.1", "CONNECTED", {
      key1: "value1a",
      key2: "value2b",
      key4: "value4"
    });
    expect(sendToAllClients).toHaveBeenCalledTimes(1);
    expect(sendToAllClients).toHaveBeenCalledWith({
      type: "DEVICE_DATA_UPDATE",
      payload: {
        id: "127.0.0.1",
        state: {
          key1: "value1a",
          key2: "value2b",
          key3: null,
          key4: "value4"
        },
        history: [
          ["key1", [timestamp, "value1a"]],
          ["key2", [timestamp, "value2b"]],
          ["key3", [timestamp, null]],
          ["key4", [timestamp, "value4"]]
        ]
      }
    });
  });

  test("getAccumulatedRecords provides all records", () => {
    expect(deviceStore.getAccumulatedRecords()).toEqual({
      state: {
        "127.0.0.1": {
          key1: "value1a",
          key2: "value2b",
          key4: "value4",
          status: "CONNECTED",
          timestamp
        },
        "127.0.0.2": {
          key2: "value2",
          key3: "value3",
          key4: "value4",
          status: "CONNECTED",
          timestamp
        }
      },
      history: {
        "127.0.0.1": {
          key1: [[timestamp, "value1a"], [timestamp, "value1"]],
          key2: [
            [timestamp, "value2b"],
            [timestamp, "value2a"],
            [timestamp, "value2"]
          ],
          key3: [[timestamp, null], [timestamp, "value3"]],
          key4: [[timestamp, "value4"]]
        },
        "127.0.0.2": {
          key1: [[timestamp, null], [timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]],
          key4: [[timestamp, "value4"]]
        }
      }
    });
  });
});

describe("maxHistory limit is enforced", () => {
  test("websocket.sendToAllClients called with modified data", () => {
    deviceStore.set("127.0.0.1", "CONNECTED", { key2: "value2c" });
    deviceStore.set("127.0.0.1", "CONNECTED", { key2: "value2d" });
    deviceStore.set("127.0.0.1", "CONNECTED", { key2: "value2e" });
    expect(sendToAllClients.mock.calls.length).toBe(3);
    expect(sendToAllClients.mock.calls[2][0]).toEqual({
      type: "DEVICE_DATA_UPDATE",
      payload: {
        id: "127.0.0.1",
        state: {
          key2: "value2e"
        },
        history: [["key2", [timestamp, "value2e"]]]
      }
    });
  });

  test("getAccumulatedRecords provides all records", () => {
    expect(deviceStore.getAccumulatedRecords()).toEqual({
      state: {
        "127.0.0.1": {
          key2: "value2e",
          status: "CONNECTED",
          timestamp
        },
        "127.0.0.2": {
          key2: "value2",
          key3: "value3",
          key4: "value4",
          status: "CONNECTED",
          timestamp
        }
      },
      history: {
        "127.0.0.1": {
          key1: [
            [timestamp, null],
            [timestamp, "value1a"],
            [timestamp, "value1"]
          ],
          key2: [
            [timestamp, "value2e"],
            [timestamp, "value2d"],
            [timestamp, "value2c"],
            [timestamp, "value2b"],
            [timestamp, "value2a"]
          ],
          key3: [[timestamp, null], [timestamp, "value3"]],
          key4: [[timestamp, null], [timestamp, "value4"]]
        },
        "127.0.0.2": {
          key1: [[timestamp, null], [timestamp, "value1"]],
          key2: [[timestamp, "value2"]],
          key3: [[timestamp, "value3"]],
          key4: [[timestamp, "value4"]]
        }
      }
    });
  });
});
