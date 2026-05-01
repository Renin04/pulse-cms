import type { Block, BlockData } from "../../../core/src/types/block";
import { renderBlockList } from "../blocks/BlockListRenderer";
import { EditorStateAdapter } from "../state/EditorStateAdapter";
import type { EditorBlockRenderer, EditorStateSnapshot } from "../types";

export type EditorSurfaceStatus = "ready" | "loading" | "error";

export interface EditorSurfaceState {
  status: EditorSurfaceStatus;
  message?: string;
}

export interface EditorRootOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  state: EditorStateAdapter<TBlock>;
  id?: string;
  className?: string;
  emptyStateLabel?: string;
  loadingStateLabel?: string;
  errorStateLabel?: string;
  initialSurfaceState?: EditorSurfaceState;
  renderBlock?: EditorBlockRenderer<TBlock>;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export class EditorRoot<TBlock extends Block<BlockData> = Block<BlockData>> {
  private readonly state: EditorStateAdapter<TBlock>;
  private readonly id: string;
  private readonly className: string;
  private readonly emptyStateLabel?: string;
  private readonly loadingStateLabel: string;
  private readonly errorStateLabel: string;
  private readonly renderBlock?: EditorBlockRenderer<TBlock>;
  private surfaceState: EditorSurfaceState;

  constructor(options: EditorRootOptions<TBlock>) {
    this.state = options.state;
    this.id = options.id ?? "pulse-editor";
    this.className = options.className ?? "";
    this.emptyStateLabel = options.emptyStateLabel;
    this.loadingStateLabel = options.loadingStateLabel ?? "Loading editor...";
    this.errorStateLabel = options.errorStateLabel ?? "Something went wrong while loading the editor.";
    this.renderBlock = options.renderBlock;
    this.surfaceState = options.initialSurfaceState ?? { status: "ready" };
  }

  getSnapshot(): EditorStateSnapshot<TBlock> {
    return this.state.getSnapshot();
  }

  getStateAdapter(): EditorStateAdapter<TBlock> {
    return this.state;
  }

  focusBlock(blockId: string | null, offset: number = 0): EditorStateSnapshot<TBlock> {
    return this.state.setFocusedBlock(blockId, offset);
  }

  focusNextBlock(): EditorStateSnapshot<TBlock> {
    return this.state.focusNextBlock();
  }

  focusPreviousBlock(): EditorStateSnapshot<TBlock> {
    return this.state.focusPreviousBlock();
  }

  updateBlock(
    blockId: string,
    updater: (block: TBlock) => TBlock,
  ): EditorStateSnapshot<TBlock> {
    return this.state.updateBlock(blockId, updater);
  }

  getSurfaceState(): EditorSurfaceState {
    return {
      status: this.surfaceState.status,
      message: this.surfaceState.message,
    };
  }

  setReady(): EditorSurfaceState {
    this.surfaceState = { status: "ready" };
    return this.getSurfaceState();
  }

  setLoading(message: string = this.loadingStateLabel): EditorSurfaceState {
    this.surfaceState = {
      status: "loading",
      message,
    };
    return this.getSurfaceState();
  }

  setError(message: string = this.errorStateLabel): EditorSurfaceState {
    this.surfaceState = {
      status: "error",
      message,
    };
    return this.getSurfaceState();
  }

  render(): string {
    const snapshot = this.state.getSnapshot();
    let contentMarkup: string;

    if (this.surfaceState.status === "loading") {
      const label = this.surfaceState.message ?? this.loadingStateLabel;
      contentMarkup = [
        '<div class="pulse-editor__loading" data-editor-loading="true" dir="auto" style="text-align:start; unicode-bidi: plaintext;">',
        escapeHtml(label),
        "</div>",
      ].join("");
    } else if (this.surfaceState.status === "error") {
      const label = this.surfaceState.message ?? this.errorStateLabel;
      contentMarkup = [
        '<div class="pulse-editor__error" data-editor-error="true" dir="auto" style="text-align:start; unicode-bidi: plaintext;">',
        escapeHtml(label),
        "</div>",
      ].join("");
    } else {
      contentMarkup = renderBlockList({
        blocks: snapshot.document.blocks,
        focusedBlockId: snapshot.focusedBlockId,
        selectedBlockIds: snapshot.activeBlockIds,
        emptyStateLabel: this.emptyStateLabel,
        renderBlock: this.renderBlock,
      });
    }

    return [
      `<section class="pulse-editor ${escapeHtml(this.className)}"`,
      ` data-pulse-editor-root="true"`,
      ` data-editor-id="${escapeHtml(this.id)}"`,
      ` data-focused-block-id="${escapeHtml(snapshot.focusedBlockId ?? "")}"`,
      ` data-editor-surface="${escapeHtml(this.surfaceState.status)}"`,
      ' dir="auto"',
      ' style="text-align:start; unicode-bidi: plaintext;"',
      ' role="region"',
      ` aria-label="${escapeHtml(`Pulse editor ${this.id}`)}">`,
      contentMarkup,
      "</section>",
    ].join("");
  }
}

export function createEditorRoot<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(options: EditorRootOptions<TBlock>): EditorRoot<TBlock> {
  return new EditorRoot(options);
}
