import { readFileSync } from "fs";
import { Validator } from "jsonschema";

const configuration = JSON.parse(readFileSync("./config.json", "utf8"));

export default configuration;
