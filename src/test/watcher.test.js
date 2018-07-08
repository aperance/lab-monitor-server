jest.mock("got");

jest.mock("../deviceStore.js", () => ({
  default: {
    set: jest.fn(),
    setInactive: jest.fn()
  }
}));

jest.mock(
  "../../config.json",
  () => ({
    watcher: {
      port: 9999,
      path: "testPath",
      sequenceKey: "testSequenceKey"
    }
  }),
  { virtual: true }
);

jest.useFakeTimers();

const Watcher = require("../watcher.js").default;
const deviceStore = require("../deviceStore.js").default;
const got = require("got");
const setTimeoutPromise = require("util").promisify(setTimeout);

const body = {
  testKey1: "value1",
  testKey2: "value2",
  testSequenceKey: "12345"
};

let watcher;

const table = [[], []];

test("Creates instance and begins operation", done => {
  watcher = new Watcher("127.0.0.1");
  got.mockRejectedValue(new EvalError());
  watcher.testCallback = () => {
    expect(got).toHaveBeenCalledTimes(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=0"
    );
    expect(setImmediate).toHaveBeenCalledTimes(0);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toBeCalledWith(expect.any(Function), 5 * 60000);
    expect(deviceStore.set).toHaveBeenCalledTimes(1);
    expect(deviceStore.set).toBeCalledWith("127.0.0.1", "INACTIVE");
    done();
  };
  watcher.start();
});

test("Rejects response with unexpected format", done => {
  jest.clearAllMocks();
  got.mockResolvedValue({ body: "" });
  watcher.testCallback = () => {
    expect(got).toHaveBeenCalledTimes(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=0"
    );
    expect(setImmediate).toHaveBeenCalledTimes(0);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toBeCalledWith(expect.any(Function), 5 * 60000);
    expect(deviceStore.set).toHaveBeenCalledTimes(1);
    expect(deviceStore.set).toBeCalledWith("127.0.0.1", "INACTIVE");
    done();
  };
  jest.runOnlyPendingTimers();
});

test("Rejects response without sequence key", done => {
  jest.clearAllMocks();
  got.mockResolvedValue({
    body: `display(${JSON.stringify({ x: "x", y: "y" })})`
  });
  watcher.testCallback = () => {
    expect(got).toHaveBeenCalledTimes(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=0"
    );
    expect(setImmediate).toHaveBeenCalledTimes(0);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toBeCalledWith(expect.any(Function), 5 * 60000);
    expect(deviceStore.set).toHaveBeenCalledTimes(1);
    expect(deviceStore.set).toBeCalledWith("127.0.0.1", "INACTIVE");
    done();
  };
  jest.runOnlyPendingTimers();
});

test("INACTIVE -> CONNECTED", done => {
  jest.clearAllMocks();
  got.mockResolvedValue({ body: `display(${JSON.stringify(body)})` });
  watcher.testCallback = () => {
    expect(got).toHaveBeenCalledTimes(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=0"
    );
    expect(setImmediate).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledTimes(0);
    expect(setImmediate).toBeCalledWith(expect.any(Function), "12345");
    expect(deviceStore.set).toHaveBeenCalledTimes(1);
    expect(deviceStore.set).toBeCalledWith("127.0.0.1", "CONNECTED", body);
    done();
  };
  jest.runOnlyPendingTimers();
});

test("CONNECTED -> CONNECTED", done => {
  jest.clearAllMocks();
  got.mockResolvedValue({ body: `display(${JSON.stringify(body)})` });
  watcher.testCallback = () => {
    expect(got).toHaveBeenCalledTimes(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=12345"
    );
    expect(setImmediate).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledTimes(0);
    expect(setImmediate).toBeCalledWith(expect.any(Function), "12345");
    expect(deviceStore.set).toHaveBeenCalledTimes(1);
    expect(deviceStore.set).toBeCalledWith("127.0.0.1", "CONNECTED", body);
    done();
  };
  jest.runOnlyPendingTimers();
});

test("CONNECTED -> RETRY", done => {
  jest.clearAllMocks();
  got.mockRejectedValue(new EvalError());
  watcher.testCallback = () => {
    expect(got).toHaveBeenCalledTimes(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=12345"
    );
    expect(setImmediate).toHaveBeenCalledTimes(0);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toBeCalledWith(expect.any(Function), 0 * 60000);
    expect(deviceStore.set).toHaveBeenCalledTimes(1);
    expect(deviceStore.set).toBeCalledWith("127.0.0.1", "RETRY");
    done();
  };
  jest.runOnlyPendingTimers();
});

test("RETRY -> DISCONNECTED", done => {
  jest.clearAllMocks();
  got.mockRejectedValue(new EvalError());
  watcher.testCallback = () => {
    expect(got).toHaveBeenCalledTimes(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=0"
    );
    expect(setImmediate).toHaveBeenCalledTimes(0);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toBeCalledWith(expect.any(Function), 1 * 60000);
    expect(deviceStore.set).toHaveBeenCalledTimes(1);
    expect(deviceStore.set).toBeCalledWith("127.0.0.1", "DISCONNECTED");
    done();
  };
  jest.runOnlyPendingTimers();
});

test("DISCONNECTED -> DISCONNECTED", done => {
  jest.clearAllMocks();
  got.mockRejectedValue(new EvalError());
  watcher.testCallback = () => {
    expect(got).toHaveBeenCalledTimes(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=0"
    );
    expect(setImmediate).toHaveBeenCalledTimes(0);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toBeCalledWith(expect.any(Function), 1 * 60000);
    expect(deviceStore.set).toHaveBeenCalledTimes(1);
    expect(deviceStore.set).toBeCalledWith("127.0.0.1", "DISCONNECTED");
    done();
  };
  jest.runOnlyPendingTimers();
});

test("DISCONNECTED -> CONNECTED", done => {
  jest.clearAllMocks();
  got.mockResolvedValue({ body: `display(${JSON.stringify(body)})` });
  watcher.testCallback = () => {
    expect(got).toHaveBeenCalledTimes(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=0"
    );
    expect(setImmediate).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledTimes(0);
    expect(setImmediate).toBeCalledWith(expect.any(Function), "12345");
    expect(deviceStore.set).toHaveBeenCalledTimes(1);
    expect(deviceStore.set).toBeCalledWith("127.0.0.1", "CONNECTED", body);
    done();
  };
  jest.runOnlyPendingTimers();
});

test("Polling ends on cancellation error", done => {
  jest.clearAllMocks();
  got.mockRejectedValue({ name: "CancelError" });
  watcher.testCallback = () => {
    expect(got).toHaveBeenCalledTimes(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=12345"
    );
    expect(setImmediate).toHaveBeenCalledTimes(0);
    expect(setTimeout).toHaveBeenCalledTimes(0);
    expect(deviceStore.set).toHaveBeenCalledTimes(0);
    done();
  };
  jest.runOnlyPendingTimers();
});

test("kill instance", () => {
  jest.clearAllMocks();
  watcher.kill();
  expect(deviceStore.set).toHaveBeenCalledTimes(1);
  expect(deviceStore.set).toBeCalledWith("127.0.0.1", "INACTIVE");
});

test("Start poll without initializing generator", () => {
  watcher = new Watcher("127.0.0.1");
  watcher.poll();
  expect(got).toHaveBeenCalledTimes(0);
});
