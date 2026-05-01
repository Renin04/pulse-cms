import { runMiddlewareChain } from "./middleware";
import type {
  EventListener,
  EventListenerOptions,
  EventMiddleware,
  EventPayloadMap,
  PulseEvent,
} from "../types/event";

type EventKey<TEvents extends EventPayloadMap> = keyof TEvents & string;

interface ListenerEntry {
  listener: EventListener<unknown>;
  priority: number;
  once: boolean;
  order: number;
}

export class EventBus<TEvents extends EventPayloadMap = EventPayloadMap> {
  private readonly listeners = new Map<string, ListenerEntry[]>();
  private readonly middlewares: EventMiddleware<TEvents>[] = [];
  private listenerOrder = 0;

  on<TType extends EventKey<TEvents>>(
    type: TType,
    listener: EventListener<TEvents[TType]>,
    options: EventListenerOptions = {},
  ): () => void {
    const entry: ListenerEntry = {
      listener: listener as EventListener<unknown>,
      priority: options.priority ?? 0,
      once: options.once ?? false,
      order: this.listenerOrder++,
    };

    const entries = this.listeners.get(type) ?? [];
    entries.push(entry);
    this.listeners.set(type, this.sortEntries(entries));

    return () => {
      this.off(type, listener);
    };
  }

  once<TType extends EventKey<TEvents>>(
    type: TType,
    listener: EventListener<TEvents[TType]>,
    options: Omit<EventListenerOptions, "once"> = {},
  ): () => void {
    return this.on(type, listener, { ...options, once: true });
  }

  off<TType extends EventKey<TEvents>>(
    type: TType,
    listener: EventListener<TEvents[TType]>,
  ): boolean {
    const entries = this.listeners.get(type);
    if (!entries || entries.length === 0) {
      return false;
    }

    const nextEntries = entries.filter(
      (entry) => entry.listener !== (listener as EventListener<unknown>),
    );

    if (nextEntries.length === entries.length) {
      return false;
    }

    if (nextEntries.length === 0) {
      this.listeners.delete(type);
    } else {
      this.listeners.set(type, nextEntries);
    }

    return true;
  }

  use(middleware: EventMiddleware<TEvents>): () => void {
    this.middlewares.push(middleware);

    return () => {
      const index = this.middlewares.indexOf(middleware);
      if (index >= 0) {
        this.middlewares.splice(index, 1);
      }
    };
  }

  listenerCount(type?: EventKey<TEvents>): number {
    if (type) {
      return this.listeners.get(type)?.length ?? 0;
    }

    return Array.from(this.listeners.values()).reduce(
      (count, entries) => count + entries.length,
      0,
    );
  }

  clear(type?: EventKey<TEvents>): void {
    if (type) {
      this.listeners.delete(type);
      return;
    }

    this.listeners.clear();
  }

  destroy(): void {
    this.clear();
    this.middlewares.length = 0;
  }

  async emit<TType extends EventKey<TEvents>>(
    type: TType,
    payload: TEvents[TType],
  ): Promise<PulseEvent<TType, TEvents[TType]>> {
    const event = this.createEvent(type, payload);

    await runMiddlewareChain(this.middlewares, event, async () => {
      await this.dispatchToListeners(type, event);
    });

    return event;
  }

  private async dispatchToListeners<TType extends EventKey<TEvents>>(
    type: TType,
    event: PulseEvent<TType, TEvents[TType]>,
  ): Promise<void> {
    const entries = this.listeners.get(type);
    if (!entries || entries.length === 0) {
      return;
    }

    for (const entry of [...entries]) {
      await (entry.listener as EventListener<TEvents[TType]>)(event);

      if (entry.once) {
        this.removeEntry(type, entry);
      }

      if (event.defaultPrevented) {
        break;
      }
    }
  }

  private removeEntry<TType extends EventKey<TEvents>>(
    type: TType,
    target: ListenerEntry,
  ): void {
    const entries = this.listeners.get(type);
    if (!entries) {
      return;
    }

    const nextEntries = entries.filter((entry) => entry !== target);
    if (nextEntries.length === 0) {
      this.listeners.delete(type);
      return;
    }

    this.listeners.set(type, nextEntries);
  }

  private createEvent<TType extends EventKey<TEvents>>(
    type: TType,
    payload: TEvents[TType],
  ): PulseEvent<TType, TEvents[TType]> {
    const event: PulseEvent<TType, TEvents[TType]> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      defaultPrevented: false,
      preventDefault() {
        event.defaultPrevented = true;
      },
    };

    return event;
  }

  private sortEntries(entries: ListenerEntry[]): ListenerEntry[] {
    return [...entries].sort((left, right) => {
      if (left.priority !== right.priority) {
        return right.priority - left.priority;
      }

      return left.order - right.order;
    });
  }
}
