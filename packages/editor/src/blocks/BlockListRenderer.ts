import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorBlockRenderContext, EditorBlockRenderer } from "../types";

export interface RenderBlockListOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  blocks: TBlock[];
  focusedBlockId: string | null;
  selectedBlockIds?: string[];
  renderBlock?: EditorBlockRenderer<TBlock>;
  emptyStateLabel?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toPreviewText(data: BlockData): string {
  const textValue = data.text;
  if (typeof textValue === "string") {
    return textValue;
  }

  return JSON.stringify(data);
}

export function defaultEditorBlockRenderer<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(context: EditorBlockRenderContext<TBlock>): string {
  return [
    `<div class="pulse-editor__block-meta">${escapeHtml(context.block.type)}</div>`,
    '<div class="pulse-editor__block-content" dir="auto" style="text-align:start; unicode-bidi: plaintext;">',
    escapeHtml(toPreviewText(context.block.data)),
    "</div>",
  ].join("");
}

export function renderBlockList<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(options: RenderBlockListOptions<TBlock>): string {
  if (options.blocks.length === 0) {
    const emptyStateLabel = options.emptyStateLabel ?? "Start writing to create your first block.";

    return `<div class="pulse-editor__empty" data-editor-empty="true">${escapeHtml(emptyStateLabel)}</div>`;
  }

  const selectedBlockIdSet = new Set(options.selectedBlockIds ?? []);
  const blockRenderer = options.renderBlock ?? defaultEditorBlockRenderer<TBlock>;

  const items = options.blocks
    .map((block, index) => {
      const isFocused = block.id === options.focusedBlockId;
      const isSelected = selectedBlockIdSet.has(block.id) || isFocused;

      return [
        `<li class="pulse-editor__block-item${isFocused ? " is-focused" : ""}"`,
        ` data-block-id="${escapeHtml(block.id)}"`,
        ` data-focused="${String(isFocused)}"`,
        ` data-selected="${String(isSelected)}"`,
        ' dir="auto"',
        ` role="option"`,
        ` aria-selected="${String(isSelected)}"`,
        ` tabindex="${isFocused ? "0" : "-1"}">`,
        blockRenderer({
          block,
          index,
          isFocused,
          isSelected,
        }),
        "</li>",
      ].join("");
    })
    .join("");

  return `<ol class="pulse-editor__block-list" role="listbox">${items}</ol>`;
}
