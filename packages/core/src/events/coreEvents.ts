import type {
  BlockEventType,
  ContentEventType,
  CoreEventType,
  EditorEventType,
  SelectionEventType,
} from "../types/event";

export const BLOCK_EVENTS: readonly BlockEventType[] = [
  "block:created",
  "block:updated",
  "block:deleted",
  "block:moved",
];

export const SELECTION_EVENTS: readonly SelectionEventType[] = [
  "selection:changed",
  "selection:cleared",
];

export const CONTENT_EVENTS: readonly ContentEventType[] = [
  "content:changed",
  "content:saved",
];

export const EDITOR_EVENTS: readonly EditorEventType[] = [
  "editor:ready",
  "editor:destroyed",
  "editor:focus",
  "editor:blur",
];

export const CORE_EVENTS: readonly CoreEventType[] = [
  ...BLOCK_EVENTS,
  ...SELECTION_EVENTS,
  ...CONTENT_EVENTS,
  ...EDITOR_EVENTS,
];

const coreEventSet = new Set<string>(CORE_EVENTS);

export function isCoreEventType(value: string): value is CoreEventType {
  return coreEventSet.has(value);
}
