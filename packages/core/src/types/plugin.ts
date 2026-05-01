import type { ZodType } from "zod";

import type { PluginAPI } from "../plugins/PluginAPI";

export type PluginConfig = object;

export type PluginLifecyclePhase =
  | "install"
  | "enable"
  | "disable"
  | "uninstall"
  | `listener:${string}`
  | `emit:${string}`;

export interface PluginMetadata {
  name: string;
  version: string;
  author?: string;
  description?: string;
}

export interface Plugin<TConfig extends PluginConfig = PluginConfig>
  extends PluginMetadata {
  dependencies?: string[];
  configSchema?: ZodType<TConfig>;
  defaultConfig?: Partial<TConfig> | (() => Partial<TConfig>);

  onInstall?(api: PluginAPI<TConfig>): void | Promise<void>;
  onEnable?(api: PluginAPI<TConfig>): void | Promise<void>;
  onDisable?(api: PluginAPI<TConfig>): void | Promise<void>;
  onUninstall?(api: PluginAPI<TConfig>): void | Promise<void>;
}

export type PluginStatus = "installed" | "enabled" | "disabled";

export interface PluginError {
  pluginName: string;
  phase: PluginLifecyclePhase;
  timestamp: string;
  message: string;
  cause: unknown;
}

export interface InstalledPlugin<TConfig extends PluginConfig = PluginConfig> {
  name: string;
  version: string;
  dependencies: string[];
  status: PluginStatus;
  config: TConfig;
  installedAt: string;
  enabledAt?: string;
}
