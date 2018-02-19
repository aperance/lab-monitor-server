const { expect } = require("chai");

describe("deviceStore", function() {
  const config = { watch: { range: [] }, history: { maxSize: 5 } };
  const deviceStore = require("../deviceStore.js").createDeviceStore(config);
  const id = "127.0.0.1";

  describe("set and get full object", function() {
    //devices.emitter.on('update', (obj) => console.log('Fired!!!!!!!!!!'));
    deviceStore.set(id, { rawProp1: "rawValue1", rawProp2: "rawValue2" });
    deviceStore.set(id, { rawProp1: "rawValue11", rawProp2: "rawValue2" });
    const expected = {
      state: {
        timestamp: Date.now(),
        rawProp1: "rawValue11",
        rawProp2: "rawValue2"
      },
      history: {
        rawProp1: [[Date.now(), "rawValue11"], [Date.now(), "rawValue1"]],
        rawProp2: [[Date.now(), "rawValue2"]]
      }
    };
    it("set and get object are equivilant", () => {
      expect(deviceStore.get(id)).to.deep.equal(expected);
    });
  });
  // describe('input object validation', function() {
  //     it('throws on no ipAddress', function() {
  //         devices.set(id, { rawProp1: 'rawValue1', rawProp2: 'rawValue2' });
  //         expect(() => devices.set(id, inputObj)).to.throw('Missing required object properties');
  //     });
  //     it('throws on null ipAddress', function() {
  //         const inputObj = { ipAddress: null, timestamp: Date.now(), summary: {}, raw: {} };
  //         expect(() => devices.set(id, inputObj)).to.throw('Missing required object properties');
  //     });
  //     it('throws on no raw', function() {
  //         const inputObj = { ipAddress: '127.0.0.1', timestamp: Date.now(), summary: {} };
  //         expect(() => devices.set(id, inputObj)).to.throw('Missing required object properties');
  //     });
  //     it('throws on null raw', function() {
  //         const inputObj = { ipAddress: '127.0.0.1', timestamp: Date.now(), summary: {}, raw: null };
  //         expect(() => devices.set(id, inputObj)).to.throw('Missing required object properties');
  //     });
  // });

  // describe('History', function() {
  //     describe('set single record (history size 5)', function() {
  //         const config = { watch: { range: [] }, 'history': { 'maxSize': 5 } };
  //         const {devices} = require('../store.js').createModel(config);
  //         devices._setHistory('127.0.0.1', 'prop1', 'value1');
  //         it('history contains object created for ip', () => {
  //             expect(devices._history).to.have.property('127.0.0.1').that.is.an('object');
  //         });
  //         it('which contains array[1] created for property', () => {
  //             expect(devices._history['127.0.0.1']).to.have.property('prop1').that.is.an('array').with.length(1);
  //         });
  //         it('which contains object with timestamp and value keys', () => {
  //             expect(devices._history['127.0.0.1']['prop1'][0]).to.have.all.keys('timestamp', 'value');
  //         });
  //         it('timestamp has correct data', () => {
  //             expect(devices._history['127.0.0.1']['prop1'][0]['timestamp']).to.be.closeTo(Date.now(),100);
  //         });
  //         it('value has correct data', () => {
  //             expect(devices._history['127.0.0.1']['prop1'][0]['value']).to.equal('value1');
  //         });
  //     });
  //     describe('set 6 records for 2 ips with 2 properties (history size 5)', function() {
  //         const config = { watch: { range: [] }, 'history': { 'maxSize': 5 } };
  //         const {devices} = require('../store.js').createModel(config);
  //         for(let i = 1; i<=2; i++) {
  //             for(let j = 1; j<=2; j++) {
  //                 for(let k = 1; k<=6; k++) {
  //                     devices._setHistory('127.0.0.'+i, 'prop'+j, 'value'+k);
  //                 }
  //             }
  //         }
  //         for(let i = 1; i<=2; i++) {
  //             for(let j = 1; j<=2; j++) {
  //                 it('array size dosent exceed history size config', () => {
  //                     expect(devices._history['127.0.0.'+i]['prop'+j]).to.have.length(5);
  //                 });
  //                 it('value has correct data for ip '+i+', property '+j+', index '+0, () => {
  //                     expect(devices._history['127.0.0.'+i]['prop'+j][0]['value']).to.equal('value'+(6));
  //                 });
  //                 it('value has correct data for ip '+i+', property '+j+', index '+4, () => {
  //                     expect(devices._history['127.0.0.'+i]['prop'+j][4]['value']).to.equal('value'+(2));
  //                 });
  //             }
  //         }
  //     });
  // });
});
