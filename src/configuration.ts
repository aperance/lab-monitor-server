import fs from "fs";
import Ajv from "ajv";

const ajv = new Ajv({ useDefaults: true });

const schema = {
  type: "object",
  properties: {
    engine: {
      properties: {
        addressRanges: { type: "array", default: [] },
      },
      additionalProperties: false,
      default: {},
    },
    watcher: {
      properties: {
        port: { type: "number", default: 80 },
        path: { type: "string", default: "" },
        sequenceKey: { type: "string", default: "" },
        maxRetries: { type: "number", default: 3 },
      },
      additionalProperties: false,
      default: {},
    },
    deviceStore: {
      properties: {
        maxHistory: { type: "number", default: 10 },
        dateFormat: { type: "object", default: {} },
      },
      additionalProperties: false,
      default: {},
    },
    psTools: {
      properties: {
        user: { type: "string", default: "" },
        password: { type: "string", default: "" },
      },
      additionalProperties: false,
      default: {},
    },
    actions: {
      properties: {},
      additionalProperties: true,
      default: {},
    },
  },
  additionalProperties: false,
};

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

if (!ajv.validate(schema, config)) throw Error(ajv.errorsText());

console.log(config);

export const engine = config.engine as {
  addressRanges: {
    subnet: string;
    start: number;
    end: number;
  }[];
};

export const watcher = config.watcher as {
  port: number;
  path: string;
  sequenceKey: string;
};

export const deviceStore = config.deviceStore as {
  maxHistory: number;
  dateFormat: { [key: string]: string };
};

export const actions = config.actions as {
  [type: string]: {
    path: string;
    parameters: string[];
  };
};

export const psTools = config.psTools as {
  user: string;
  password: string;
};
