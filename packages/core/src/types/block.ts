import type { ZodType } from "zod";

export type BlockData = Record<string, unknown>;

export interface Block<TData extends BlockData = BlockData> {
  id: string;
  parentId?: string | null;
  type: string;
  data: TData;
  createdAt: string;
  updatedAt: string;
}

export interface BlockLifecycleHooks<TData extends BlockData = BlockData> {
  onCreate?(block: Block<TData>): void | Promise<void>;
  onUpdate?(block: Block<TData>, previousData: TData): void | Promise<void>;
  onDestroy?(block: Block<TData>): void | Promise<void>;
}

export interface BlockConfig {
  category?: "basic" | "media" | "interactive" | "advanced";
  isVoid?: boolean;
  isInline?: boolean;
  canHaveChildren?: boolean;
}

export interface BlockDefinition<TData extends BlockData = BlockData> {
  type: string;
  name: string;
  schema: ZodType<TData>;
  defaultData: TData | (() => TData);
  config?: BlockConfig;
  hooks?: BlockLifecycleHooks<TData>;
}
