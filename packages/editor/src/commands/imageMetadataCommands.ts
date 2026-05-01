import type { Block, BlockData } from "../../../core/src/types/block";
import type {
  EditorCommand,
  EditorCommandContext,
  EditorCommandRegistry,
} from "./CommandRegistry";

interface ImageBlockData extends Record<string, unknown> {
  src?: string | null;
  alt?: string;
  title?: string;
  caption?: string;
  credit?: string;
  source?: string;
  license?: string;
}

export const IMAGE_SET_ALT_COMMAND_ID = "editor.image.setAlt";
export const IMAGE_SET_TITLE_COMMAND_ID = "editor.image.setTitle";
export const IMAGE_SET_CAPTION_COMMAND_ID = "editor.image.setCaption";
export const IMAGE_SET_CREDIT_COMMAND_ID = "editor.image.setCredit";
export const IMAGE_SET_SOURCE_COMMAND_ID = "editor.image.setSource";
export const IMAGE_SET_LICENSE_COMMAND_ID = "editor.image.setLicense";
export const IMAGE_EDIT_METADATA_COMMAND_ID = "editor.image.editMetadata";
export const IMAGE_VALIDATE_METADATA_COMMAND_ID = "editor.image.validateMetadata";

function getFocusedImageBlock<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): TBlock | undefined {
  const snapshot = context.state.getSnapshot();
  if (!snapshot.focusedBlockId) {
    return undefined;
  }

  const block = snapshot.document.blocks.find((b) => b.id === snapshot.focusedBlockId);
  if (!block || block.type !== "image") {
    return undefined;
  }

  return block;
}

function updateImageMetadata<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
  updates: Partial<ImageBlockData>,
): void {
  const block = getFocusedImageBlock(context);
  if (!block) return;

  const timestamp = new Date().toISOString();
  const data = block.data as ImageBlockData;

  context.state.updateBlock(block.id, (b) => ({
    ...b,
    data: {
      ...data,
      ...updates,
    },
    updatedAt: timestamp,
  }) as TBlock);
}

function isImageBlockFocused<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): boolean {
  return getFocusedImageBlock(context) !== undefined;
}

export interface ImageMetadataValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
}

