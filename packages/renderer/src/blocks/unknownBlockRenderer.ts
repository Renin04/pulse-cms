import type { Block } from "@pulse/core";
import { escapeHtml } from "../render/render";

/**
 * Produces a semantic HTML comment + data attribute wrapper for unknown block types.
 * Safe to render in SSR and browser contexts.
 */
export function unknownBlockFallback(block: Block): string {
  return `<div data-block-type="unknown" data-original-type="${escapeHtml(block.type)}" aria-hidden="true"><!-- pulse: unknown block type "${escapeHtml(block.type)}" --></div>`;
}

/**
 * Produces an accessible, visible warning element for unknown blocks.
 * Useful during development to surface missing renderers.
 */
export function unknownBlockDevFallback(block: Block): string {
  return `<div data-block-type="unknown" data-original-type="${escapeHtml(block.type)}" role="alert" style="border:1px solid #f90;padding:8px;background:#fff8e1;font-family:monospace;font-size:12px;">⚠️ No renderer registered for block type: <strong>${escapeHtml(block.type)}</strong></div>`;
}
