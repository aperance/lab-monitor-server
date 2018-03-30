const dateFormat = {
  weekday: "short",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric"
};

test("Object is constructed with correct properties", () => {
  const config = { history: { maxSize: 10 }, dateFormat };
  const deviceStore = require("../deviceStore.js").createDeviceStore(config);
  expect(typeof deviceStore._deviceData).toBe("object");
  expect(deviceStore._maxSize).toBe(10);
  expect(deviceStore._subscriber).toBe(null);
});

test.skip("subscribe method saves a function as this._subscriber", () => {});

test.skip("subscribe method overwrites any previous this._subscriber", () => {});

test.skip("_get method returns map contents for a specified id", () => {});

test.skip("_get method returns empty state and history objects for an id not present in map", () => {});

test.skip("getAll method returns all data, organized into a single state and history object", () => {});

test.skip("set method, for new device, will store data to state object for id", () => {});

test.skip("set method, for existing device, will overwrite previous state object for id", () => {});
