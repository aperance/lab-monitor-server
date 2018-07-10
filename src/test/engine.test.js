jest.mock("../watcher.js", () => {
  return {
    default: jest.fn().mockImplementation(() => mockWatcherInstance)
  };
});
const mockWatcherInstance = {
  start: jest.fn(),
  kill: jest.fn()
};

jest.mock(
  "../../config.json",
  () => ({
    engine: {
      addressRanges: [
        { subnet: "127.0.1.0", start: 1, end: 3 },
        { subnet: "127.0.2.0", start: 201, end: 203 }
      ]
    }
  }),
  { virtual: true }
);

const Watcher = require("../watcher.js").default;
const engine = require("../engine.js").default;

beforeEach(() => {
  Watcher.mockClear();
  mockWatcherInstance.start.mockClear();
  mockWatcherInstance.kill.mockClear();
});

test("creates watcher instance for all IP addresses", () => {
  engine.start();
  expect(Watcher.mock.instances.length).toEqual(6);
  expect(mockWatcherInstance.start).toHaveBeenCalledTimes(6);
  expect(engine.watcherList).toEqual({
    "127.0.1.1": mockWatcherInstance,
    "127.0.1.2": mockWatcherInstance,
    "127.0.1.3": mockWatcherInstance,
    "127.0.2.201": mockWatcherInstance,
    "127.0.2.202": mockWatcherInstance,
    "127.0.2.203": mockWatcherInstance
  });
});

test("refreshes watcher instance for all IP addresses", () => {
  engine.refresh();
  expect(mockWatcherInstance.kill).toHaveBeenCalledTimes(6);
  expect(Watcher.mock.instances.length).toEqual(6);
  expect(mockWatcherInstance.start).toHaveBeenCalledTimes(6);
  expect(engine.watcherList).toEqual({
    "127.0.1.1": mockWatcherInstance,
    "127.0.1.2": mockWatcherInstance,
    "127.0.1.3": mockWatcherInstance,
    "127.0.2.201": mockWatcherInstance,
    "127.0.2.202": mockWatcherInstance,
    "127.0.2.203": mockWatcherInstance
  });
});

test("refreshes watcher instance for specified IP addresses", () => {
  engine.refresh(["127.0.1.2", "127.0.2.201", "127.0.2.203"]);
  expect(mockWatcherInstance.kill).toHaveBeenCalledTimes(3);
  expect(Watcher.mock.instances.length).toEqual(3);
  expect(mockWatcherInstance.start).toHaveBeenCalledTimes(3);
  expect(engine.watcherList).toEqual({
    "127.0.1.1": mockWatcherInstance,
    "127.0.1.2": mockWatcherInstance,
    "127.0.1.3": mockWatcherInstance,
    "127.0.2.201": mockWatcherInstance,
    "127.0.2.202": mockWatcherInstance,
    "127.0.2.203": mockWatcherInstance
  });
});

test("refresh skips IP addresses not present in watcherList", () => {
  engine.refresh(["127.0.1.2", "127.0.2.255", "127.0.2.203"]);
  expect(mockWatcherInstance.kill).toHaveBeenCalledTimes(2);
  expect(Watcher.mock.instances.length).toEqual(2);
  expect(mockWatcherInstance.start).toHaveBeenCalledTimes(2);
  expect(engine.watcherList).toEqual({
    "127.0.1.1": mockWatcherInstance,
    "127.0.1.2": mockWatcherInstance,
    "127.0.1.3": mockWatcherInstance,
    "127.0.2.201": mockWatcherInstance,
    "127.0.2.202": mockWatcherInstance,
    "127.0.2.203": mockWatcherInstance
  });
});
