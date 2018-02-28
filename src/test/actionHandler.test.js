test("Sends request to all addresses successfully", () => {
  const mockFetch = jest.fn();
  mockFetch.mockReturnValue(
    new Promise((resolve, reject) => setTimeout(resolve, 100, { ok: true }))
  );
  const mockConfig = { actions: { type1: { path: ":8001/path" } } };
  const actionHandler = require("../actionHandler.js").createActionHandler(
    mockConfig,
    mockFetch
  );
  const ipAddressArray = ["10.10.12.1", "10.10.12.2"];
  return actionHandler(ipAddressArray, "type1").then(result => {
    expect(result).toEqual([true, true]);
    expect(mockFetch.mock.calls[0][0]).toBe("http://10.10.12.1:8001/path");
    expect(mockFetch.mock.calls[1][0]).toBe("http://10.10.12.2:8001/path");
  });
});
