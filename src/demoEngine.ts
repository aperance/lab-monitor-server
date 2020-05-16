import deviceStore from "./deviceStore";
import {
  AccumulatedRecords,
  DeviceRecord,
  History,
  HistoryDiff,
  State,
  StateDiff,
  Status,
  WsMessageTypeKeys
} from "./types";

const deviceCount = 25;

const hardwareOptions = ["Rev A", "Rev B", "Rev C", "Rev D", "Rev E"];
const firmwareOptions = ["1.0.1", "1.0.2", "1.0.3", "1.0.4", "1.0.5"];
const modeOptions = ["Mode 1", "Mode 2", "Mode 3", "Mode 4", "Mode 5"];

const generateNumericString = () =>
  Math.floor(Math.random() * Math.pow(10, 10)).toString();
const pickFrom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const map = new Map();

export const startDemo = () => {
  console.log("Demo Engine Started");

  for (let i = 1; i <= deviceCount; i++) {
    const id = "127.0.0." + i;
    const state: State = {
      serial: generateNumericString(),
      model: pickFrom(hardwareOptions),
      firmware: pickFrom(firmwareOptions),
      Property_A: "Value_A1",
      Property_B: "Value_B1"
    };
    deviceStore.set(id, Status.Connected, state);
  }
};
