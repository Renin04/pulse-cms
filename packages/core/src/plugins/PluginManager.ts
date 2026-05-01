import { EventBus } from "../events/EventBus";
import { validatePluginDefinition } from "../schemas/pluginSchema";
import type { CoreEventPayloadMap } from "../types/event";
import type {
  InstalledPlugin,
  Plugin,
  PluginConfig,
  PluginError,
  PluginLifecyclePhase,
  PluginStatus,
} from "../types/plugin";
import { PluginAPI } from "./PluginAPI";

interface PluginRecord<TConfig extends PluginConfig = PluginConfig> {
  plugin: Plugin<TConfig>;
  api: PluginAPI<TConfig>;
  config: TConfig;
  status: PluginStatus;
  installedAt: string;
  enabledAt?: string;
}

export interface PluginManagerOptions {
  eventBus?: EventBus<CoreEventPayloadMap>;
  onError?: (error: PluginError) => void;
}

export interface PluginInstallOptions<TConfig extends PluginConfig = PluginConfig> {
  config?: Partial<TConfig>;
  enabled?: boolean;
}

export class PluginManager {
  private readonly eventBus: EventBus<CoreEventPayloadMap>;
  private readonly onError?: (error: PluginError) => void;

  private readonly records = new Map<string, PluginRecord>();
  private readonly pluginErrors: PluginError[] = [];

  constructor(options: PluginManagerOptions = {}) {
    this.eventBus = options.eventBus ?? new EventBus<CoreEventPayloadMap>();
    this.onError = options.onError;
  }

  getEventBus(): EventBus<CoreEventPayloadMap> {
    return this.eventBus;
  }

