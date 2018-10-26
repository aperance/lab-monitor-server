import { readFileSync } from "fs";
import {
  isActionConfig,
  isClientConfig,
  isConfig,
  isDeviceStoreConfig,
  isEngineConfig,
  isPsToolsConfig,
  isWatcherConfig
} from "./typeGuards";

export const configuration: object = JSON.parse(
  readFileSync("./config.json", "utf8")
);

const config = isConfig(configuration) ? configuration : null;

export const getEngineConfig = () => {
  if (!config || !isEngineConfig(config.engine))
    throw Error("Invalid Engine Configuration");
  return config.engine;
};

export const getWatcherConfig = () => {
  if (!config || !isWatcherConfig(config.watcher))
    throw Error("Invalid Watcher Configuration");
  return config.watcher;
};

export const getDeviceStoreConfig = () => {
  if (!config || !isDeviceStoreConfig(config.deviceStore))
    throw Error("Invalid Device Store Configuration");
  return config.deviceStore;
};

export const getActionConfig = () => {
  if (!config || !isActionConfig(config.actions))
    throw Error("Invalid Action Configuration");
  return config.actions;
};

export const getPsToolsConfig = () => {
  if (!config || !isPsToolsConfig(config.psTools))
    throw Error("Invalid PsTools Configuration");
  return config.psTools;
};

export const getClientConfig = () => {
  if (!config || !isClientConfig(config.client))
    throw Error("Invalid Client Configuration");
  return config.client;
};
