import { EventBus } from "../events/EventBus";
import type {
  CoreEventPayloadMap,
  EventListenerOptions,
  PulseEvent,
} from "../types/event";
import type {
  PluginConfig,
  PluginLifecyclePhase,
} from "../types/plugin";

type CoreEventType = keyof CoreEventPayloadMap & string;

export type PluginEventCallback<TType extends CoreEventType> = (
  payload: CoreEventPayloadMap[TType],
  event: PulseEvent<TType, CoreEventPayloadMap[TType]>,
) => void | Promise<void>;

interface PluginApiOptions<TConfig extends PluginConfig> {
  pluginName: string;
  eventBus: EventBus<CoreEventPayloadMap>;
  getConfig: () => TConfig;
  setConfig: (nextConfig: TConfig) => void;
  onError?: (phase: PluginLifecyclePhase, error: unknown) => void;
}

export class PluginAPI<TConfig extends PluginConfig = PluginConfig> {
  private readonly pluginName: string;
  private readonly eventBus: EventBus<CoreEventPayloadMap>;
  private readonly getConfigValue: () => TConfig;
  private readonly setConfigValue: (nextConfig: TConfig) => void;
  private readonly reportError?: (
    phase: PluginLifecyclePhase,
    error: unknown,
  ) => void;
  private readonly subscriptions = new Set<() => void>();

  constructor(options: PluginApiOptions<TConfig>) {
    this.pluginName = options.pluginName;
    this.eventBus = options.eventBus;
    this.getConfigValue = options.getConfig;
    this.setConfigValue = options.setConfig;
    this.reportError = options.onError;
  }

  getName(): string {
    return this.pluginName;
  }

  getConfig(): TConfig {
    return this.getConfigValue();
  }

  setConfig(nextConfig: TConfig): TConfig {
    this.setConfigValue(nextConfig);
    return this.getConfigValue();
  }

  patchConfig(patch: Partial<TConfig>): TConfig {
    const nextConfig = {
      ...this.getConfigValue(),
      ...patch,
    } as TConfig;

    return this.setConfig(nextConfig);
  }

  on<TType extends CoreEventType>(
    type: TType,
    callback: PluginEventCallback<TType>,
    options: EventListenerOptions = {},
  ): () => void {
    const unsubscribe = this.eventBus.on(
      type,
      async (event) => {
        try {
          await callback(event.payload, event as PulseEvent<TType, CoreEventPayloadMap[TType]>);
        } catch (error) {
          this.reportError?.(`listener:${type}`, error);
        }
      },
      options,
    );

    this.subscriptions.add(unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(unsubscribe);
    };
  }

  onBlockCreate(callback: PluginEventCallback<"block:created">): () => void {
    return this.on("block:created", callback);
  }

  onBlockUpdate(callback: PluginEventCallback<"block:updated">): () => void {
    return this.on("block:updated", callback);
  }

  onBlockDelete(callback: PluginEventCallback<"block:deleted">): () => void {
    return this.on("block:deleted", callback);
  }

  onSelectionChange(
    callback: PluginEventCallback<"selection:changed">,
  ): () => void {
    return this.on("selection:changed", callback);
  }

  onContentChange(callback: PluginEventCallback<"content:changed">): () => void {
    return this.on("content:changed", callback);
  }

  async emit<TType extends CoreEventType>(
    type: TType,
    payload: CoreEventPayloadMap[TType],
  ): Promise<void> {
    try {
      await this.eventBus.emit(type, payload);
    } catch (error) {
      this.reportError?.(`emit:${type}`, error);
    }
  }

  dispose(): void {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }

    this.subscriptions.clear();
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}
