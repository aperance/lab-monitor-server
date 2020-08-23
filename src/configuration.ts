import {readFileSync} from "fs";
import {
  isActionConfig,
  isConfig,
  isDeviceStoreConfig,
  isEngineConfig,
  isPsToolsConfig,
  isWatcherConfig
} from "./typeGuards";
import {
  ActionConfig,
  DeviceStoreConfig,
  EngineConfig,
  PsToolsConfig,
  WatcherConfig
} from "./types";

const demoConfig = {
  engine: {
    addressRanges: []
  },
  deviceStore: {
    maxHistory: 10,
    dateFormat: {}
  },
  watcher: {
    port: 80,
    path: "",
    sequenceKey: "",
    maxRetries: 3
  },
  actions: {},
  psTools: {
    user: "",
    password: ""
  }
};

const fileOutput: unknown =
  process.env.DEMO === "true"
    ? demoConfig
    : JSON.parse(readFileSync("./config.json", "utf8"));

const config = isConfig(fileOutput) ? fileOutput : null;

export const getEngineConfig = (): EngineConfig => {
  if (!config || !isEngineConfig(config.engine))
    throw Error("Invalid Engine Configuration");
  return config.engine;
};

export const getWatcherConfig = (): WatcherConfig => {
  if (!config || !isWatcherConfig(config.watcher))
    throw Error("Invalid Watcher Configuration");
  return config.watcher;
};

export const getDeviceStoreConfig = (): DeviceStoreConfig => {
  if (!config || !isDeviceStoreConfig(config.deviceStore))
    throw Error("Invalid Device Store Configuration");
  return config.deviceStore;
};

export const getActionConfig = (): ActionConfig => {
  if (!config || !isActionConfig(config.actions))
    throw Error("Invalid Action Configuration");
  return config.actions;
};

export const getPsToolsConfig = (): PsToolsConfig => {
  if (!config || !isPsToolsConfig(config.psTools))
    throw Error("Invalid PsTools Configuration");
  return config.psTools;
};
