import fs from "fs";
import Ajv from "ajv";

export interface DeviceStoreConfig {
  maxHistory: number;
  dateFormat: { [key: string]: string };
}

export interface ActionConfig {
  [type: string]: {
    path: string;
    parameters: string[];
  };
}

export interface EngineConfig {
  addressRanges: Array<{
    subnet: string;
    start: number;
    end: number;
  }>;
}

export interface PsToolsConfig {
  user: string;
  password: string;
}

export interface WatcherConfig {
  port: number;
  path: string;
  sequenceKey: string;
}

const ajv = new Ajv({ useDefaults: true });

/**
 *
 */
const config = (() => {
  try {
    return JSON.parse(fs.readFileSync("./config.json", "utf8"));
  } catch (e) {
    return {};
  }
})();

/**
 *
 */
export const getEngineConfig = (): EngineConfig => {
  const engineConfig: unknown = config.engine || {};
  const schema = {
    type: "object",
    properties: {
      addressRanges: { type: "array", default: [] },
    },
    required: ["addressRanges"],
    additionalProperties: false,
  };

  if (!ajv.validate(schema, engineConfig)) throw Error(ajv.errorsText());

  return engineConfig as EngineConfig;
};

/**
 *
 */
export const getWatcherConfig = (): WatcherConfig => {
  const watcherConfig: unknown = config.watcher || {};
  const schema = {
    properties: {
      port: { type: "number", default: 80 },
      path: { type: "string", default: "" },
      sequenceKey: { type: "string", default: "" },
      maxRetries: { type: "number", default: 3 },
    },
    required: ["port", "path", "sequenceKey", "maxRetries"],
    additionalProperties: false,
  };

  if (!ajv.validate(schema, watcherConfig)) throw Error(ajv.errorsText());

  return watcherConfig as WatcherConfig;
};

/**
 *
 */
export const getDeviceStoreConfig = (): DeviceStoreConfig => {
  const deviceStoreConfig: unknown = config.deviceStore || {};
  const schema = {
    properties: {
      maxHistory: { type: "number", default: 10 },
      dateFormat: { type: "object", default: {} },
    },
    required: ["maxHistory", "dateFormat"],
    additionalProperties: false,
  };

  if (!ajv.validate(schema, deviceStoreConfig)) throw Error(ajv.errorsText());

  return deviceStoreConfig as DeviceStoreConfig;
};

/**
 *
 */
export const getActionConfig = (): ActionConfig => {
  const actionConfig: unknown = config.actions || {};
  const schema = {
    properties: {},
    required: [],
    additionalProperties: true,
  };

  if (!ajv.validate(schema, actionConfig)) throw Error(ajv.errorsText());

  return actionConfig as ActionConfig;
};

/**
 *
 */
export const getPsToolsConfig = (): PsToolsConfig => {
  const psToolsConfig = config.psTools || {};
  const schema = {
    properties: {
      user: { type: "string", default: "" },
      password: { type: "string", default: "" },
    },
    required: ["user", "password"],
    additionalProperties: false,
  };

  if (!ajv.validate(schema, psToolsConfig)) throw Error(ajv.errorsText());

  return psToolsConfig as PsToolsConfig;
};
