import deviceStore from "./deviceStore";
import {State, Status} from "./types";

const deviceCount = 50;

const hardwareOptions = ["Rev A", "Rev B", "Rev C", "Rev D", "Rev E"];
const firmwareOptions = ["v1.0.5", "v2.0.4", "v3.0.3", "v4.0.2", "v5.0.1"];
const randomProperties = [
  "propertyA",
  "propertyB",
  "propertyC",
  "propertyD",
  "propertyE",
  "propertyF",
  "propertyG"
];

const generateNumericString = () =>
  Math.random().toString().substr(2, 10).padStart(10, "0").toUpperCase();

const generateAlphaNumericString = () =>
  Math.random().toString(36).substr(2, 10).padStart(10, "0").toUpperCase();

const pickFrom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const startDemo = () => {
  console.log("Demo Engine Started");

  for (let i = 1; i <= deviceCount; i++) {
    const ipAddress = "127.0.0." + i;
    const state: State = {
      ipAddress,
      serial: generateNumericString(),
      hardware: pickFrom(hardwareOptions),
      firmware: pickFrom(firmwareOptions)
    };
    randomProperties.forEach(
      prop => (state[prop] = generateAlphaNumericString())
    );
    deviceStore.set(ipAddress, Status.Connected, state);
  }
};

const updateDevice = () => {
  const ipAddress = "127.0.0." + Math.ceil(Math.random() * deviceCount);
  const state = {...deviceStore.getAccumulatedRecords().state[ipAddress]};

  randomProperties.forEach(
    prop => (state[prop] = generateAlphaNumericString())
  );

  deviceStore.set(ipAddress, Status.Connected, state);
};

setInterval(updateDevice, 200);
