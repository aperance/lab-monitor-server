import { readFileSync } from "fs";
import Ajv from "ajv";

/**
 * Configuration Types
 */
export interface Config {
  deviceStore: unknown;
  engine: unknown;
  actions: unknown;
  psTools: unknown;
  watcher: unknown;
}

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

const ajv = new Ajv();

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

const config: Config =
  process.env.DEMO === "true"
    ? demoConfig
    : JSON.parse(readFileSync("./config.json", "utf8"));

export const getEngineConfig = (): EngineConfig => {
  const schema = {
    type: "object",
    properties: {
      addressRanges: {
        type: "array",
      },
    },
    required: ["addressRanges"],
    additionalProperties: false,
  };

  if (!ajv.validate(schema, config.engine)) throw Error(ajv.errorsText());

  return config.engine as EngineConfig;
};

export const getWatcherConfig = (): WatcherConfig => {
  const schema = {
    properties: {
      port: { type: "number" },
      path: { type: "string" },
      sequenceKey: { type: "string" },
      maxRetries: { type: "number" },
    },
    required: ["port", "path", "sequenceKey", "maxRetries"],
    additionalProperties: false,
  };

  if (!ajv.validate(schema, config.watcher)) throw Error(ajv.errorsText());

  return config.watcher as WatcherConfig;
};

export const getDeviceStoreConfig = (): DeviceStoreConfig => {
  const schema = {
    properties: {
      maxHistory: {
        type: "number",
      },
      dateFormat: {
        type: "object",
      },
    },
    required: ["maxHistory", "dateFormat"],
    additionalProperties: false,
  };

  if (!ajv.validate(schema, config.deviceStore)) throw Error(ajv.errorsText());

  return config.deviceStore as DeviceStoreConfig;
};

export const getActionConfig = (): ActionConfig => {
  const schema = {
    properties: {},
    required: [],
    additionalProperties: true,
  };

  if (!ajv.validate(schema, config.actions)) throw Error(ajv.errorsText());

  return config.actions as ActionConfig;
};

export const getPsToolsConfig = (): PsToolsConfig => {
  const schema = {
    properties: {
      user: {
        type: "string",
      },
      password: {
        type: "string",
      },
    },
    required: ["user", "password"],
    additionalProperties: false,
  };

  if (!ajv.validate(schema, config.psTools)) throw Error(ajv.errorsText());

  return config.psTools as PsToolsConfig;
};
