jest.mock("got");

jest.mock("../deviceStore.js", () => ({
  default: {
    set: jest.fn(),
    setInactive: jest.fn()
  }
}));

jest.mock(
  "../configuration.js",
  () => ({
    default: {
      watcher: {
        port: 9999,
        path: "testPath",
        sequenceKey: "testSequenceKey"
      }
    }
  }),
  { virtual: true }
);

jest.useFakeTimers();

const Watcher = require("../watcher.js").default;
const deviceStore = require("../deviceStore.js").default;
const got = require("got");
const setTimeoutPromise = require("util").promisify(setTimeout);

const url = "http://127.0.0.1:9999/testPath?testSequenceKey=";
const mockGenerator = (done, value) => ({
  next: jest.fn(() => ({
    done,
    value
  }))
});
const body = {
  testKey1: "value1",
  testKey2: "value2",
  testSequenceKey: "12345"
};

let watcher;

beforeEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});

describe("watch.stateGenerator", () => {
  test("create iterator from generator", () => {
    watcher = new Watcher("127.0.0.1");
    watcher.state = watcher.stateGenerator();
    const res = watcher.state.next();
    expect(res).toEqual({
      done: false,
      value: { status: "INACTIVE", delay: 0 }
    });
  });

  test("INACTIVE -(false)-> INACTIVE", () => {
    watcher = new Watcher("127.0.0.1");
    watcher.state = watcher.stateGenerator();
    watcher.state.next(); //INACTIVE
    const res = watcher.state.next({ success: false });
    expect(res).toEqual({
      done: false,
      value: { status: "INACTIVE", delay: 5 }
    });
  });

  test("INACTIVE -(true)-> CONNECTED", () => {
    watcher = new Watcher("127.0.0.1");
    watcher.state = watcher.stateGenerator();
    watcher.state.next(); //INACTIVE
    const res = watcher.state.next({ success: true });
    expect(res).toEqual({
      done: false,
      value: { status: "CONNECTED", delay: 0 }
    });
  });

  test("CONNECTED -(true)-> CONNECTED", () => {
    watcher = new Watcher("127.0.0.1");
    watcher.state = watcher.stateGenerator();
    watcher.state.next(); //INACTIVE
    watcher.state.next({ success: true }); //CONNECTED
    const res = watcher.state.next({ success: true });
    expect(res).toEqual({
      done: false,
      value: { status: "CONNECTED", delay: 0 }
    });
  });

  test("CONNECTED -(false)-> RETRY", () => {
    watcher = new Watcher("127.0.0.1");
    watcher.state = watcher.stateGenerator();
    watcher.state.next(); //INACTIVE
    watcher.state.next({ success: true }); //CONNECTED
    const res = watcher.state.next({ success: false });
    expect(res).toEqual({
      done: false,
      value: { status: "RETRY", delay: 0 }
    });
  });

  test("RETRY -(true)-> CONNECTED", () => {
    watcher = new Watcher("127.0.0.1");
    watcher.state = watcher.stateGenerator();
    watcher.state.next(); //INACTIVE
    watcher.state.next({ success: true }); //CONNECTED
    watcher.state.next({ success: false }); //RETRY
    const res = watcher.state.next({ success: true });
    expect(res).toEqual({
      done: false,
      value: { status: "CONNECTED", delay: 0 }
    });
  });

  test("RETRY -(false)-> DISCONNECTED", () => {
    watcher = new Watcher("127.0.0.1");
    watcher.state = watcher.stateGenerator();
    watcher.state.next(); //INACTIVE
    watcher.state.next({ success: true }); //CONNECTED
    watcher.state.next({ success: false }); //RETRY
    const res = watcher.state.next({ success: false });
    expect(res).toEqual({
      done: false,
      value: { status: "DISCONNECTED", delay: 1 }
    });
  });

  test("DISCONNECTED -(true)-> CONNECTED", () => {
    watcher = new Watcher("127.0.0.1");
    watcher.state = watcher.stateGenerator();
    watcher.state.next(); //INACTIVE
    watcher.state.next({ success: true }); //CONNECTED
    watcher.state.next({ success: false }); //RETRY
    watcher.state.next({ success: false }); //DISCONNECTED
    const res = watcher.state.next({ success: true });
    expect(res).toEqual({
      done: false,
      value: { status: "CONNECTED", delay: 0 }
    });
  });

  test("DISCONNECTED -(false)-> DISCONNECTED", () => {
    const _realDate = Date;
    Date.now = () => 0;
    watcher = new Watcher("127.0.0.1");
    watcher.state = watcher.stateGenerator();
    watcher.state.next(); //INACTIVE
    watcher.state.next({ success: true }); //CONNECTED
    watcher.state.next({ success: false }); //RETRY
    watcher.state.next({ success: false }); //DISCONNECTED
    Date.now = () => 10 * 60000;
    const res = watcher.state.next({ success: false });
    expect(res).toEqual({
      done: false,
      value: { status: "DISCONNECTED", delay: 1 }
    });
    Date = _realDate;
  });

  test("DISCONNECTED -(false + 10min)-> INACTIVE", () => {
    const _realDate = Date;
    Date.now = () => 0;
    watcher = new Watcher("127.0.0.1");
    watcher.state = watcher.stateGenerator();
    watcher.state.next(); //INACTIVE
    watcher.state.next({ success: true }); //CONNECTED
    watcher.state.next({ success: false }); //RETRY
    watcher.state.next({ success: false }); //DISCONNECTED
    Date.now = () => 10 * 60000 + 1;
    const res = watcher.state.next({ success: false });
    expect(res).toEqual({
      done: false,
      value: { status: "INACTIVE", delay: 5 }
    });
    Date = _realDate;
  });
});

