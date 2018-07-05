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

test("creates instance and begins operation", async () => {
  got.mockImplementation(() => Promise.resolve({ body: "" }));
  const watcher = new Watcher("127.0.0.1");
  await setTimeoutPromise(100);
  watcher.kill();
  // expect(got.mock.calls.length).toBe(1);
  // expect(got.mock.calls[0][0]).toEqual(
  //   "http://127.0.0.1:9999/testPath?testSequenceKey=0"
  // );
  expect(deviceStore.set.mock.calls.length).toBe(1);
});
