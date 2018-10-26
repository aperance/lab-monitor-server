import * as Ajv from "ajv";
import { readFileSync } from "fs";

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

export const configuration = JSON.parse(readFileSync("./config.json", "utf8"));

export const getEngineConfig = (): EngineConfig => {
  const schema = {
    properties: {
      addressRanges: {
        type: "array"
      }
    },
    required: ["addressRanges"],
    additionalProperties: false
  };
  return validate(schema, configuration.engine);
};

export const getWatcherConfig = (): WatcherConfig => {
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
  return validate(schema, configuration.watcher);
};

export const getDeviceStoreConfig = (): DeviceStoreConfig => {
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
  return validate(schema, configuration.deviceStore);
};

export const getActionConfig = (): ActionConfig => {
  const schema = {
    properties: {},
    required: [],
    additionalProperties: true
  };
  return validate(schema, configuration.actions);
};

export const getPsToolsConfig = (): PsToolsConfig => {
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
  return validate(schema, configuration.psTools);
};

const validate = (schema: any, data: any) => {
  const ajv = new Ajv();
  const isValid = ajv.validate(schema, data);
  if (isValid) return data;
  else throw new Error(ajv.errorsText());
};