describe("polling", () => {
  test("returns if state iterator not initialized", async () => {
    expect.assertions(4);
    got.mockResolvedValue({ body: `display(${JSON.stringify(body)})` });
    watcher = new Watcher("127.0.0.1");
    await watcher.poll();
    expect(got).not.toHaveBeenCalled();
    expect(deviceStore.set).not.toHaveBeenCalled();
    expect(setImmediate).not.toHaveBeenCalled();
    expect(setTimeout).not.toHaveBeenCalled();
  });

  test("successful request, default sequence key", async () => {
    expect.assertions(5);
    got.mockResolvedValue({ body: `display(${JSON.stringify(body)})` });
    watcher = new Watcher("127.0.0.1");
    watcher.state = mockGenerator(false, null);
    await watcher.poll();
    expect(got).toHaveBeenCalledWith(url + "0", expect.any(Object));
    expect(watcher.state.next).toHaveBeenCalledWith({ success: true });
    expect(deviceStore.set).toHaveBeenCalledWith(
      "127.0.0.1",
      "CONNECTED",
      body
    );
    expect(setImmediate).toHaveBeenCalledWith(expect.any(Function), "12345");
    expect(setTimeout).not.toHaveBeenCalled();
  });

  test("successful request, provided sequence key", async () => {
    expect.assertions(5);
    got.mockResolvedValue({ body: `display(${JSON.stringify(body)})` });
    watcher = new Watcher("127.0.0.1");
    watcher.state = mockGenerator(false, null);
    await watcher.poll("12345");
    expect(got).toHaveBeenCalledWith(url + "12345", expect.any(Object));
    expect(watcher.state.next).toHaveBeenCalledWith({ success: true });
    expect(deviceStore.set).toHaveBeenCalledWith(
      "127.0.0.1",
      "CONNECTED",
      body
    );
    expect(setImmediate).toHaveBeenCalledWith(expect.any(Function), "12345");
    expect(setTimeout).not.toHaveBeenCalled();
  });

  test("catches reponse with improper string format", async () => {
    expect.assertions(5);
    got.mockResolvedValue({ body: `isplay(${JSON.stringify(body)})` });
    watcher = new Watcher("127.0.0.1");
    watcher.state = mockGenerator(false, { status: "INACTIVE", delay: 5 });
    await watcher.poll();
    expect(got).toHaveBeenCalledWith(url + "0", expect.any(Object));
    expect(watcher.state.next).toHaveBeenCalledWith({ success: false });
    expect(deviceStore.set).toHaveBeenCalledWith("127.0.0.1", "INACTIVE");
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5 * 60000);
    expect(setImmediate).not.toHaveBeenCalled();
  });

  test("catches missing sequence key in reponse", async () => {
    expect.assertions(5);
    got.mockResolvedValue({
      body: `display(${JSON.stringify({ x: "X", y: "Y" })})`
    });
    watcher = new Watcher("127.0.0.1");
    watcher.state = mockGenerator(false, { status: "INACTIVE", delay: 5 });
    await watcher.poll();
    expect(got).toHaveBeenCalledWith(url + "0", expect.any(Object));
    expect(watcher.state.next).toHaveBeenCalledWith({ success: false });
    expect(deviceStore.set).toHaveBeenCalledWith("127.0.0.1", "INACTIVE");
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5 * 60000);
    expect(setImmediate).not.toHaveBeenCalled();
  });

  test("catches device request errors", async () => {
    expect.assertions(5);
    got.mockImplementation(() => {
      const err = new Error();
      err.name = "RequestError";
      return Promise.reject(err);
    });
    watcher = new Watcher("127.0.0.1");
    watcher.state = mockGenerator(false, { status: "INACTIVE", delay: 5 });
    await watcher.poll();
    expect(got).toHaveBeenCalledWith(url + "0", expect.any(Object));
    expect(watcher.state.next).toHaveBeenCalledWith({ success: false });
    expect(deviceStore.set).toHaveBeenCalledWith("127.0.0.1", "INACTIVE");
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5 * 60000);
    expect(setImmediate).not.toHaveBeenCalled();
  });

  test("returns on request cancellation errors", async () => {
    expect.assertions(5);
    got.mockImplementation(() => {
      const err = new Error();
      err.name = "CancelError";
      return Promise.reject(err);
    });
    watcher = new Watcher("127.0.0.1");
    watcher.state = mockGenerator(false, { status: "INACTIVE", delay: 5 });
    await watcher.poll();
    expect(got).toHaveBeenCalledWith(url + "0", expect.any(Object));
    expect(watcher.state.next).not.toHaveBeenCalled();
    expect(deviceStore.set).not.toHaveBeenCalled();
    expect(setTimeout).not.toHaveBeenCalled();
    expect(setImmediate).not.toHaveBeenCalled();
  });

  test("returns on done from state iterator (successful request)", async () => {
    expect.assertions(5);
    got.mockResolvedValue({ body: `display(${JSON.stringify(body)})` });
    watcher = new Watcher("127.0.0.1");
    watcher.state = mockGenerator(true, null);
    await watcher.poll();
    expect(got).toHaveBeenCalledWith(url + "0", expect.any(Object));
    expect(watcher.state.next).toHaveBeenCalledWith({ success: true });
    expect(deviceStore.set).not.toHaveBeenCalled();
    expect(setImmediate).not.toHaveBeenCalled();
    expect(setTimeout).not.toHaveBeenCalled();
  });

  test("returns on done from state iterator (caught error)", async () => {
    expect.assertions(5);
    got.mockResolvedValue({ body: "" });
    watcher = new Watcher("127.0.0.1");
    watcher.state = mockGenerator(true, null);
    await watcher.poll();
    expect(got).toHaveBeenCalledWith(url + "0", expect.any(Object));
    expect(watcher.state.next).toHaveBeenCalledWith({ success: false });
    expect(deviceStore.set).not.toHaveBeenCalled();
    expect(setImmediate).not.toHaveBeenCalled();
    expect(setTimeout).not.toHaveBeenCalled();
  });
});

