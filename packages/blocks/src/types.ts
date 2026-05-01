import type { BlockDefinition, BlockData } from "../../core/src/types/block";

export interface BlockRenderContext {
  mode?: "editor" | "renderer";
  selected?: boolean;
}

export interface BlockTypeDefinition<TData extends BlockData = BlockData>
  extends BlockDefinition<TData> {
  icon: string;
  render(data: TData, context?: BlockRenderContext): string;
  serialize(data: TData): string;
  deserialize(content: string): TData;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function parseJson<TData>(content: string): TData {
  try {
    return JSON.parse(content) as TData;
  } catch (error) {
    throw new Error(`Failed to parse serialized block: ${String(error)}`);
  }
}
