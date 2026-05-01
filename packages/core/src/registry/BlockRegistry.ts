import type { Block, BlockData, BlockDefinition } from "../types/block";
import { validateBlock, validateBlockDefinition } from "../schemas/blockSchema";

type RegistryDefinition = BlockDefinition<BlockData>;
type RegistryBlock = Block<BlockData>;

export class BlockRegistry {
  private static instance: BlockRegistry | null = null;

  private readonly definitions = new Map<string, RegistryDefinition>();
  private readonly blocks = new Map<string, RegistryBlock>();

  private constructor() {}

  static getInstance(): BlockRegistry {
    if (!BlockRegistry.instance) {
      BlockRegistry.instance = new BlockRegistry();
    }

    return BlockRegistry.instance;
  }

  static resetInstance(): void {
    BlockRegistry.instance = null;
  }

  register<TData extends BlockData>(definition: BlockDefinition<TData>): void {
    validateBlockDefinition(definition);

    if (this.definitions.has(definition.type)) {
      throw new Error(`Block type "${definition.type}" is already registered`);
    }

    this.definitions.set(definition.type, definition as RegistryDefinition);
  }

  unregister(type: string): boolean {
    if (!this.definitions.has(type)) {
      return false;
    }

    this.definitions.delete(type);
    for (const [blockId, block] of this.blocks.entries()) {
      if (block.type === type) {
        this.blocks.delete(blockId);
      }
    }

    return true;
  }

  has(type: string): boolean {
    return this.definitions.has(type);
  }

  getDefinition<TData extends BlockData>(
    type: string,
  ): BlockDefinition<TData> | undefined {
    return this.definitions.get(type) as BlockDefinition<TData> | undefined;
  }

  getDefinitions(): BlockDefinition[] {
    return Array.from(this.definitions.values());
  }

  getBlockById<TData extends BlockData>(id: string): Block<TData> | undefined {
    return this.blocks.get(id) as Block<TData> | undefined;
  }

  getBlocksByType<TData extends BlockData>(type: string): Block<TData>[] {
    return Array.from(this.blocks.values())
      .filter((block) => block.type === type)
      .map((block) => block as Block<TData>);
  }

  async createBlock<TData extends BlockData>(
    type: string,
    data?: Partial<TData> | TData,
  ): Promise<Block<TData>> {
    const definition = this.getRequiredDefinition<TData>(type);
    const blockData = this.resolveData(definition, data);
    const validatedData = definition.schema.parse(blockData);
    const now = new Date().toISOString();

    const block: Block<TData> = validateBlock({
      id: this.createId(),
      type: definition.type,
      data: validatedData,
      createdAt: now,
      updatedAt: now,
    });

    this.blocks.set(block.id, block as RegistryBlock);

    if (definition.hooks?.onCreate) {
      await definition.hooks.onCreate(block);
    }

    return block;
  }

  async updateBlock<TData extends BlockData>(
    id: string,
    data: Partial<TData> | TData,
  ): Promise<Block<TData>> {
    const current = this.blocks.get(id) as Block<TData> | undefined;
    if (!current) {
      throw new Error(`Block with id "${id}" is not registered`);
    }

    const definition = this.getRequiredDefinition<TData>(current.type);
    const previousData = this.cloneData(current.data);
    const mergedData = this.mergeData(current.data, data);
    const validatedData = definition.schema.parse(mergedData);

    const updatedBlock: Block<TData> = validateBlock({
      ...current,
      data: validatedData,
      updatedAt: new Date().toISOString(),
    });

    this.blocks.set(updatedBlock.id, updatedBlock as RegistryBlock);

    if (definition.hooks?.onUpdate) {
      await definition.hooks.onUpdate(updatedBlock, previousData);
    }

    return updatedBlock;
  }

  async destroyBlock(id: string): Promise<boolean> {
    const current = this.blocks.get(id);
    if (!current) {
      return false;
    }

    const definition = this.getRequiredDefinition(current.type);
    if (definition.hooks?.onDestroy) {
      await definition.hooks.onDestroy(current);
    }

    this.blocks.delete(id);
    return true;
  }

  clear(): void {
    this.blocks.clear();
    this.definitions.clear();
  }

  private getRequiredDefinition<TData extends BlockData>(
    type: string,
  ): BlockDefinition<TData> {
    const definition = this.definitions.get(type) as
      | BlockDefinition<TData>
      | undefined;
    if (!definition) {
      throw new Error(`Block type "${type}" is not registered`);
    }

    return definition;
  }

  private resolveData<TData extends BlockData>(
    definition: BlockDefinition<TData>,
    overrideData?: Partial<TData> | TData,
  ): TData {
    const defaultData =
      typeof definition.defaultData === "function"
        ? definition.defaultData()
        : this.cloneData(definition.defaultData);

    if (overrideData === undefined) {
      return defaultData;
    }

    return this.mergeData(defaultData, overrideData);
  }

  private mergeData<TData extends BlockData>(
    baseData: TData,
    overrideData: Partial<TData> | TData,
  ): TData {
    if (this.isPlainObject(baseData) && this.isPlainObject(overrideData)) {
      return {
        ...baseData,
        ...overrideData,
      } as TData;
    }

    return overrideData as TData;
  }

  private cloneData<TData extends BlockData>(data: TData): TData {
    if (typeof structuredClone === "function") {
      return structuredClone(data);
    }

    return JSON.parse(JSON.stringify(data)) as TData;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === "object" &&
      value !== null &&
      Object.getPrototypeOf(value) === Object.prototype
    );
  }

  private createId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `block_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  }
}
