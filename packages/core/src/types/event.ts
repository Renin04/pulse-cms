export type BlockEventType =
  | "block:created"
  | "block:updated"
  | "block:deleted"
  | "block:moved";

export type SelectionEventType = "selection:changed" | "selection:cleared";

export type ContentEventType = "content:changed" | "content:saved";

export type EditorEventType =
  | "editor:ready"
  | "editor:destroyed"
  | "editor:focus"
  | "editor:blur";

export type CoreEventType =
  | BlockEventType
  | SelectionEventType
  | ContentEventType
  | EditorEventType;

export interface BlockCreatedPayload {
  blockId: string;
  blockType: string;
}

export interface BlockUpdatedPayload {
  blockId: string;
  blockType: string;
  changedFields: string[];
}

export interface BlockDeletedPayload {
  blockId: string;
  blockType: string;
}

export interface BlockMovedPayload {
  blockId: string;
  fromIndex: number;
  toIndex: number;
}

export interface SelectionChangedPayload {
  blockId: string | null;
  startOffset: number | null;
  endOffset: number | null;
}

export interface SelectionClearedPayload {
  reason?: "blur" | "command" | "programmatic";
}

export interface ContentChangedPayload {
  source: "user" | "plugin" | "ai" | "system";
  blockCount: number;
}

export interface ContentSavedPayload {
  documentId: string;
  savedAt: string;
}

export interface EditorReadyPayload {
  editorId: string;
}

export interface EditorDestroyedPayload {
  editorId: string;
}

export interface EditorFocusPayload {
  editorId: string;
}

export interface EditorBlurPayload {
  editorId: string;
}

export interface CoreEventPayloadMap {
  [eventType: string]: unknown;
  "block:created": BlockCreatedPayload;
  "block:updated": BlockUpdatedPayload;
  "block:deleted": BlockDeletedPayload;
  "block:moved": BlockMovedPayload;
  "selection:changed": SelectionChangedPayload;
  "selection:cleared": SelectionClearedPayload;
  "content:changed": ContentChangedPayload;
  "content:saved": ContentSavedPayload;
  "editor:ready": EditorReadyPayload;
  "editor:destroyed": EditorDestroyedPayload;
  "editor:focus": EditorFocusPayload;
  "editor:blur": EditorBlurPayload;
}

export type EventPayloadMap = Record<string, unknown>;

export interface PulseEvent<
  TType extends string = string,
  TPayload = unknown,
> {
  type: TType;
  payload: TPayload;
  timestamp: string;
  defaultPrevented: boolean;
  preventDefault(): void;
}

export interface EventListenerOptions {
  priority?: number;
  once?: boolean;
}

export type EventListener<TPayload> = (
  event: PulseEvent<string, TPayload>,
) => void | Promise<void>;

export type EventMiddleware<
  TEvents extends EventPayloadMap = EventPayloadMap,
> = <TType extends keyof TEvents & string>(
  event: PulseEvent<TType, TEvents[TType]>,
  next: () => Promise<void>,
) => void | Promise<void>;
