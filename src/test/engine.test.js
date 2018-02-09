const { expect } = require("chai");
const sinon = require("sinon");

describe("scan", () => {
  describe("simple watchlist", () => {
    const watchList = { get: () => ["127.0.0.1", "127.0.0.2", "127.0.0.3"] };
    const pollSpy = sinon.spy();
    const scan = require("../engine.js").createCheckWatchList(
      watchList,
      pollSpy
    );
    scan();
    it("calls poll() for all pending addresses", () => {
      expect(pollSpy.callCount).to.equal(3);
    });
    it("calls poll() with correct args", () => {
      expect(pollSpy.args[0]).to.deep.equal([pollSpy, "127.0.0.1", 0, 0]);
      expect(pollSpy.args[1]).to.deep.equal([pollSpy, "127.0.0.2", 0, 0]);
      expect(pollSpy.args[2]).to.deep.equal([pollSpy, "127.0.0.3", 0, 0]);
    });
  });

  describe("empty watchlist", () => {
    const watchList = { get: () => [] };
    const pollSpy = sinon.spy();
    const scan = require("../engine.js").createCheckWatchList(
      watchList,
      pollSpy
    );
    scan();
    it("never calls poll()", () => {
      expect(pollSpy.callCount).to.equal(0);
    });
  });
});

describe("poll", () => {
  const deviceStore = {};
  const watchList = {};
  const config = {
    fetch: { port: 8080, resource: "testResource", sequenceKey: "testSeq" },
    summary: [["prop1", "Property_1"], ["prop2", "Property_2"]]
  };
  let fetchStub, poll, pollSpy;

  beforeEach(() => {
    watchList.update = sinon.spy();
    deviceStore.set = sinon.spy();
    pollSpy = sinon.spy();
  });

  describe("normal behavior", () => {
    beforeEach(() => {
      const testResponse =
        'display({Property_1:"Value_1",Property_2:"Value_2"})';
      fetchStub = sinon
        .stub()
        .resolves({ text: sinon.stub().resolves(testResponse) });
      watchList.has = sinon.stub().returns(true);
      poll = require("../engine.js").createPoll(
        watchList,
        deviceStore,
        config,
        fetchStub
      );
    });
    it("calls model.watchList.has with correct arguments", async () => {
      await poll(pollSpy, "127.0.0.1", 12345, 0);
      expect(watchList.has.calledWith("127.0.0.1")).to.be.true;
    });
    it("calls model.master.set", async () => {
      await poll(pollSpy, "127.0.0.1", 12345, 0);
      expect(deviceStore.set.called).to.be.true;
    });
    it("calls model.master.set with correct arguments", async () => {
      await poll(pollSpy, "127.0.0.1", 12345, 0);
      expect(deviceStore.set.args[0]).to.deep.equal([
        "127.0.0.1",
        {
          Property_1: "Value_1",
          Property_2: "Value_2"
        }
      ]);
    });
    it("calls fetch with correct arguments", async () => {
      await poll(pollSpy, "127.0.0.1", 12345, 0);
      expect(fetchStub.calledWith("http://127.0.0.1:8080/testResource12345")).to
        .be.true;
    });
    it("calls poll", async () => {
      await poll(pollSpy, "127.0.0.1", 12345, 0);
      expect(pollSpy.called).to.be.true;
    });
  });

  describe("ipAddress not on watch list", () => {
    beforeEach(() => {
      const testResponse =
        'display({Property_1:"Value_1",Property_2:"Value_2"})';
      fetchStub = sinon
        .stub()
        .resolves({ text: sinon.stub().resolves(testResponse) });
      watchList.has = sinon.stub().returns(false);
      poll = require("../engine.js").createPoll(
        watchList,
        deviceStore,
        config,
        fetchStub
      );
    });
    it("calls model.watchList.has with correct arguments", async () => {
      await poll(pollSpy, "127.0.0.1", 12345, 0);
      expect(watchList.has.calledWith("127.0.0.1")).to.be.true;
    });
    it("calls model.master.set with correct arguments", async () => {
      await poll(pollSpy, "127.0.0.1", 12345, 0);
      expect(deviceStore.set.notCalled).to.be.true;
    });
    it("calls fetch with correct arguments", async () => {
      await poll(pollSpy, "127.0.0.1", 12345, 0);
      expect(fetchStub.notCalled).to.be.true;
    });
    it("calls poll", async () => {
      await poll(pollSpy, "127.0.0.1", 12345, 0);
      expect(pollSpy.notCalled).to.be.true;
    });
  });

  describe("bad data on eval", () => {
    beforeEach(() => {
      const testResponse = 'display({Property_1:"Value_1",Property_"})';
      fetchStub = sinon
        .stub()
        .resolves({ text: sinon.stub().resolves(testResponse) });
      watchList.has = sinon.stub().returns(true);
      poll = require("../engine.js").createPoll(
        watchList,
        deviceStore,
        config,
        fetchStub
      );
    });
    it("dose not call poll", async () => {
      await poll(pollSpy, "127.0.0.1", 0, 0);
      expect(pollSpy.notCalled).to.be.true;
    });
  });
});
