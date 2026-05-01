import { escapeHtml } from "../render/render";

/**
 * Supported click action types for interactive blocks.
 */
export type ClickActionType =
  | "navigate"
  | "toggle"
  | "emit"
  | "scroll"
  | "copy"
  | "custom";

/**
 * Base shape shared by all click action descriptors.
 */
export interface ClickActionBase {
  /** Discriminant for the action type. */
  type: ClickActionType;
  /** Optional label surfaced as an aria-label on the target element. */
  label?: string;
  /** If true the action is suppressed and no data-attributes are emitted. */
  disabled?: boolean;
}

/** Navigate to a URL (same-tab or new tab). */
export interface NavigateAction extends ClickActionBase {
  type: "navigate";
  /** Destination URL. Must be a relative path or https:// URL. */
  url: string;
  /** Open in a new tab. Defaults to false. */
  newTab?: boolean;
}

/** Toggle a boolean state identified by a stable key. */
export interface ToggleAction extends ClickActionBase {
  type: "toggle";
  /**
   * A stable key identifying the piece of UI state to toggle.
   * Runtime handlers listen for data-pulse-toggle attributes.
   */
  toggleKey: string;
  /** Initial toggle state. Defaults to false (off). */
  initialState?: boolean;
}

/** Emit a custom event on the element's root document. */
export interface EmitAction extends ClickActionBase {
  type: "emit";
  /** Name of the CustomEvent to dispatch. */
  eventName: string;
  /** JSON-serialisable payload attached as detail. */
  payload?: Record<string, unknown>;
}

/** Smooth-scroll to a target element in the same page. */
export interface ScrollAction extends ClickActionBase {
  type: "scroll";
  /** CSS selector or element id of the scroll target. */
  targetSelector: string;
  /** Scroll behaviour. Defaults to smooth. */
  behavior?: ScrollBehavior;
}

/** Copy a string to the clipboard. */
export interface CopyAction extends ClickActionBase {
  type: "copy";
  /** The text to copy to the clipboard. */
  text: string;
}

/** Delegate to a consumer-defined handler identified by a key. */
export interface CustomAction extends ClickActionBase {
  type: "custom";
  /** Stable handler key matched at runtime. */
  handlerKey: string;
  /** Arbitrary payload passed to the handler. */
  payload?: Record<string, unknown>;
}

export type ClickAction =
  | NavigateAction
  | ToggleAction
  | EmitAction
  | ScrollAction
  | CopyAction
  | CustomAction;

/**
 * Validate a ClickAction descriptor.
 * Returns an array of human-readable validation error strings.
 * An empty array means the action is valid.
 */
export function validateClickAction(action: ClickAction): string[] {
  const errors: string[] = [];

  if (!action.type) {
    errors.push("ClickAction.type is required.");
    return errors;
  }

  switch (action.type) {
    case "navigate": {
      const nav = action as NavigateAction;
      if (!nav.url || nav.url.trim() === "") {
        errors.push("NavigateAction.url must not be empty.");
      } else if (
        !nav.url.startsWith("/") &&
        !nav.url.startsWith("https://") &&
        !nav.url.startsWith("http://") &&
        !nav.url.startsWith("#")
      ) {
        errors.push(
          `NavigateAction.url "${nav.url}" must be a relative path, anchor, or https:// URL.`,
        );
      }
      break;
    }
    case "toggle": {
      const tog = action as ToggleAction;
      if (!tog.toggleKey || tog.toggleKey.trim() === "") {
        errors.push("ToggleAction.toggleKey must not be empty.");
      }
      break;
    }
    case "emit": {
      const em = action as EmitAction;
      if (!em.eventName || em.eventName.trim() === "") {
        errors.push("EmitAction.eventName must not be empty.");
      }
      break;
    }
    case "scroll": {
      const sc = action as ScrollAction;
      if (!sc.targetSelector || sc.targetSelector.trim() === "") {
        errors.push("ScrollAction.targetSelector must not be empty.");
      }
      break;
    }
    case "copy": {
      const cp = action as CopyAction;
      if (cp.text === undefined || cp.text === null) {
        errors.push("CopyAction.text must not be undefined.");
      }
      break;
    }
    case "custom": {
      const cu = action as CustomAction;
      if (!cu.handlerKey || cu.handlerKey.trim() === "") {
        errors.push("CustomAction.handlerKey must not be empty.");
      }
      break;
    }
  }

  return errors;
}

/**
 * Serialise a ClickAction into HTML data-* attributes.
 * The returned object maps attribute names to string values.
 * Disabled actions return an empty object (no attributes emitted).
 */
