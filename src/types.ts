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
  CONFIGURATION = "CONFIGURATION",
  DEVICE_DATA_ALL = "DEVICE_DATA_ALL",
  DEVICE_DATA_UPDATE = "DEVICE_DATA_UPDATE",
  REFRESH_DEVICE = "REFRESH_DEVICE",
  CLEAR_DEVICE = "CLEAR_DEVICE",
  DEVICE_ACTION = "DEVICE_ACTION",
  DEVICE_ACTION_RESPONSE = "DEVICE_ACTION_RESPONSE",
  PSTOOLS_COMMAND = "PSTOOLS_COMMAND",
  PSTOOLS_COMMAND_RESPONSE = "PSTOOLS_COMMAND_RESPONSE",
  USER_DIALOG = "USER_DIALOG",
  ERROR = "ERROR"
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
