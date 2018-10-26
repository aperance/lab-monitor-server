/**
 * Configuration Types
 */
export interface Config {
  deviceStore: unknown;
  engine: unknown;
  actions: unknown;
  psTools: unknown;
  watcher: unknown;
  client: any;
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

/**
 * Device Store Types
 */
export const enum Status {
  Connected = "CONNECTED",
  Retry = "RETRY",
  Disconnected = "DISCONNECTED",
  Inactive = "INACTIVE"
}

export interface State {
  [key: string]: string;
}

export interface History {
  [key: string]: Array<[string, string | null]>;
}

export interface StateDiff {
  [key: string]: string | null;
}

export interface HistoryDiff extends Array<[string, [string, string | null]]> {}

export interface DeviceRecord {
  state: State;
  history: History;
}

export interface AccumulatedRecords {
  state: {
    [key: string]: State;
  };
  history: {
    [key: string]: History;
  };
}

/**
 * Websocket Types
 */
export const enum WsMessageTypeKeys {
  Configuration = "CONFIGURATION",
  DeviceDataAll = "DEVICE_DATA_ALL",
  DeviceDataUpdate = "DEVICE_DATA_UPDATE",
  RefreshDevice = "REFRESH_DEVICE",
  DeviceAction = "DEVICE_ACTION",
  DeviceActionResponse = "DEVICE_ACTION_RESPONSE",
  PsToolsCommand = "PSTOOLS_COMMAND",
  PsToolsCommandResponse = "PSTOOLS_COMMAND_RESPONSE",
  UserDialog = "USER_DIALOG",
  Error = "ERROR"
}

export interface WsPayload {
  [key: string]: any;
}

export interface WsMessage {
  type: WsMessageTypeKeys;
  payload: WsPayload;
}

/**
 * PsTools Types
 */
export interface PsToolsRequest {
  [x: string]: string | undefined;
}

export interface PsToolsResponse {
  err: Error | null;
  result: string | null;
}

/**
 * Action Types
 */
export interface ActionRequest {
  targets: string[];
  type: string;
  parameters?: { [key: string]: any };
}

export interface ActionResult {
  err: Error | null;
  success: boolean;
}

export interface ActionResponse {
  err: Error | null;
  results: ActionResult[] | null;
}