export function clickActionToAttributes(
  action: ClickAction,
): Record<string, string> {
  if (action.disabled) return {};

  const attrs: Record<string, string> = {
    "data-pulse-action": action.type,
  };

  if (action.label) {
    attrs["aria-label"] = escapeHtml(action.label);
  }

  switch (action.type) {
    case "navigate": {
      const nav = action as NavigateAction;
      attrs["data-pulse-url"] = escapeHtml(nav.url);
      if (nav.newTab) attrs["data-pulse-new-tab"] = "true";
      break;
    }
    case "toggle": {
      const tog = action as ToggleAction;
      attrs["data-pulse-toggle"] = escapeHtml(tog.toggleKey);
      attrs["data-pulse-toggle-state"] = tog.initialState ? "true" : "false";
      break;
    }
    case "emit": {
      const em = action as EmitAction;
      attrs["data-pulse-event"] = escapeHtml(em.eventName);
      if (em.payload) {
        attrs["data-pulse-payload"] = escapeHtml(JSON.stringify(em.payload));
      }
      break;
    }
    case "scroll": {
      const sc = action as ScrollAction;
      attrs["data-pulse-scroll-target"] = escapeHtml(sc.targetSelector);
      if (sc.behavior && sc.behavior !== "smooth") {
        attrs["data-pulse-scroll-behavior"] = sc.behavior;
      }
      break;
    }
    case "copy": {
      const cp = action as CopyAction;
      attrs["data-pulse-copy"] = escapeHtml(cp.text);
      break;
    }
    case "custom": {
      const cu = action as CustomAction;
      attrs["data-pulse-handler"] = escapeHtml(cu.handlerKey);
      if (cu.payload) {
        attrs["data-pulse-payload"] = escapeHtml(JSON.stringify(cu.payload));
      }
      break;
    }
  }

  return attrs;
}

/**
 * Render a data-* attribute map as an HTML attribute string fragment.
 * Safe to embed directly in an element opening tag.
 */
export function renderAttributeString(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");
}

/**
 * Wrap innerHtml in a clickable element carrying the serialised action
 * attributes. Uses <a> for navigate/scroll and <button> for interactive actions.
 * Disabled or invalid actions render innerHtml unwrapped.
 */
export function renderClickable(
  innerHtml: string,
  action: ClickAction,
  tagOverride?: "a" | "button" | "span" | "div",
): string {
  if (action.disabled) return innerHtml;

  const errors = validateClickAction(action);
  if (errors.length > 0) {
    return innerHtml;
  }

  const attrs = clickActionToAttributes(action);
  const attrStr = renderAttributeString(attrs);

  let tag: string;
  if (tagOverride) {
    tag = tagOverride;
  } else if (action.type === "navigate" || action.type === "scroll") {
    tag = "a";
  } else {
    tag = "button";
  }

  const baseClass = "pulse-clickable";
  const extra = tag === "button" ? ` type="button" class="${baseClass}"` : ` class="${baseClass}"`;

  return `<${tag}${extra} ${attrStr}>${innerHtml}</${tag}>`;
}

/**
 * Optional runtime hooks used by click dispatch.
 * Consumers can wire these to framework/router/runtime-specific handlers.
 */
export interface ClickDispatchHooks {
  emit?: (eventName: string, payload?: Record<string, unknown>) => void;
  navigate?: (url: string, options: { newTab: boolean }) => void;
  toggle?: (toggleKey: string, nextState: boolean) => void;
  getToggleState?: (toggleKey: string) => boolean | undefined;
  scrollTo?: (
    targetSelector: string,
    options: { behavior: ScrollBehavior },
  ) => void;
  copyText?: (text: string) => void | Promise<void>;
  custom?: (handlerKey: string, payload?: Record<string, unknown>) => void;
}

export interface ClickDispatchResult {
  handled: boolean;
  emittedEvents: string[];
  errors: string[];
}

function pushEvent(
  result: ClickDispatchResult,
  hooks: ClickDispatchHooks,
  eventName: string,
  payload?: Record<string, unknown>,
): void {
  hooks.emit?.(eventName, payload);
  result.emittedEvents.push(eventName);
}

/**
 * Dispatch a click action and emit deterministic runtime events.
 *
 * Base event naming:
 * - `pulse:interaction:click` (all handled actions)
 * - `pulse:interaction:click:<type>` (type-specific)
 * - for `emit` actions, also emits the declared custom event name
 */
export async function dispatchClickAction(
  action: ClickAction,
  hooks: ClickDispatchHooks = {},
): Promise<ClickDispatchResult> {
  const result: ClickDispatchResult = {
    handled: false,
    emittedEvents: [],
    errors: [],
  };

  if (action.disabled) {
    return result;
  }

  const errors = validateClickAction(action);
  if (errors.length > 0) {
    result.errors.push(...errors);
    return result;
  }

  pushEvent(result, hooks, "pulse:interaction:click", { type: action.type });
  pushEvent(result, hooks, `pulse:interaction:click:${action.type}`);

  switch (action.type) {
    case "navigate": {
      hooks.navigate?.(action.url, { newTab: action.newTab ?? false });
      break;
    }
    case "toggle": {
      const current =
        hooks.getToggleState?.(action.toggleKey) ?? action.initialState ?? false;
      const next = !current;
      hooks.toggle?.(action.toggleKey, next);
      pushEvent(result, hooks, "pulse:interaction:toggle:changed", {
        key: action.toggleKey,
        state: next,
      });
      break;
    }
    case "emit": {
      pushEvent(result, hooks, action.eventName, action.payload);
      break;
    }
    case "scroll": {
      hooks.scrollTo?.(action.targetSelector, {
        behavior: action.behavior ?? "smooth",
      });
      break;
    }
    case "copy": {
      await hooks.copyText?.(action.text);
      pushEvent(result, hooks, "pulse:interaction:copy:completed", {
        textLength: action.text.length,
      });
      break;
    }
    case "custom": {
      hooks.custom?.(action.handlerKey, action.payload);
      pushEvent(result, hooks, "pulse:interaction:custom:invoked", {
        handlerKey: action.handlerKey,
      });
      break;
    }
  }

  result.handled = true;
  return result;
}
