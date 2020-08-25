import deviceStore from "./deviceStore";
import { State, Status } from "./types";

const demoConfig = {
  engine: {
    addressRanges: [],
  },
  deviceStore: {
    maxHistory: 10,
    dateFormat: {},
  },
  watcher: {
    port: 80,
    path: "",
    sequenceKey: "",
    maxRetries: 3,
  },
  actions: {},
  psTools: {
    user: "",
    password: "",
  },
};

const deviceCount = 50;

const hardwareOptions = ["Rev A", "Rev B", "Rev C", "Rev D", "Rev E"];
const firmwareOptions = ["v1.0.5", "v2.0.4", "v3.0.3", "v4.0.2", "v5.0.1"];
const randomProperties = [...Array(26)].map(
  (_, i) => "property" + String.fromCharCode(65 + i)
);

const generateNumericString = () =>
  Math.random().toString().substr(2, 10).padStart(10, "0").toUpperCase();

const pickFrom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const startDemo = (): void => {
  console.log(
    `Starting in demo mode, role: ${process.env.DEMO_ROLE || "full"}`
  );

  for (let i = 1; i <= deviceCount; i++) {
    const ipAddress = "127.0.0." + i;
    const state: State = {
      ipAddress,
      serial: generateNumericString(),
      hardware: pickFrom(hardwareOptions),
      firmware: pickFrom(firmwareOptions),
    };
    randomProperties.forEach((prop) => (state[prop] = generateNumericString()));
    deviceStore.set(ipAddress, Status.Connected, state);
  }

  setInterval(updateDevice, 200);
};

const updateDevice = () => {
  const ipAddress = "127.0.0." + Math.ceil(Math.random() * deviceCount);
  const state = { ...deviceStore.getAccumulatedRecords().state[ipAddress] };
  randomProperties.forEach((prop) => (state[prop] = generateNumericString()));
  deviceStore.set(ipAddress, Status.Connected, state);
};

export { demoConfig, startDemo };
