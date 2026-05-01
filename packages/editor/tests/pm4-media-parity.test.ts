import { describe, expect, it } from "vitest";

import type { Block } from "../../core/src/types/block";
import {
  createCommandRegistry,
  createEditorStateAdapter,
  createShortcutRegistry,
  registerImageMetadataCommands,
  createImageMetadataShortcutBindings,
  IMAGE_SET_ALT_COMMAND_ID,
  IMAGE_SET_TITLE_COMMAND_ID,
  IMAGE_SET_CAPTION_COMMAND_ID,
  IMAGE_SET_CREDIT_COMMAND_ID,
  IMAGE_SET_SOURCE_COMMAND_ID,
  IMAGE_SET_LICENSE_COMMAND_ID,
  IMAGE_EDIT_METADATA_COMMAND_ID,
  IMAGE_VALIDATE_METADATA_COMMAND_ID,
  validateImageMetadata,
} from "../src";

interface ImageBlockData extends Record<string, unknown> {
  src: string | null;
  alt: string;
  title?: string;
  width: number;
  height: number;
  caption?: string;
  credit?: string;
  source?: string;
  license?: string;
  fit: "cover" | "contain" | "fill";
  status: "idle" | "uploading" | "ready" | "error";
}

type EditorBlock = Block<ImageBlockData>;