  async install<TConfig extends PluginConfig>(
    plugin: Plugin<TConfig>,
    options: PluginInstallOptions<TConfig> = {},
  ): Promise<InstalledPlugin<TConfig>> {
    validatePluginDefinition(plugin);

    if (this.records.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already installed`);
    }

    let config = this.resolveConfig(plugin, options.config);
    const installedAt = new Date().toISOString();

    const api = new PluginAPI<TConfig>({
      pluginName: plugin.name,
      eventBus: this.eventBus,
      getConfig: () => config,
      setConfig: (nextConfig) => {
        const parsedConfig = this.parseConfig(plugin, nextConfig);
        config = parsedConfig;

        const record = this.records.get(plugin.name) as
          | PluginRecord<TConfig>
          | undefined;
        if (record) {
          record.config = parsedConfig;
        }
      },
      onError: (phase, error) => {
        this.captureError(plugin.name, phase, error);
      },
    });

    const record: PluginRecord<TConfig> = {
      plugin,
      api,
      config,
      status: "installed",
      installedAt,
    };

    this.records.set(plugin.name, record as unknown as PluginRecord);
    await this.runLifecycle(record, "install");

    if (options.enabled) {
      await this.enable(plugin.name);
    }

    return this.toInstalledPluginRecord(plugin.name) as InstalledPlugin<TConfig>;
  }

  async enable(name: string): Promise<boolean> {
    const dependencyOrder = this.resolveDependencyOrder(name);

    for (const pluginName of dependencyOrder) {
      const record = this.requireRecord(pluginName);
      if (record.status === "enabled") {
        continue;
      }

      const wasEnabled = await this.runLifecycle(record, "enable");
      if (!wasEnabled) {
        return false;
      }

      record.status = "enabled";
      record.enabledAt = new Date().toISOString();
    }

    return this.isEnabled(name);
  }

  async disable(name: string): Promise<boolean> {
    const record = this.requireRecord(name);
    if (record.status !== "enabled") {
      return false;
    }

    await this.runLifecycle(record, "disable");
    record.api.dispose();
    record.status = "disabled";
    record.enabledAt = undefined;

    return true;
  }

  async uninstall(name: string): Promise<boolean> {
    const dependents = this.listDependents(name);
    if (dependents.length > 0) {
      throw new Error(
        `Cannot uninstall plugin "${name}" because it is required by: ${dependents.join(
          ", ",
        )}`,
      );
    }

    const record = this.records.get(name);
    if (!record) {
      return false;
    }

    if (record.status === "enabled") {
      await this.disable(name);
    }

    await this.runLifecycle(record, "uninstall");
    record.api.dispose();

    return this.records.delete(name);
  }

  has(name: string): boolean {
    return this.records.has(name);
  }

  isEnabled(name: string): boolean {
    return this.records.get(name)?.status === "enabled";
  }

  getPlugin<TConfig extends PluginConfig = PluginConfig>(
    name: string,
  ): InstalledPlugin<TConfig> | undefined {
    const record = this.records.get(name);
    if (!record) {
      return undefined;
    }

    return this.toInstalledPluginRecord(name) as InstalledPlugin<TConfig>;
  }

  getPlugins(): InstalledPlugin[] {
    return Array.from(this.records.keys())
      .sort((left, right) => left.localeCompare(right))
      .map((name) => this.toInstalledPluginRecord(name));
  }

  getEnabledPlugins(): InstalledPlugin[] {
    return this.getPlugins().filter((plugin) => plugin.status === "enabled");
  }

  getPluginErrors(pluginName?: string): PluginError[] {
    if (!pluginName) {
      return [...this.pluginErrors];
    }

    return this.pluginErrors.filter((error) => error.pluginName === pluginName);
  }

  clearErrors(pluginName?: string): void {
    if (!pluginName) {
      this.pluginErrors.length = 0;
      return;
    }

    for (let index = this.pluginErrors.length - 1; index >= 0; index -= 1) {
      if (this.pluginErrors[index]?.pluginName === pluginName) {
        this.pluginErrors.splice(index, 1);
      }
    }
  }

  async emit<TType extends keyof CoreEventPayloadMap & string>(
    type: TType,
    payload: CoreEventPayloadMap[TType],
  ): Promise<void> {
    await this.eventBus.emit(type, payload);
  }

  private resolveConfig<TConfig extends PluginConfig>(
    plugin: Plugin<TConfig>,
    overrideConfig?: Partial<TConfig>,
  ): TConfig {
    const defaultConfig = this.resolveDefaultConfig(plugin);
    const mergedConfig = {
      ...defaultConfig,
      ...(overrideConfig ?? {}),
    } as TConfig;

    return this.parseConfig(plugin, mergedConfig);
  }

  private resolveDefaultConfig<TConfig extends PluginConfig>(
    plugin: Plugin<TConfig>,
  ): Partial<TConfig> {
    if (!plugin.defaultConfig) {
      return {};
    }

    const config =
      typeof plugin.defaultConfig === "function"
        ? plugin.defaultConfig()
        : this.cloneData(plugin.defaultConfig);

    return config;
  }

  private parseConfig<TConfig extends PluginConfig>(
    plugin: Plugin<TConfig>,
    config: TConfig,
  ): TConfig {
    if (plugin.configSchema) {
      return plugin.configSchema.parse(config);
    }

    if (!this.isPlainObject(config)) {
      throw new Error(
        `Plugin "${plugin.name}" configuration must be a plain object when no configSchema is provided`,
      );
    }

    return config;
  }

  private resolveDependencyOrder(name: string): string[] {
    const order: string[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (pluginName: string, lineage: string[]): void => {
      if (visited.has(pluginName)) {
        return;
      }

      if (visiting.has(pluginName)) {
        throw new Error(
          `Circular plugin dependency detected: ${[...lineage, pluginName].join(
            " -> ",
          )}`,
        );
      }

      const record = this.records.get(pluginName);
      if (!record) {
        const source = lineage[lineage.length - 1];
        if (source) {
          throw new Error(
            `Plugin "${source}" depends on missing plugin "${pluginName}"`,
          );
        }

        throw new Error(`Plugin "${pluginName}" is not installed`);
      }

      visiting.add(pluginName);

      for (const dependencyName of record.plugin.dependencies ?? []) {
        visit(dependencyName, [...lineage, pluginName]);
      }

      visiting.delete(pluginName);
      visited.add(pluginName);
      order.push(pluginName);
    };

    visit(name, []);

    return order;
  }

  private listDependents(name: string): string[] {
    const dependents: string[] = [];

    for (const [pluginName, record] of this.records.entries()) {
      if (record.plugin.dependencies?.includes(name)) {
        dependents.push(pluginName);
      }
    }

    return dependents;
  }

  private requireRecord(name: string): PluginRecord {
    const record = this.records.get(name);
    if (!record) {
      throw new Error(`Plugin "${name}" is not installed`);
    }

    return record;
  }

  private async runLifecycle<TConfig extends PluginConfig>(
    record: PluginRecord<TConfig>,
    phase: "install" | "enable" | "disable" | "uninstall",
  ): Promise<boolean> {
    const hook = this.getLifecycleHook(record.plugin, phase);
    if (!hook) {
      return true;
    }

    try {
      await hook(record.api);
      return true;
    } catch (error) {
      this.captureError(record.plugin.name, phase, error);
      return false;
    }
  }

  private getLifecycleHook<TConfig extends PluginConfig>(
    plugin: Plugin<TConfig>,
    phase: "install" | "enable" | "disable" | "uninstall",
  ): ((api: PluginAPI<TConfig>) => void | Promise<void>) | undefined {
    if (phase === "install") {
      return plugin.onInstall;
    }

    if (phase === "enable") {
      return plugin.onEnable;
    }

    if (phase === "disable") {
      return plugin.onDisable;
    }

    return plugin.onUninstall;
  }

  private captureError(
    pluginName: string,
    phase: PluginLifecyclePhase,
    cause: unknown,
  ): void {
    const error = this.normalizeError(cause);

    const pluginError: PluginError = {
      pluginName,
      phase,
      timestamp: new Date().toISOString(),
      message: error.message,
      cause,
    };

    this.pluginErrors.push(pluginError);
    this.onError?.(pluginError);
  }

  private normalizeError(cause: unknown): Error {
    if (cause instanceof Error) {
      return cause;
    }

    return new Error(String(cause));
  }

  private toInstalledPluginRecord(name: string): InstalledPlugin {
    const record = this.requireRecord(name);

    return {
      name: record.plugin.name,
      version: record.plugin.version,
      dependencies: [...(record.plugin.dependencies ?? [])],
      status: record.status,
      config: this.cloneData(record.config),
      installedAt: record.installedAt,
      enabledAt: record.enabledAt,
    };
  }

  private cloneData<TData>(data: TData): TData {
    if (typeof structuredClone === "function") {
      return structuredClone(data);
    }

    return JSON.parse(JSON.stringify(data)) as TData;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === "object" &&
      value !== null &&
      Object.getPrototypeOf(value) === Object.prototype
    );
  }
}
