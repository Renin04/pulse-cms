import { EventBus } from "../events/EventBus";
import { PluginManager } from "../plugins/PluginManager";
import { BlockRegistry } from "../registry/BlockRegistry";
import { DocumentState } from "../state/DocumentState";
import { HistoryState } from "../state/HistoryState";
import { SelectionState } from "../state/SelectionState";
import type { Block, BlockData, BlockDefinition } from "../types/block";
import type { CoreEventPayloadMap } from "../types/event";
import type { Plugin, PluginConfig } from "../types/plugin";
import type { DocumentSnapshot } from "../state/DocumentState";
import type { SelectionSnapshot } from "../state/SelectionState";

export interface VanillaEditorOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  documentId?: string;
  initialBlocks?: TBlock[];
  historyLimit?: number;
  onChange?: (snapshot: DocumentSnapshot<TBlock>) => void;
}

export interface VanillaEditorSnapshot<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  document: DocumentSnapshot<TBlock>;
  selection: SelectionSnapshot;
  canUndo: boolean;
  canRedo: boolean;
}

export class VanillaEditorAPI<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly documentState: DocumentState<TBlock>;
  private readonly selectionState: SelectionState;
  private readonly historyState: HistoryState<DocumentSnapshot<TBlock>>;
  private readonly eventBus: EventBus<CoreEventPayloadMap>;
  private readonly pluginManager: PluginManager;
  readonly registry: BlockRegistry;
  private readonly onChange?: (snapshot: DocumentSnapshot<TBlock>) => void;

  constructor(options: VanillaEditorOptions<TBlock> = {}) {
    this.registry = BlockRegistry.getInstance();
    this.eventBus = new EventBus<CoreEventPayloadMap>();
    this.pluginManager = new PluginManager({ eventBus: this.eventBus });

    this.documentState = new DocumentState<TBlock>({
      id: options.documentId,
      blocks: options.initialBlocks ?? [],
    });

    this.selectionState = new SelectionState();

    const initialDocSnapshot = this.documentState.getSnapshot();
    this.historyState = new HistoryState<DocumentSnapshot<TBlock>>(
      initialDocSnapshot,
      { limit: options.historyLimit ?? 100 },
    );

    this.onChange = options.onChange;
  }

  getSnapshot(): VanillaEditorSnapshot<TBlock> {
    return {
      document: this.documentState.getSnapshot(),
      selection: this.selectionState.getSnapshot(),
      canUndo: this.historyState.canUndo(),
      canRedo: this.historyState.canRedo(),
    };
  }

  getDocument(): DocumentSnapshot<TBlock> {
    return this.documentState.getSnapshot();
  }

  getBlocks(): TBlock[] {
    return this.documentState.getBlocks();
  }

  getBlockById(id: string): TBlock | undefined {
    return this.documentState.getBlockById(id);
  }

  registerBlockDefinition<TData extends BlockData>(
    definition: BlockDefinition<TData>,
  ): void {
    this.registry.register(definition);
  }

  insertBlock(block: TBlock, index?: number): DocumentSnapshot<TBlock> {
    const snapshot = this.documentState.insertBlock(block, index);
    this.commitHistory();
    void this.eventBus.emit("block:created", {
      blockId: block.id,
      blockType: block.type,
    });
    this.notifyChange(snapshot);
    return snapshot;
  }

  updateBlock(
    blockId: string,
    updater: (block: TBlock) => TBlock,
  ): DocumentSnapshot<TBlock> {
    const snapshot = this.documentState.updateBlock(blockId, updater);
    this.commitHistory();
    const updated = this.documentState.getBlockById(blockId);
    void this.eventBus.emit("block:updated", {
      blockId,
      blockType: updated?.type ?? "",
      changedFields: [],
    });
    this.notifyChange(snapshot);
    return snapshot;
  }

  removeBlock(blockId: string): DocumentSnapshot<TBlock> {
    const target = this.documentState.getBlockById(blockId);
    const snapshot = this.documentState.removeBlock(blockId);
    this.commitHistory();
    if (target) {
      void this.eventBus.emit("block:deleted", {
        blockId,
        blockType: target.type,
      });
    }
    this.notifyChange(snapshot);
    return snapshot;
  }

  moveBlock(blockId: string, toIndex: number): DocumentSnapshot<TBlock> {
    const fromIndex = this.documentState
      .getBlocks()
      .findIndex((block) => block.id === blockId);
    const snapshot = this.documentState.moveBlock(blockId, toIndex);
    this.commitHistory();
    void this.eventBus.emit("block:moved", {
      blockId,
      fromIndex,
      toIndex,
    });
    this.notifyChange(snapshot);
    return snapshot;
  }

  undo(): VanillaEditorSnapshot<TBlock> {
    const histSnap = this.historyState.undo();
    this.documentState.replaceSnapshot(histSnap.present);
    return this.getSnapshot();
  }

  redo(): VanillaEditorSnapshot<TBlock> {
    const histSnap = this.historyState.redo();
    this.documentState.replaceSnapshot(histSnap.present);
    return this.getSnapshot();
  }

  setCursor(blockId: string, offset: number): SelectionSnapshot {
    const snap = this.selectionState.setCursor(blockId, offset);
    void this.eventBus.emit("selection:changed", {
      blockId,
      startOffset: offset,
      endOffset: offset,
    });
    return snap;
  }

  clearSelection(): SelectionSnapshot {
    const snap = this.selectionState.clear("programmatic");
    void this.eventBus.emit("selection:cleared", { reason: "programmatic" });
    return snap;
  }

  on<TType extends keyof CoreEventPayloadMap & string>(
    type: TType,
    listener: (payload: CoreEventPayloadMap[TType]) => void,
  ): () => void {
    return this.eventBus.on(type, (event) => listener(event.payload));
  }

  async installPlugin<TConfig extends PluginConfig>(
    plugin: Plugin<TConfig>,
    config?: TConfig,
  ): Promise<void> {
    await this.pluginManager.install(plugin, config);
    await this.pluginManager.enable(plugin.name);
  }

  async uninstallPlugin(pluginName: string): Promise<void> {
    await this.pluginManager.disable(pluginName);
    await this.pluginManager.uninstall(pluginName);
  }

  destroy(): void {
    this.selectionState.clear("programmatic");
    void this.eventBus.emit("editor:destroyed", {
      editorId: this.documentState.getSnapshot().id,
    });
  }

  private commitHistory(): void {
    this.historyState.push(this.documentState.getSnapshot());
  }

  private notifyChange(snapshot: DocumentSnapshot<TBlock>): void {
    if (this.onChange) {
      this.onChange(snapshot);
    }
  }
}

export function createVanillaEditor<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(options?: VanillaEditorOptions<TBlock>): VanillaEditorAPI<TBlock> {
  return new VanillaEditorAPI(options);
}
