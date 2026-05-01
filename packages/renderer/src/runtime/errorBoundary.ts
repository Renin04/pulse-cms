import type { Block } from "@pulse/core";
import { escapeHtml } from "../render/render";

/**
 * Severity level for a renderer error boundary capture.
 */
export type ErrorSeverity = "warning" | "error" | "critical";

/**
 * A captured error from a block render attempt.
 */
export interface RendererError {
  /** The block that failed to render. */
  blockId: string;
  /** Block type that failed. */
  blockType: string;
  /** Human-readable error message. */
  message: string;
  /** Severity classification. */
  severity: ErrorSeverity;
  /** Original thrown value (if available). */
  cause?: unknown;
}

/**
 * Configuration for the renderer error boundary.
 */
export interface ErrorBoundaryConfig {
  /**
   * Custom fallback HTML producer.
   * Receives the captured error and returns an HTML string.
   * If omitted, the built-in fallback template is used.
   */
  fallbackRenderer?: (error: RendererError) => string;
  /**
   * Callback invoked for every captured error.
   * Use for logging, monitoring, or telemetry.
   */
  onError?: (error: RendererError) => void;
  /**
   * If true, error details (message, block type) are embedded in the
   * fallback HTML. Defaults to false — safe for production use.
   */
  exposeDetails?: boolean;
}

/**
 * Built-in fallback HTML template.
 * Produces a visually neutral placeholder that does not expose error details.
 */
function buildDefaultFallback(
  error: RendererError,
  exposeDetails: boolean,
): string {
  const blockIdAttr = `data-pulse-error-block="${escapeHtml(error.blockId)}"`;
  const severityAttr = `data-pulse-error-severity="${error.severity}"`;

  if (exposeDetails) {
    return [
      `<div class="pulse-error-boundary pulse-error-boundary--${error.severity}" ${blockIdAttr} ${severityAttr}>`,
      `  <p class="pulse-error-boundary__message">`,
      `    Block <code>${escapeHtml(error.blockType)}</code> failed to render.`,
      `  </p>`,
      `  <pre class="pulse-error-boundary__detail">${escapeHtml(error.message)}</pre>`,
      `</div>`,
    ].join("\n");
  }

  return [
    `<div class="pulse-error-boundary pulse-error-boundary--${error.severity}" ${blockIdAttr} ${severityAttr} aria-hidden="true">`,
    `</div>`,
  ].join("\n");
}

/**
 * Classify an unknown thrown value into an ErrorSeverity.
 * Critical for Error subclasses, warning for everything else.
 */
function classifySeverity(cause: unknown): ErrorSeverity {
  if (cause instanceof RangeError || cause instanceof TypeError) return "critical";
  if (cause instanceof Error) return "error";
  return "warning";
}

/**
 * Extract a human-readable message from an unknown thrown value.
 */
function extractMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === "string") return cause;
  try {
    return JSON.stringify(cause);
  } catch {
    return "Unknown rendering error.";
  }
}

/**
 * Wrap a block renderer call with an error boundary.
 *
 * If `renderFn` throws, the boundary captures the error, invokes optional
 * callbacks, and returns a safe fallback HTML string instead of propagating.
 *
 * @param block - The block being rendered (used for error context).
 * @param renderFn - The render call to protect.
 * @param config - Error boundary configuration.
 * @returns HTML string — either the block output or the fallback.
 */
export function withErrorBoundary(
  block: Block,
  renderFn: () => string,
  config: ErrorBoundaryConfig = {},
): string {
  try {
    return renderFn();
  } catch (cause) {
    const severity = classifySeverity(cause);
    const message = extractMessage(cause);

    const rendererError: RendererError = {
      blockId: block.id,
      blockType: block.type,
      message,
      severity,
      cause,
    };

    config.onError?.(rendererError);

    if (config.fallbackRenderer) {
      return config.fallbackRenderer(rendererError);
    }

    return buildDefaultFallback(rendererError, config.exposeDetails ?? false);
  }
}

/**
 * Wrap an entire document render array with per-block error boundaries.
 *
 * Each block is rendered independently; a failure in one block does not
 * prevent the remaining blocks from rendering.
 *
 * @param blocks - Ordered array of blocks to render.
 * @param renderFn - Called for each block; should return its HTML string.
 * @param config - Shared error boundary configuration.
 * @returns Array of HTML strings in document order.
 */
export function renderWithBoundaries(
  blocks: Block[],
  renderFn: (block: Block) => string,
  config: ErrorBoundaryConfig = {},
): string[] {
  return blocks.map((block) =>
    withErrorBoundary(block, () => renderFn(block), config),
  );
}

/**
 * Collect all RendererErrors produced during a bounded render without
 * emitting fallback HTML — useful for validation/dry-run passes.
 *
 * @returns Object with `errors` array and `results` array (empty string for failed blocks).
 */
export function auditRender(
  blocks: Block[],
  renderFn: (block: Block) => string,
): { errors: RendererError[]; results: string[] } {
  const errors: RendererError[] = [];
  const results = blocks.map((block) =>
    withErrorBoundary(block, () => renderFn(block), {
      onError: (err) => errors.push(err),
    }),
  );
  return { errors, results };
}