test("kill instance", async () => {
  watcher = new Watcher("127.0.0.1");
  watcher.state = { return: jest.fn() };
  watcher.request = { cancel: jest.fn() };
  watcher.timer = setTimeout(jest.fn, 60000);
  watcher.kill();
  expect(deviceStore.set).toHaveBeenCalledWith("127.0.0.1", "INACTIVE");
  expect(watcher.state.return).toHaveBeenCalled();
  expect(watcher.request.cancel).toHaveBeenCalled();
  expect(clearTimeout).toHaveBeenCalled();
});

test("kill instance with nulls", async () => {
  watcher = new Watcher("127.0.0.1");
  watcher.state = { return: null };
  watcher.request = { cancel: null };
  watcher.kill();
  expect(deviceStore.set).toHaveBeenCalledWith("127.0.0.1", "INACTIVE");
  expect(clearTimeout).not.toHaveBeenCalled();
});

test("starting instance", done => {
  got.mockResolvedValue({ body: `display(${JSON.stringify(body)})` });
  watcher = new Watcher("127.0.0.1");
  watcher.start();
  setTimeout(() => {
    expect(got).toHaveBeenCalledTimes(1);
    expect(got).toHaveBeenCalledWith(url + "0", expect.any(Object));
    done();
  }, 1000);
  jest.runOnlyPendingTimers();
});