export function validateImageMetadata(data: ImageBlockData): ImageMetadataValidationResult {
  const errors: Array<{ field: string; message: string }> = [];
  const warnings: Array<{ field: string; message: string }> = [];

  // Alt text is required for accessibility
  if (!data.alt || data.alt.trim().length === 0) {
    errors.push({ field: "alt", message: "Alt text is required for accessibility" });
  }

  // Alt text quality checks
  if (data.alt) {
    const altLower = data.alt.toLowerCase().trim();
    if (altLower.startsWith("image of") || altLower.startsWith("picture of")) {
      warnings.push({
        field: "alt",
        message: "Alt text should not start with 'image of' or 'picture of'",
      });
    }
    if (data.alt.length > 125) {
      warnings.push({
        field: "alt",
        message: "Alt text is very long (over 125 characters)",
      });
    }
  }

  // Source should be a valid URL if provided
  if (data.source && data.source.trim().length > 0) {
    try {
      new URL(data.source);
    } catch {
      warnings.push({ field: "source", message: "Source should be a valid URL" });
    }
  }

  // License recommendations
  if (!data.license || data.license.trim().length === 0) {
    warnings.push({
      field: "license",
      message: "Consider adding a license for legal clarity",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function createImageMetadataCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorCommand<TBlock>[] {
  return [
    {
      id: IMAGE_SET_ALT_COMMAND_ID,
      title: "Set Image Alt Text",
      description: "Set or update the alt text for accessibility",
      category: "Media",
      menuPath: ["media", "image", "metadata"],
      slashTrigger: "image alt",
      aliases: ["alt text", "alternative text", "متن جایگزین"],
      keywords: ["image", "accessibility", "a11y", "description"],
      execute(context) {
        // Dispatch event for UI to prompt for alt text
        if (typeof window !== "undefined") {
          const block = getFocusedImageBlock(context);
          window.dispatchEvent(
            new CustomEvent("pulse:image:editAlt", {
              detail: {
                blockId: block?.id,
                currentValue: (block?.data as ImageBlockData)?.alt ?? "",
              },
            }),
          );
        }
      },
      isAvailable: isImageBlockFocused,
    },
    {
      id: IMAGE_SET_TITLE_COMMAND_ID,
      title: "Set Image Title",
      description: "Set the image title (tooltip text)",
      category: "Media",
      menuPath: ["media", "image", "metadata"],
      slashTrigger: "image title",
      aliases: ["title", "tooltip", "عنوان"],
      keywords: ["image", "title", "tooltip"],
      execute(context) {
        if (typeof window !== "undefined") {
          const block = getFocusedImageBlock(context);
          window.dispatchEvent(
            new CustomEvent("pulse:image:editTitle", {
              detail: {
                blockId: block?.id,
                currentValue: (block?.data as ImageBlockData)?.title ?? "",
              },
            }),
          );
        }
      },
      isAvailable: isImageBlockFocused,
    },
    {
      id: IMAGE_SET_CAPTION_COMMAND_ID,
      title: "Set Image Caption",
      description: "Set or update the image caption",
      category: "Media",
      menuPath: ["media", "image", "metadata"],
      slashTrigger: "image caption",
      aliases: ["caption", "description", "زیرنویس"],
      keywords: ["image", "caption", "description"],
      execute(context) {
        if (typeof window !== "undefined") {
          const block = getFocusedImageBlock(context);
          window.dispatchEvent(
            new CustomEvent("pulse:image:editCaption", {
              detail: {
                blockId: block?.id,
                currentValue: (block?.data as ImageBlockData)?.caption ?? "",
              },
            }),
          );
        }
      },
      isAvailable: isImageBlockFocused,
    },
    {
      id: IMAGE_SET_CREDIT_COMMAND_ID,
      title: "Set Image Credit",
      description: "Set the photographer or creator credit",
      category: "Media",
      menuPath: ["media", "image", "metadata"],
      slashTrigger: "image credit",
      aliases: ["credit", "photographer", "creator", "اعتبار"],
      keywords: ["image", "credit", "attribution", "photographer"],
      execute(context) {
        if (typeof window !== "undefined") {
          const block = getFocusedImageBlock(context);
          window.dispatchEvent(
            new CustomEvent("pulse:image:editCredit", {
              detail: {
                blockId: block?.id,
                currentValue: (block?.data as ImageBlockData)?.credit ?? "",
              },
            }),
          );
        }
      },
      isAvailable: isImageBlockFocused,
    },
    {
      id: IMAGE_SET_SOURCE_COMMAND_ID,
      title: "Set Image Source",
      description: "Set the source URL or reference",
      category: "Media",
      menuPath: ["media", "image", "metadata"],
      slashTrigger: "image source",
      aliases: ["source", "url", "reference", "منبع"],
      keywords: ["image", "source", "url", "link"],
      execute(context) {
        if (typeof window !== "undefined") {
          const block = getFocusedImageBlock(context);
          window.dispatchEvent(
            new CustomEvent("pulse:image:editSource", {
              detail: {
                blockId: block?.id,
                currentValue: (block?.data as ImageBlockData)?.source ?? "",
              },
            }),
          );
        }
      },
      isAvailable: isImageBlockFocused,
    },
    {
      id: IMAGE_SET_LICENSE_COMMAND_ID,
      title: "Set Image License",
      description: "Set the usage license",
      category: "Media",
      menuPath: ["media", "image", "metadata"],
      slashTrigger: "image license",
      aliases: ["license", "copyright", "مجوز"],
      keywords: ["image", "license", "copyright", "usage"],
      execute(context) {
        if (typeof window !== "undefined") {
          const block = getFocusedImageBlock(context);
          window.dispatchEvent(
            new CustomEvent("pulse:image:editLicense", {
              detail: {
                blockId: block?.id,
                currentValue: (block?.data as ImageBlockData)?.license ?? "",
              },
            }),
          );
        }
      },
      isAvailable: isImageBlockFocused,
    },
    {
      id: IMAGE_EDIT_METADATA_COMMAND_ID,
      title: "Edit Image Metadata",
      description: "Open the image metadata editor",
      category: "Media",
      menuPath: ["media", "image"],
      slashTrigger: "image metadata",
      aliases: ["image info", "image properties", "اطلاعات تصویر"],
      keywords: ["image", "metadata", "properties", "info"],
      execute(context) {
        if (typeof window !== "undefined") {
          const block = getFocusedImageBlock(context);
          window.dispatchEvent(
            new CustomEvent("pulse:image:editMetadata", {
              detail: {
                blockId: block?.id,
                currentData: block?.data as ImageBlockData,
              },
            }),
          );
        }
      },
      isAvailable: isImageBlockFocused,
    },
    {
      id: IMAGE_VALIDATE_METADATA_COMMAND_ID,
      title: "Validate Image Metadata",
      description: "Check image metadata for accessibility and completeness",
      category: "Media",
      menuPath: ["media", "image"],
      slashTrigger: "validate image",
      aliases: ["check image", "image accessibility", "اعتبارسنجی تصویر"],
      keywords: ["image", "validate", "accessibility", "a11y", "check"],
      execute(context) {
        const block = getFocusedImageBlock(context);
        if (!block) return;

        const data = block.data as ImageBlockData;
        const result = validateImageMetadata(data);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:image:validationResult", {
              detail: {
                blockId: block.id,
                result,
              },
            }),
          );
        }
      },
      isAvailable: isImageBlockFocused,
    },
  ];
}

export function registerImageMetadataCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(registry: EditorCommandRegistry<TBlock>): EditorCommand<TBlock>[] {
  const commands = createImageMetadataCommands<TBlock>();
  const registered: EditorCommand<TBlock>[] = [];

  for (const command of commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
      registered.push(command);
    }
  }

  return registered;
}

// Re-export for convenience
export { getFocusedImageBlock, updateImageMetadata };
