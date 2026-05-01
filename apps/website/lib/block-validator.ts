/**
 * Block Schema Validator
 *
 * Validates block documents against @pulse/blocks schemas.
 * All built-in Pulse block types are supported.
 *
 * Note: @pulse/blocks uses zod v3 while this project uses zod v4.
 * We use runtime duck-typing to avoid type-level incompatibilities.
 */

import { BUILTIN_BLOCK_DEFINITIONS } from "@pulse/blocks";

// Build a lookup map of block type -> schema with safeParse
const blockSchemaMap = new Map<string, { safeParse: (data: unknown) => { success: boolean; error?: { errors: Array<{ path: (string | number)[]; message: string }> } } }>();

for (const def of (BUILTIN_BLOCK_DEFINITIONS as unknown as any[])) {
  if (def.schema && typeof def.schema.safeParse === "function") {
    blockSchemaMap.set(def.type, def.schema);
  }
}

export interface BlockValidationError {
  blockIndex: number;
  blockId?: string;
  blockType: string;
  message: string;
  path?: string;
}

export interface BlockValidationResult {
  valid: boolean;
  errors: BlockValidationError[];
}

/**
 * Validate an array of blocks against Pulse block schemas.
 * Unknown block types are allowed (forward compatibility) but warn.
 */
export function validateBlocks(blocks: unknown[]): BlockValidationResult {
  const errors: BlockValidationError[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const raw = blocks[i];

    if (!raw || typeof raw !== "object") {
      errors.push({
        blockIndex: i,
        blockType: "unknown",
        message: "Block must be an object",
      });
      continue;
    }

    const block = raw as Record<string, unknown>;
    const blockId = typeof block.id === "string" ? block.id : undefined;
    const blockType = typeof block.type === "string" ? block.type : "unknown";

    if (!blockId) {
      errors.push({ blockIndex: i, blockType, message: "Block is missing required 'id' field" });
    }
    if (!block.type) {
      errors.push({ blockIndex: i, blockType, message: "Block is missing required 'type' field" });
      continue;
    }

    const schema = blockSchemaMap.get(blockType);
    if (!schema) {
      // Allow unknown block types (custom blocks, future blocks)
      continue;
    }

    const dataResult = schema.safeParse(block.data ?? {});
    if (!dataResult.success && dataResult.error) {
      const issues = dataResult.error.errors;
      errors.push({
        blockIndex: i,
        blockId,
        blockType,
        message: `Invalid block data: ${issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
        path: issues[0]?.path.join("."),
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if a block type is registered in the built-in block inventory.
 */
export function isKnownBlockType(type: string): boolean {
  return blockSchemaMap.has(type);
}

/**
 * Get the list of all known block types.
 */
export function getKnownBlockTypes(): string[] {
  return Array.from(blockSchemaMap.keys());
}
