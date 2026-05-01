import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorStateAdapter } from "./EditorStateAdapter";

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

function createGeneratedId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export interface BlockTemplate<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  id: string;
  title: string;
  description?: string;
  blocks: TBlock[];
}

export interface CreateBlockTemplateOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  id: string;
  title: string;
  description?: string;
  blocks: TBlock[];
}

export function createBlockTemplate<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(options: CreateBlockTemplateOptions<TBlock>): BlockTemplate<TBlock> {
  if (!options.id.trim()) {
    throw new Error("Template id is required");
  }
  if (!options.title.trim()) {
    throw new Error("Template title is required");
  }
  if (options.blocks.length === 0) {
    throw new Error("Template must include at least one block");
  }

  return {
    id: options.id,
    title: options.title,
    description: options.description,
    blocks: cloneValue(options.blocks),
  };
}

export class BlockTemplateRegistry<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly templates = new Map<string, BlockTemplate<TBlock>>();

  constructor(templates: BlockTemplate<TBlock>[] = []) {
    for (const template of templates) {
      this.register(template);
    }
  }

  register(template: BlockTemplate<TBlock>): void {
    if (this.templates.has(template.id)) {
      throw new Error(`Template "${template.id}" is already registered`);
    }

    this.templates.set(template.id, cloneValue(template));
  }

  unregister(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  has(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  get(templateId: string): BlockTemplate<TBlock> | undefined {
    const template = this.templates.get(templateId);
    return template ? cloneValue(template) : undefined;
  }

  list(): BlockTemplate<TBlock>[] {
    return Array.from(this.templates.values()).map((template) => cloneValue(template));
  }
}

export interface ApplyBlockTemplateOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  state: EditorStateAdapter<TBlock>;
  template: BlockTemplate<TBlock>;
  index?: number;
}

export function applyBlockTemplate<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(options: ApplyBlockTemplateOptions<TBlock>): TBlock[] {
  const now = new Date().toISOString();
  const clonedBlocks = options.template.blocks.map((block) => {
    const nextId = createGeneratedId(block.type);
    return {
      ...cloneValue(block),
      id: nextId,
      createdAt: now,
      updatedAt: now,
    };
  });

  let insertIndex = options.index;
  if (insertIndex === undefined) {
    const focusedBlockId = options.state.getSnapshot().focusedBlockId;
    if (!focusedBlockId) {
      insertIndex = options.state.getSnapshot().document.blocks.length;
    } else {
      const focusedIndex = options.state
        .getSnapshot()
        .document.blocks.findIndex((block) => block.id === focusedBlockId);
      insertIndex = focusedIndex >= 0 ? focusedIndex + 1 : options.state.getSnapshot().document.blocks.length;
    }
  }

  let cursor = insertIndex;
  for (const block of clonedBlocks) {
    options.state.insertBlock(block as TBlock, cursor);
    cursor += 1;
  }

  return clonedBlocks as TBlock[];
}

export function createDefaultBlockTemplates(): BlockTemplate<Block<BlockData>>[] {
  const now = new Date().toISOString();
  const createTextBlock = (id: string, type: string, data: Record<string, unknown>) => ({
    id,
    type,
    data,
    createdAt: now,
    updatedAt: now,
  });

  return [
    createBlockTemplate({
      id: "template.intro",
      title: "Intro section",
      description: "Heading + introductory paragraph",
      blocks: [
        createTextBlock("template-intro-heading", "heading", {
          text: "Section title",
          level: 2,
        }),
        createTextBlock("template-intro-text", "text", {
          text: "Add your opening context here.",
        }),
      ],
    }),
    createBlockTemplate({
      id: "template.cta",
      title: "Call to action",
      description: "Callout + link pair",
      blocks: [
        createTextBlock("template-cta-callout", "callout", {
          variant: "info",
          title: "Next step",
          body: "Guide readers to continue.",
        }),
        createTextBlock("template-cta-link", "link", {
          text: "Read more",
          url: "https://example.com",
          openInNewTab: true,
        }),
      ],
    }),
  ];
}

export function createBlockTemplateRegistry<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(templates: BlockTemplate<TBlock>[] = []): BlockTemplateRegistry<TBlock> {
  return new BlockTemplateRegistry<TBlock>(templates);
}