function createImageBlock(
  id: string,
  data: Partial<ImageBlockData> = {},
): EditorBlock {
  const timestamp = new Date().toISOString();

  return {
    id,
    type: "image",
    data: {
      src: "https://example.com/image.jpg",
      alt: "Test image",
      width: 800,
      height: 600,
      fit: "cover",
      status: "ready",
      ...data,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createEditorRuntime(initialBlocks: EditorBlock[] = [createImageBlock("img1")]) {
  const state = createEditorStateAdapter<EditorBlock>({
    document: {
      id: "test-doc",
      blocks: initialBlocks,
    },
  });
  const commandRegistry = createCommandRegistry<EditorBlock>();
  registerImageMetadataCommands(commandRegistry);

  return { state, commandRegistry };
}

describe("PM4-3: Media Parity Core - Image Metadata", () => {
  it("registers all image metadata commands", () => {
    const { commandRegistry } = createEditorRuntime();

    expect(commandRegistry.has(IMAGE_SET_ALT_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(IMAGE_SET_TITLE_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(IMAGE_SET_CAPTION_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(IMAGE_SET_CREDIT_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(IMAGE_SET_SOURCE_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(IMAGE_SET_LICENSE_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(IMAGE_EDIT_METADATA_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(IMAGE_VALIDATE_METADATA_COMMAND_ID)).toBe(true);
  });

  it("image metadata commands are available when image block is focused", () => {
    const { state, commandRegistry } = createEditorRuntime();
    const validateCmd = commandRegistry.get(IMAGE_VALIDATE_METADATA_COMMAND_ID)!;

    // Image block is auto-focused on state creation (first block is auto-focused)
    expect(validateCmd.isAvailable?.({ state })).toBe(true);
  });

  it("image metadata commands are not available for non-image blocks", () => {
    const textBlock: Block<Record<string, unknown>> = {
      id: "text1",
      type: "text",
      data: { text: "Hello", marks: {} },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { state, commandRegistry } = createEditorRuntime([createImageBlock("img1"), textBlock as EditorBlock]);
    const validateCmd = commandRegistry.get(IMAGE_VALIDATE_METADATA_COMMAND_ID)!;

    // Focus text block
    state.setFocusedBlock("text1");
    expect(validateCmd.isAvailable?.({ state })).toBe(false);

    // Focus image block
    state.setFocusedBlock("img1");
    expect(validateCmd.isAvailable?.({ state })).toBe(true);
  });
});

describe("PM4-3: Image Metadata Validation", () => {
  it("validates required alt text", () => {
    const result = validateImageMetadata({} as ImageBlockData);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "alt",
      message: "Alt text is required for accessibility",
    });
  });

  it("passes validation with proper alt text", () => {
    const result = validateImageMetadata({
      alt: "A beautiful sunset over the mountains",
    } as ImageBlockData);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("warns about alt text starting with 'image of'", () => {
    const result = validateImageMetadata({
      alt: "image of a sunset",
    } as ImageBlockData);

    expect(result.warnings).toContainEqual({
      field: "alt",
      message: "Alt text should not start with 'image of' or 'picture of'",
    });
  });

  it("warns about alt text starting with 'picture of'", () => {
    const result = validateImageMetadata({
      alt: "Picture of a cat",
    } as ImageBlockData);

    expect(result.warnings).toContainEqual({
      field: "alt",
      message: "Alt text should not start with 'image of' or 'picture of'",
    });
  });

  it("warns about very long alt text", () => {
    const longAlt = "a".repeat(130);
    const result = validateImageMetadata({
      alt: longAlt,
    } as ImageBlockData);

    expect(result.warnings).toContainEqual({
      field: "alt",
      message: "Alt text is very long (over 125 characters)",
    });
  });

  it("warns about invalid source URL", () => {
    const result = validateImageMetadata({
      alt: "Test image",
      source: "not-a-valid-url",
    } as ImageBlockData);

    expect(result.warnings).toContainEqual({
      field: "source",
      message: "Source should be a valid URL",
    });
  });

  it("accepts valid source URL", () => {
    const result = validateImageMetadata({
      alt: "Test image",
      source: "https://example.com/source",
    } as ImageBlockData);

    const sourceWarnings = result.warnings.filter(w => w.field === "source");
    expect(sourceWarnings).toHaveLength(0);
  });

  it("warns about missing license", () => {
    const result = validateImageMetadata({
      alt: "Test image",
    } as ImageBlockData);

    expect(result.warnings).toContainEqual({
      field: "license",
      message: "Consider adding a license for legal clarity",
    });
  });

  it("does not warn about license when provided", () => {
    const result = validateImageMetadata({
      alt: "Test image",
      license: "CC BY 4.0",
    } as ImageBlockData);

    const licenseWarnings = result.warnings.filter(w => w.field === "license");
    expect(licenseWarnings).toHaveLength(0);
  });

  it("returns both errors and warnings when applicable", () => {
    const result = validateImageMetadata({
      alt: "image of something",
      source: "bad-url",
    } as ImageBlockData);

    expect(result.errors).toHaveLength(0); // alt is present
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
    expect(result.warnings.some(w => w.field === "alt")).toBe(true);
    expect(result.warnings.some(w => w.field === "source")).toBe(true);
    expect(result.warnings.some(w => w.field === "license")).toBe(true);
  });
});

describe("PM4-3: Image Metadata Shortcuts", () => {
  it("registers image metadata shortcuts without conflicts", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createImageMetadataShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcuts.register(binding);
    }

    expect(shortcuts.getConflicts()).toHaveLength(0);
  });

  it("executes validate metadata via shortcut", async () => {
    const { state, commandRegistry } = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createImageMetadataShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcuts.register(binding);
    }

    state.setFocusedBlock("img1");

    // Ctrl+Shift+V for validate
    const result = await shortcuts.dispatch(
      { key: "v", ctrlKey: true, shiftKey: true },
      { state },
    );

    expect(result.type).toBe("executed");
    expect(result.commandId).toBe(IMAGE_VALIDATE_METADATA_COMMAND_ID);
  });

  it("executes edit metadata via shortcut", async () => {
    const { state, commandRegistry } = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createImageMetadataShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcuts.register(binding);
    }

    state.setFocusedBlock("img1");

    // Ctrl+Shift+M for edit metadata
    const result = await shortcuts.dispatch(
      { key: "m", ctrlKey: true, shiftKey: true },
      { state },
    );

    expect(result.type).toBe("executed");
    expect(result.commandId).toBe(IMAGE_EDIT_METADATA_COMMAND_ID);
  });

  it("executes set alt via shortcut", async () => {
    const { state, commandRegistry } = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createImageMetadataShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcuts.register(binding);
    }

    state.setFocusedBlock("img1");

    // Ctrl+Shift+A for set alt
    const result = await shortcuts.dispatch(
      { key: "a", ctrlKey: true, shiftKey: true },
      { state },
    );

    expect(result.type).toBe("executed");
    expect(result.commandId).toBe(IMAGE_SET_ALT_COMMAND_ID);
  });
});

describe("PM4-3: Integration - Commands have proper metadata", () => {
  it("commands have proper titles and categories", () => {
    const { commandRegistry } = createEditorRuntime();

    const altCmd = commandRegistry.get(IMAGE_SET_ALT_COMMAND_ID)!;
    expect(altCmd.title).toBe("Set Image Alt Text");
    expect(altCmd.category).toBe("Media");
    expect(altCmd.menuPath).toEqual(["media", "image", "metadata"]);

    const validateCmd = commandRegistry.get(IMAGE_VALIDATE_METADATA_COMMAND_ID)!;
    expect(validateCmd.title).toBe("Validate Image Metadata");
    expect(validateCmd.slashTrigger).toBe("validate image");

    const editCmd = commandRegistry.get(IMAGE_EDIT_METADATA_COMMAND_ID)!;
    expect(editCmd.title).toBe("Edit Image Metadata");
    expect(editCmd.aliases).toContain("image info");
  });

  it("commands have Persian aliases for accessibility", () => {
    const { commandRegistry } = createEditorRuntime();

    const altCmd = commandRegistry.get(IMAGE_SET_ALT_COMMAND_ID)!;
    expect(altCmd.aliases).toContain("متن جایگزین");

    const creditCmd = commandRegistry.get(IMAGE_SET_CREDIT_COMMAND_ID)!;
    expect(creditCmd.aliases).toContain("اعتبار");
  });
});
