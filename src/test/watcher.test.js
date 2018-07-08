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

test("creates instance and begins operation", done => {
  watcher = new Watcher("127.0.0.1");
  got.mockResolvedValue({ body: `display(${JSON.stringify(body)})` });
  watcher.testCallback = () => {
    expect(got.mock.calls.length).toBe(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=0"
    );
    expect(setImmediate).toHaveBeenCalledTimes(1);
    expect(deviceStore.set.mock.calls.length).toBe(1);
    expect(deviceStore.set.mock.calls[0]).toEqual([
      "127.0.0.1",
      "CONNECTED",
      body
    ]);
    done();
  };
  watcher.start();
});

test("creates instance and begins operation", done => {
  jest.clearAllMocks();
  got.mockResolvedValue({ body: `display(${JSON.stringify(body)})` });
  watcher.testCallback = () => {
    expect(got.mock.calls.length).toBe(1);
    expect(got.mock.calls[0][0]).toEqual(
      "http://127.0.0.1:9999/testPath?testSequenceKey=12345"
    );
    expect(setImmediate).toHaveBeenCalledTimes(1);
    expect(deviceStore.set.mock.calls.length).toBe(1);
    expect(deviceStore.set.mock.calls[0]).toEqual([
      "127.0.0.1",
      "CONNECTED",
      body
    ]);
    done();
  };
  jest.runOnlyPendingTimers();
});

test.skip("kill instance", () => {
  watcher.kill();
  expect(deviceStore.set.mock.calls.length).toBe(2);
  expect(deviceStore.set.mock.calls[1]).toEqual(["127.0.0.1", "INACTIVE"]);
});
