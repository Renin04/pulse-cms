import type { Block, BlockData } from "@pulse/core";
import type { BlockRendererFn } from "../types/renderer";
import { escapeHtml } from "../render/render";

/**
 * Supported condition operators for conditional block evaluation.
 */
export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "is_set"
  | "is_not_set";

/**
 * A single condition rule.
 */
export interface ConditionRule {
  /** The context variable or attribute to evaluate (e.g., "user.role", "query.plan"). */
  variable: string;
  /** The comparison operator. */
  operator: ConditionOperator;
  /** The value to compare against (not required for is_set / is_not_set). */
  value?: string | number | boolean;
}

/**
 * How multiple rules are combined.
 */
export type ConditionLogic = "and" | "or";

/**
 * Data structure for a conditional block.
 * Shows or hides content based on runtime context variables.
 */
export interface ConditionalBlockData extends BlockData {
  /** One or more condition rules. */
  rules: ConditionRule[];
  /** How to combine multiple rules. Defaults to "and". */
  logic?: ConditionLogic;
  /** HTML content to show when conditions are met. */
  content: string;
  /** Optional fallback content when conditions are not met. */
  fallbackContent?: string;
  /**
   * Evaluation mode:
   * - "client" — evaluated in the browser at runtime (default)
   * - "server" — evaluated server-side before rendering
   * - "static" — always show content (for static export)
   */
  evaluationMode?: "client" | "server" | "static";
}

/**
 * Runtime context passed to conditional evaluation.
 * Keys are dot-notation variable paths; values are the resolved values.
 */
export type ConditionalContext = Record<string, string | number | boolean | null | undefined>;

/**
 * Evaluate a single condition rule against a context.
 */
export function evaluateRule(rule: ConditionRule, context: ConditionalContext): boolean {
  const value = context[rule.variable];

  switch (rule.operator) {
    case "is_set":
      return value !== null && value !== undefined && value !== "";
    case "is_not_set":
      return value === null || value === undefined || value === "";
    case "equals":
      return String(value) === String(rule.value ?? "");
    case "not_equals":
      return String(value) !== String(rule.value ?? "");
    case "contains":
      return String(value ?? "").includes(String(rule.value ?? ""));
    case "not_contains":
      return !String(value ?? "").includes(String(rule.value ?? ""));
    case "greater_than":
      return Number(value) > Number(rule.value ?? 0);
    case "less_than":
      return Number(value) < Number(rule.value ?? 0);
    default:
      return false;
  }
}

/**
 * Evaluate all condition rules against a context using the specified logic.
 */
export function evaluateCondition(
  data: ConditionalBlockData,
  context: ConditionalContext,
): boolean {
  const { rules, logic = "and" } = data;

  if (rules.length === 0) return true;

  if (logic === "and") {
    return rules.every((rule) => evaluateRule(rule, context));
  }
  return rules.some((rule) => evaluateRule(rule, context));
}

/**
 * Serialize condition rules to a JSON-safe data attribute string.
 */
function serializeRules(rules: ConditionRule[]): string {
  return escapeHtml(JSON.stringify(rules));
}

/**
 * Render a conditional block.
 *
 * For "client" mode: emits a wrapper with data attributes encoding the rules.
 *   Client-side hydration evaluates the rules and shows/hides content.
 *
 * For "server" mode: content/fallback is pre-resolved; the wrapper is a
 *   simple passthrough (no runtime evaluation needed).
 *
 * For "static" mode: always renders the main content unconditionally.
 *
 * Accessibility:
 * - Hidden content uses the `hidden` attribute (not just CSS display:none)
 * - Visible content has no special ARIA — it's treated as normal document flow
 */
export const renderConditional: BlockRendererFn<ConditionalBlockData> = (
  block: Block<ConditionalBlockData>,
) => {
  const {
    rules = [],
    logic = "and",
    content = "",
    fallbackContent = "",
    evaluationMode = "client",
  } = block.data;

  const blockId = escapeHtml(block.id);

  // Static mode: always show content
  if (evaluationMode === "static") {
    return [
      `<div class="pulse-conditional pulse-conditional--static" data-pulse-block-id="${blockId}">`,
      `  ${content}`,
      `</div>`,
    ].join("\n");
  }

  // Server mode: content is already resolved — emit as-is
  if (evaluationMode === "server") {
    return [
      `<div class="pulse-conditional pulse-conditional--server" data-pulse-block-id="${blockId}">`,
      `  ${content}`,
      `</div>`,
    ].join("\n");
  }

  // Client mode: emit rules as data attributes for client-side evaluation
  const serializedRules = serializeRules(rules);

  const parts: string[] = [];

  parts.push(
    `<div`,
    `  class="pulse-conditional pulse-conditional--client"`,
    `  data-pulse-block-id="${blockId}"`,
    `  data-pulse-condition-rules="${serializedRules}"`,
    `  data-pulse-condition-logic="${logic}"`,
    `>`,
  );

  parts.push(
    `  <div`,
    `    class="pulse-conditional__content"`,
    `    data-pulse-condition-content="${blockId}"`,
    `    hidden`,
    `  >`,
    `    ${content}`,
    `  </div>`,
  );

  if (fallbackContent) {
    parts.push(
      `  <div`,
      `    class="pulse-conditional__fallback"`,
      `    data-pulse-condition-fallback="${blockId}"`,
      `  >`,
      `    ${fallbackContent}`,
      `  </div>`,
    );
  }

  parts.push(`</div>`);

  return parts.join("\n");
};

/**
 * Server-side render a conditional block with a known context.
 * Returns the resolved HTML string (content or fallback) without wrapper markup.
 */
export function renderConditionalSSR(
  data: ConditionalBlockData,
  context: ConditionalContext,
): string {
  const conditionMet = evaluateCondition(data, context);
  if (conditionMet) return data.content;
  return data.fallbackContent ?? "";
}

/**
 * Validate conditional block data.
 * Returns an array of error strings (empty means valid).
 */
export function validateConditionalData(data: ConditionalBlockData): string[] {
  const errors: string[] = [];

  if (data.rules.length === 0 && data.evaluationMode !== "static") {
    errors.push("Conditional block has no rules — use evaluationMode 'static' to always show content.");
  }

  for (const rule of data.rules) {
    if (!rule.variable.trim()) {
      errors.push("Conditional rule has an empty variable name.");
    }
    if (
      rule.operator !== "is_set" &&
      rule.operator !== "is_not_set" &&
      rule.value === undefined
    ) {
      errors.push(
        `Conditional rule for "${rule.variable}" with operator "${rule.operator}" requires a value.`,
      );
    }
  }

  if (!data.content.trim()) {
    errors.push("Conditional block has no content to show.");
  }

  return errors;
}
