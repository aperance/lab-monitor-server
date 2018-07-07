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

const Watcher = require("../watcher.js").default;
const deviceStore = require("../deviceStore.js").default;
const got = require("got");
const setTimeoutPromise = require("util").promisify(setTimeout);

let watcher;

test("creates instance and begins operation", async () => {
  const body = {
    testKey1: "value1",
    testKey2: "value2",
    testSequenceKey: "12345"
  };
  got.mockResolvedValueOnce({ body: `display(${JSON.stringify(body)})` });
  got.mockResolvedValue({ body: `` });
  //got.mockRejectedValue(new got.RequestError());
  watcher = new Watcher("127.0.0.1");
  watcher.start();
  await setTimeoutPromise(100);
  expect(got.mock.calls.length).toBe(3);
  expect(got.mock.calls[0][0]).toEqual(
    "http://127.0.0.1:9999/testPath?testSequenceKey=0"
  );
  expect(got.mock.calls[1][0]).toEqual(
    "http://127.0.0.1:9999/testPath?testSequenceKey=12345"
  );
  expect(got.mock.calls[2][0]).toEqual(
    "http://127.0.0.1:9999/testPath?testSequenceKey=0"
  );
  expect(deviceStore.set.mock.calls.length).toBe(3);
  expect(deviceStore.set.mock.calls[0]).toEqual([
    "127.0.0.1",
    "CONNECTED",
    body
  ]);
  expect(deviceStore.set.mock.calls[1]).toEqual(["127.0.0.1", "RETRY"]);
  expect(deviceStore.set.mock.calls[2]).toEqual(["127.0.0.1", "DISCONNECTED"]);
});

test("kill instance", () => {
  watcher.kill();
  expect(deviceStore.set.mock.calls.length).toBe(4);
  expect(deviceStore.set.mock.calls[3]).toEqual(["127.0.0.1", "INACTIVE"]);
});
