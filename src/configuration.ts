import fs from "fs";
import yup from "yup";

const { object, string, array, number } = yup;

/**
 * Schema for server configuration with default values.
 */
const schema = object({
  addressRanges: array()
    .of(
      object({
        subnet: string().required(),
        start: number().required(),
        end: number().required()
      }).defined()
    )
    .default([])
    .required(),
  watcher: object({
    port: number().default(80).required(),
    path: string().default("").required(),
    sequenceKey: string().default("").required(),
    maxRetries: number().default(3).required()
  }).required(),
  deviceStore: object({
    maxHistory: number().default(10).required(),
    dateFormat: object().default({}).required()
  }).required(),
  psTools: object({
    user: string().default("").required(),
    password: string().default("").required()
  }).required(),
  actions: object({})
}).required();

/**
 * Import configuration from config.json (if exists) and validate against schema.
 */
const config = (() => {
  let data;
  try {
    data = JSON.parse(fs.readFileSync("./config.json", "utf8"));
  } catch (e) {
    data = {};
  }
  return schema.cast(data);
})();

console.log(config);

export default config;
