import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorStateAdapter } from "../state/EditorStateAdapter";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export interface BlockInspectorSnapshot<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  focusedBlockId: string | null;
  activeBlockIds: string[];
  blockCount: number;
  inspectedBlock: TBlock | null;
}

export interface BlockInspectorOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  state: EditorStateAdapter<TBlock>;
  title?: string;
}

export class BlockInspector<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly state: EditorStateAdapter<TBlock>;
  private readonly title: string;

  constructor(options: BlockInspectorOptions<TBlock>) {
    this.state = options.state;
    this.title = options.title ?? "Block inspector";
  }

  getSnapshot(): BlockInspectorSnapshot<TBlock> {
    const editorSnapshot = this.state.getSnapshot();
    const inspectedBlock = editorSnapshot.focusedBlockId
      ? editorSnapshot.document.blocks.find((block) => block.id === editorSnapshot.focusedBlockId) ?? null
      : null;

    return {
      focusedBlockId: editorSnapshot.focusedBlockId,
      activeBlockIds: [...editorSnapshot.activeBlockIds],
      blockCount: editorSnapshot.document.blocks.length,
      inspectedBlock,
    };
  }

  render(): string {
    const snapshot = this.getSnapshot();
    const payload = snapshot.inspectedBlock
      ? toPrettyJson(snapshot.inspectedBlock)
      : "No focused block selected";

    return [
      '<aside class="pulse-editor__block-inspector" data-block-inspector="true" role="region" aria-label="Block inspector">',
      `<h2 class="pulse-editor__block-inspector-title">${escapeHtml(this.title)}</h2>`,
      `<div class="pulse-editor__block-inspector-meta" data-focused-block-id="${escapeHtml(snapshot.focusedBlockId ?? "")}" data-block-count="${snapshot.blockCount}" data-active-blocks="${escapeHtml(snapshot.activeBlockIds.join(","))}">`,
      `Focused: ${escapeHtml(snapshot.focusedBlockId ?? "none")}`,
      "</div>",
      `<pre class="pulse-editor__block-inspector-payload">${escapeHtml(payload)}</pre>`,
      "</aside>",
    ].join("");
  }
}

export function createBlockInspector<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(options: BlockInspectorOptions<TBlock>): BlockInspector<TBlock> {
  return new BlockInspector(options);
}
