const { expect } = require("chai");

describe("WatchList", function() {
  describe("Constructor", function() {
    describe("with specified ranges", function() {
      const config = {
        watch: {
          range: [
            { subnet: "172.19.106.0", start: "1", end: "100" },
            { subnet: "172.20.107.0", start: "200", end: "255" }
          ]
        }
      };
      const watchList = require("../watchList.js").createWatchList(config);
      it("should create a map", () => expect(watchList._map).to.be.a("map"));
      it("map should have 156 items", () =>
        expect(watchList._map.size).to.equal(156));
      it("correct values", () =>
        expect(watchList._map.get("172.19.106.100")).to.equal(0));
    });
    describe("with large specified ranges", function() {
      const config = {
        watch: {
          range: [
            { subnet: "172.19.106.0", start: "1", end: "255" },
            { subnet: "172.20.106.0", start: "1", end: "255" },
            { subnet: "172.19.107.0", start: "1", end: "255" },
            { subnet: "172.20.107.0", start: "1", end: "255" },
            { subnet: "172.19.108.0", start: "1", end: "255" },
            { subnet: "172.20.108.0", start: "1", end: "255" },
            { subnet: "172.19.109.0", start: "1", end: "255" },
            { subnet: "172.20.109.0", start: "1", end: "255" }
          ]
        }
      };
      const watchList = require("../watchList.js").createWatchList(config);
      it("should create a map", () => expect(watchList._map).to.be.a("map"));
      it("map should have 156 items", () =>
        expect(watchList._map.size).to.equal(2040));
      it("correct values", () =>
        expect(watchList._map.get("172.19.106.100")).to.equal(0));
    });
    describe("with no default ranges", function() {
      const config = { watch: { range: [] } };
      const watchList = require("../watchList.js").createWatchList(config);
      it("should create a map", () => expect(watchList._map).to.be.a("map"));
      it("map should have 0 items", () =>
        expect(watchList._map.size).to.equal(0));
    });
    describe("with overlapping ranges", function() {
      it("no duplicate item");
    });
    describe("with range start = end", function() {
      it("create single item");
    });
  });

  describe("add method", function() {
    it("all tests pending");
  });

  describe("get method", function() {
    describe("empty watchlist", function() {
      const config = {
        watch: {
          timeout: 30000,
          range: [
            { subnet: "172.19.106.0", start: "1", end: "255" },
            { subnet: "172.20.106.0", start: "1", end: "255" },
            { subnet: "172.19.107.0", start: "1", end: "255" },
            { subnet: "172.20.107.0", start: "1", end: "255" },
            { subnet: "172.19.108.0", start: "1", end: "255" },
            { subnet: "172.20.108.0", start: "1", end: "255" },
            { subnet: "172.19.109.0", start: "1", end: "255" },
            { subnet: "172.20.109.0", start: "1", end: "255" }
          ]
        }
      };
      describe("all pending addresses", function() {
        const watchList = require("../watchList.js").createWatchList(config);
        const result = watchList.get();
        it("returns all addresses in array", () => {
          expect(result).to.have.length(2040);
        });
      });
    });
  });

  // describe('update method', function() {
  //     const config = { 'watch': { 'range': [] } };
  //     describe('update existing address', function() {
  //         const store = require('../store.js').createStore(config);
  //         watchList._map.get('127.0.0.1');
  //         it('address is not added to watchlist', () => {
  //             expect(result).to.be.undefined;
  //         });
  //     });
  // });

  // describe('has method', function() {
  //     const config = { 'watch': { 'range': [] } };
  //     describe('check for existing address', function() {
  //         const model = require('../store.watchList.has('127.0.0.3');
  //         it('returns false', () => expect(result).to.be.false );
  //     });
  // });

  // describe('delete method', function() {
  //     const config = { 'watch': { 'range': [] } };
  //     describe('delete existing address', function() {
  //         const store = require('../store.js').createStore(config);
  //         watchList._map.has('127.0.0.2');
  //             expect(result).to.be.false;
  //         });
  //     });
  // });
});
