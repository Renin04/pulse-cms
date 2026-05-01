import type { Block, BlockData } from "@pulse/core";
import type { BlockRendererFn } from "../types/renderer";
import { escapeHtml } from "../render/render";

/**
 * A single branch option in a branch block.
 * Readers choose one path; the linked content is revealed.
 */
export interface BranchOption {
  /** Unique identifier for this branch option. */
  id: string;
  /** Display label for the choice button. */
  label: string;
  /** HTML content or block id list to reveal when selected. */
  content: string;
  /** Optional icon or emoji for the choice. */
  icon?: string;
}

/**
 * Data structure for a branch (choose-your-path) block.
 */
export interface BranchBlockData extends BlockData {
  /** Prompt or question shown above the choices. */
  prompt: string;
  /** Array of branch options the reader can choose from. */
  options: BranchOption[];
  /**
   * Layout of the choice buttons.
   * "horizontal" renders side-by-side; "vertical" stacks them.
   */
  layout?: "horizontal" | "vertical";
  /** Whether to allow resetting/changing choice. Defaults to true. */
  allowReset?: boolean;
  /** Optional style variant for visual differentiation. */
  variant?: "default" | "card" | "minimal";
}

/**
 * Render a single branch option as a choice button.
 */
function renderBranchOption(option: BranchOption, blockId: string): string {
  const optionId = escapeHtml(option.id);
  const label = escapeHtml(option.label);
  const icon = option.icon ? escapeHtml(option.icon) : "";

  return [
    `<button`,
    `  class="pulse-branch__option"`,
    `  type="button"`,
    `  data-pulse-branch-block="${blockId}"`,
    `  data-pulse-branch-option="${optionId}"`,
    `  aria-pressed="false"`,
    `>`,
    icon ? `  <span class="pulse-branch__option-icon" aria-hidden="true">${icon}</span>` : "",
    `  <span class="pulse-branch__option-label">${label}</span>`,
    `</button>`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Render the content panel for a branch option.
 * Hidden by default; revealed when the option is selected client-side.
 */
function renderBranchContent(option: BranchOption, blockId: string): string {
  const optionId = escapeHtml(option.id);
  const content = option.content;

  return [
    `<div`,
    `  class="pulse-branch__content"`,
    `  data-pulse-branch-block="${blockId}"`,
    `  data-pulse-branch-content="${optionId}"`,
    `  hidden`,
    `  role="region"`,
    `  aria-label="${escapeHtml(option.label)} content"`,
    `>`,
    `  ${content}`,
    `</div>`,
  ].join("\n");
}

/**
 * Render a branch (choose-your-path) block.
 *
 * The renderer produces SSR-safe HTML. Client-side hydration handles:
 * - Showing/hiding content panels on choice selection
 * - Persisting choice state (optional)
 * - Reset button behavior
 *
 * Accessibility:
 * - Choice buttons use aria-pressed for toggle state
 * - Content panels use role="region" with descriptive aria-label
 * - Keyboard navigation via standard button focus order
 */
export const renderBranch: BlockRendererFn<BranchBlockData> = (
  block: Block<BranchBlockData>,
) => {
  const {
    prompt = "",
    options = [],
    layout = "vertical",
    allowReset = true,
    variant = "default",
  } = block.data;

  const blockId = escapeHtml(block.id);
  const escapedPrompt = escapeHtml(prompt);

  const parts: string[] = [];

  parts.push(
    `<div`,
    `  class="pulse-branch pulse-branch--${layout} pulse-branch--${variant}"`,
    `  data-pulse-block-id="${blockId}"`,
    `  data-pulse-allow-reset="${allowReset}"`,
    `  role="group"`,
    `  aria-label="Choose your path"`,
    `>`,
  );

  if (escapedPrompt) {
    parts.push(
      `  <p class="pulse-branch__prompt">${escapedPrompt}</p>`,
    );
  }

  parts.push(`  <div class="pulse-branch__options" role="group" aria-label="Path choices">`);
  for (const option of options) {
    parts.push("  " + renderBranchOption(option, blockId));
  }
  parts.push(`  </div>`);

  for (const option of options) {
    parts.push(renderBranchContent(option, blockId));
  }

  if (allowReset) {
    parts.push(
      `  <button`,
      `    class="pulse-branch__reset"`,
      `    type="button"`,
      `    data-pulse-branch-reset="${blockId}"`,
      `    hidden`,
      `    aria-label="Reset choice"`,
      `  >`,
      `    Reset`,
      `  </button>`,
    );
  }

  parts.push(`</div>`);

  return parts.join("\n");
};

/**
 * Evaluate which branch option should be shown given a user's selection id.
 * Returns the matching option or undefined if not found.
 */
export function resolveBranchOption(
  data: BranchBlockData,
  selectedOptionId: string,
): BranchOption | undefined {
  return data.options.find((opt) => opt.id === selectedOptionId);
}

/**
 * Validate branch block data.
 * Returns an array of error strings (empty means valid).
 */
export function validateBranchData(data: BranchBlockData): string[] {
  const errors: string[] = [];

  if (!data.prompt && data.options.length === 0) {
    errors.push("Branch block must have a prompt or at least one option.");
  }

  if (data.options.length < 2) {
    errors.push("Branch block should have at least 2 options to be meaningful.");
  }

  const ids = data.options.map((o) => o.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push("Branch block option ids must be unique.");
  }

  for (const option of data.options) {
    if (!option.label.trim()) {
      errors.push(`Branch option "${option.id}" has an empty label.`);
    }
  }

  return errors;
}
