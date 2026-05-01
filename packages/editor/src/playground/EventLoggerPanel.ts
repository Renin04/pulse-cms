import { CORE_EVENTS } from "../../../core/src/events/coreEvents";
import { EventBus } from "../../../core/src/events/EventBus";
import type { CoreEventPayloadMap } from "../../../core/src/types/event";
import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorStateAdapter } from "../state/EditorStateAdapter";

const DEFAULT_MAX_ENTRIES = 100;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toPayloadText(payload: unknown): string {
  try {
    return JSON.stringify(payload);
  } catch {
    return "[unserializable payload]";
  }
}

function normalizeFilterValues(values: string[] | undefined): string[] {
  if (!values) {
    return [];
  }

  return values.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

export type EventLoggerSource = "state" | "event-bus" | "custom";

export interface EventLoggerEntry {
  id: string;
  type: string;
  source: EventLoggerSource;
  timestamp: string;
  payload: unknown;
}

export interface EventLoggerFilter {
  sources?: EventLoggerSource[];
  types?: string[];
  text?: string;
}

export interface EventLoggerPanelOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  state?: EditorStateAdapter<TBlock>;
  eventBus?: EventBus<CoreEventPayloadMap>;
  maxEntries?: number;
}

export class EventLoggerPanel<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly maxEntries: number;
  private readonly unsubscribers: Array<() => void> = [];
  private entries: EventLoggerEntry[] = [];
  private filter: EventLoggerFilter = {};
  private entryCounter = 0;

  constructor(options: EventLoggerPanelOptions<TBlock> = {}) {
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;

    if (!Number.isInteger(this.maxEntries) || this.maxEntries < 1) {
      throw new Error("Event logger maxEntries must be a positive integer");
    }

    if (options.state) {
      this.attachState(options.state);
    }

    if (options.eventBus) {
      this.attachEventBus(options.eventBus);
    }
  }

  attachState(state: EditorStateAdapter<TBlock>): () => void {
    const unsubscribe = state.subscribe((snapshot, reason) => {
      this.record({
        source: "state",
        type: `state:${reason}`,
        payload: {
          reason,
          focusedBlockId: snapshot.focusedBlockId,
          activeBlockIds: snapshot.activeBlockIds,
          blockCount: snapshot.document.blocks.length,
        },
      });
    });

    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  attachEventBus(eventBus: EventBus<CoreEventPayloadMap>): Array<() => void> {
    const unsubscribers = CORE_EVENTS.map((eventType) =>
      eventBus.on(eventType, (event) => {
        this.record({
          source: "event-bus",
          type: event.type,
          payload: event.payload,
          timestamp: event.timestamp,
        });
      }),
    );

    this.unsubscribers.push(...unsubscribers);
    return unsubscribers;
  }

  dispose(): void {
    for (const unsubscribe of this.unsubscribers.splice(0)) {
      unsubscribe();
    }
  }

  record(input: {
    type: string;
    source?: EventLoggerSource;
    payload?: unknown;
    timestamp?: string;
  }): EventLoggerEntry {
    const timestamp = input.timestamp ?? new Date().toISOString();
    const entry: EventLoggerEntry = {
      id: `event-${this.entryCounter}`,
      type: input.type,
      source: input.source ?? "custom",
      payload: input.payload ?? null,
      timestamp,
    };
    this.entryCounter += 1;

    this.entries = [entry, ...this.entries].slice(0, this.maxEntries);
    return entry;
  }

  clear(): void {
    this.entries = [];
  }

  setFilter(filter: EventLoggerFilter): EventLoggerFilter {
    this.filter = {
      sources: filter.sources ? [...filter.sources] : undefined,
      types: filter.types ? [...filter.types] : undefined,
      text: filter.text,
    };

    return this.getFilter();
  }

  getFilter(): EventLoggerFilter {
    return {
      sources: this.filter.sources ? [...this.filter.sources] : undefined,
      types: this.filter.types ? [...this.filter.types] : undefined,
      text: this.filter.text,
    };
  }

  getEntries(options: { filtered?: boolean } = {}): EventLoggerEntry[] {
    const applyFilter = options.filtered ?? true;
    if (!applyFilter) {
      return [...this.entries];
    }

    return this.entries.filter((entry) => this.matchesFilter(entry));
  }

  render(): string {
    const filteredEntries = this.getEntries();
    const sourceFilter = this.filter.sources?.join(", ") ?? "all";
    const typeFilter = this.filter.types?.join(", ") ?? "all";
    const textFilter = this.filter.text?.trim() || "none";

    const entriesMarkup =
      filteredEntries.length === 0
        ? '<li class="pulse-editor__event-logger-empty">No events match current filters.</li>'
        : filteredEntries
            .map((entry) => {
              return [
                `<li class="pulse-editor__event-logger-item" data-event-type="${escapeHtml(entry.type)}" data-event-source="${escapeHtml(entry.source)}">`,
                `<div class="pulse-editor__event-logger-meta"><strong>${escapeHtml(entry.type)}</strong> <span>${escapeHtml(entry.source)}</span> <time>${escapeHtml(entry.timestamp)}</time></div>`,
                `<pre class="pulse-editor__event-logger-payload">${escapeHtml(toPayloadText(entry.payload))}</pre>`,
                "</li>",
              ].join("");
            })
            .join("");

    return [
      '<aside class="pulse-editor__event-logger" data-event-logger="true" role="region" aria-label="Event logger">',
      '<h2 class="pulse-editor__event-logger-title">Event logger</h2>',
      `<div class="pulse-editor__event-logger-summary" data-event-logger-count="${filteredEntries.length}" data-event-total="${this.entries.length}">`,
      `Showing ${filteredEntries.length} of ${this.entries.length} events`,
      "</div>",
      `<div class="pulse-editor__event-logger-filters">sources=${escapeHtml(sourceFilter)} | types=${escapeHtml(typeFilter)} | text=${escapeHtml(textFilter)}</div>`,
      '<ol class="pulse-editor__event-logger-list">',
      entriesMarkup,
      "</ol>",
      "</aside>",
    ].join("");
  }

  private matchesFilter(entry: EventLoggerEntry): boolean {
    const sourceFilter = this.filter.sources;
    if (sourceFilter && sourceFilter.length > 0 && !sourceFilter.includes(entry.source)) {
      return false;
    }

    const typeFilter = normalizeFilterValues(this.filter.types);
    if (typeFilter.length > 0 && !typeFilter.includes(entry.type.toLowerCase())) {
      return false;
    }

    const textFilter = this.filter.text?.trim().toLowerCase();
    if (!textFilter) {
      return true;
    }

    const searchablePayload = toPayloadText(entry.payload).toLowerCase();
    return (
      entry.type.toLowerCase().includes(textFilter) ||
      entry.source.toLowerCase().includes(textFilter) ||
      searchablePayload.includes(textFilter)
    );
  }
}

export function createEventLoggerPanel<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(options: EventLoggerPanelOptions<TBlock> = {}): EventLoggerPanel<TBlock> {
  return new EventLoggerPanel(options);
}
