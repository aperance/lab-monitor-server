import * as Ajv from "ajv";
import {
  ActionConfig,
  Config,
  DeviceStoreConfig,
  EngineConfig,
  PsToolsConfig,
  WatcherConfig
} from "./types";

const ajv = new Ajv();

export const isConfig = (data: unknown): data is Config => {
  return true;
};

export const isActionConfig = (data: unknown): data is ActionConfig => {
  const schema = {
    properties: {},
    required: [],
    additionalProperties: true
  };
  return ajv.validate(schema, data) ? true : false;
};

export const isDeviceStoreConfig = (
  data: unknown
): data is DeviceStoreConfig => {
  const schema = {
    properties: {
      maxHistory: {
        type: "number"
      },
      dateFormat: {
        type: "object"
      }
    },
    required: ["maxHistory", "dateFormat"],
    additionalProperties: false
  };
  return ajv.validate(schema, data) ? true : false;
};

export const isEngineConfig = (data: unknown): data is EngineConfig => {
  const schema = {
    properties: {
      addressRanges: {
        type: "array"
      }
    },
    required: ["addressRanges"],
    additionalProperties: false
  };
  return ajv.validate(schema, data) ? true : false;
};

export const isPsToolsConfig = (data: unknown): data is PsToolsConfig => {
  const schema = {
    properties: {
      user: {
        type: "string"
      },
      password: {
        type: "string"
      }
    },
    required: ["user", "password"],
    additionalProperties: false
  };
  return ajv.validate(schema, data) ? true : false;
};

export const isWatcherConfig = (data: unknown): data is WatcherConfig => {
  const schema = {
    properties: {
      port: { type: "number" },
      path: { type: "string" },
      sequenceKey: { type: "string" },
      maxRetries: { type: "number" }
    },
    required: ["port", "path", "sequenceKey", "maxRetries"],
    additionalProperties: false
  };
  return ajv.validate(schema, data) ? true : false;
};

export const isClientConfig = (data: unknown): data is any => {
  return true;
};
