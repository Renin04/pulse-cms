import type { Block } from "../../packages/core/src/types/block";
import { EventBus } from "../../packages/core/src/events/EventBus";
import type { CoreEventPayloadMap } from "../../packages/core/src/types/event";
import {
  createBlockActionMenu,
  createBlockInspector,
  createBlockContextMenu,
  createBlockDnDController,
  createBlockInteractionController,
  createCommandPalette,
  createCommandRegistry,
  createDefaultShortcutBindings,
  createExtendedBlockShortcutBindings,
  createInteractiveCreativeShortcutBindings,
  createPhase2ExpansionBlockShortcutBindings,
  createEditorRoot,
  createEditorClipboardController,
  createEventLoggerPanel,
  createEditorSaveController,
  createEditorStateAdapter,
  createFloatingToolbar,
  createSelectionContextMenu,
  createShortcutRegistry,
  registerBlockActionCommands,
  registerExtendedBlockCommands,
  registerInteractiveCreativeBlockCommands,
  registerPhase2ExpansionBlockCommands,
  registerFormattingCommands,
  type BlockActionMenu,
  type BlockInspector,
  type BlockDnDController,
  type EditorContextMenu,
  type EditorCommandPalette,
  type EditorCommandRegistry,
  type EditorClipboardController,
  type EditorRoot,
  type EventLoggerPanel,
  type EditorSaveController,
  type EditorStateAdapter,
  type FloatingToolbar,
  type ShortcutRegistry,
} from "../../packages/editor/src";

interface PlaygroundTextBlockData extends Record<string, unknown> {
  text: string;
}

type PlaygroundTextBlock = Block<PlaygroundTextBlockData>;

function createSeedBlock(id: string, text: string): PlaygroundTextBlock {
  const timestamp = new Date().toISOString();

  return {
    id,
    type: "text",
    data: {
      text,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export interface EditorPlaygroundFixture {
  state: EditorStateAdapter<PlaygroundTextBlock>;
  editor: EditorRoot<PlaygroundTextBlock>;
  registry: EditorCommandRegistry<PlaygroundTextBlock>;
  palette: EditorCommandPalette<PlaygroundTextBlock>;
  shortcuts: ShortcutRegistry<PlaygroundTextBlock>;
  toolbar: FloatingToolbar<PlaygroundTextBlock>;
  blockContextMenu: EditorContextMenu<PlaygroundTextBlock>;
  selectionContextMenu: EditorContextMenu<PlaygroundTextBlock>;
  blockActionMenu: BlockActionMenu<PlaygroundTextBlock>;
  dnd: BlockDnDController<PlaygroundTextBlock>;
  saveController: EditorSaveController<PlaygroundTextBlock>;
  clipboard: EditorClipboardController<PlaygroundTextBlock>;
  blockInspector: BlockInspector<PlaygroundTextBlock>;
  eventLogger: EventLoggerPanel<PlaygroundTextBlock>;
}

export function createEditorPlaygroundFixture(): EditorPlaygroundFixture {
  const state = createEditorStateAdapter<PlaygroundTextBlock>({
    document: {
      id: "playground-doc",
      metadata: {
        title: "Pulse playground",
      },
      blocks: [
        createSeedBlock("playground-b1", "Welcome to Pulse editor playground"),
        createSeedBlock("playground-b2", "Use commands or keyboard flows to move focus"),
      ],
    },
  });
  const eventBus = new EventBus<CoreEventPayloadMap>();
  const eventLogger = createEventLoggerPanel<PlaygroundTextBlock>({
    state,
    eventBus,
    maxEntries: 60,
  });

  const editor = createEditorRoot<PlaygroundTextBlock>({
    state,
    id: "pulse-playground-editor",
  });

  const registry = createCommandRegistry<PlaygroundTextBlock>({
    commands: [
      {
        id: "insert.heading",
        title: "Insert heading",
        category: "Blocks",
        menuPath: ["insert", "text"],
        slashTrigger: "heading",
        execute(commandContext) {
          commandContext.state.insertBlock(
            createSeedBlock("playground-generated-heading", "Generated heading block"),
          );
        },
      },
      {
        id: "insert.image",
        title: "Insert image",
        category: "Media",
        menuPath: ["insert", "media"],
        slashTrigger: "image",
        execute(commandContext) {
          commandContext.state.insertBlock(
            createSeedBlock("playground-generated-image", "Generated image placeholder"),
          );
        },
      },
    ],
    recentCommandIds: ["insert.heading"],
  });
  registerFormattingCommands(registry);
  registerExtendedBlockCommands(registry);
  registerInteractiveCreativeBlockCommands(registry);
  registerPhase2ExpansionBlockCommands(registry);
  registerBlockActionCommands(registry);

  const palette = createCommandPalette<PlaygroundTextBlock>({
    registry,
  });
  palette.openWithQuery("ins", { state });

  const shortcuts = createShortcutRegistry<PlaygroundTextBlock>({
    commandRegistry: registry,
    platform: "windows",
  });
  for (const binding of createDefaultShortcutBindings<PlaygroundTextBlock>()) {
    if (registry.has(binding.commandId)) {
      shortcuts.register(binding);
    }
  }
  for (const binding of createExtendedBlockShortcutBindings<PlaygroundTextBlock>()) {
    if (registry.has(binding.commandId)) {
      shortcuts.register(binding);
    }
  }
  for (const binding of createInteractiveCreativeShortcutBindings<PlaygroundTextBlock>()) {
    if (registry.has(binding.commandId)) {
      shortcuts.register(binding);
    }
  }
  for (const binding of createPhase2ExpansionBlockShortcutBindings<PlaygroundTextBlock>()) {
    if (registry.has(binding.commandId)) {
      shortcuts.register(binding);
    }
  }

  state.setSelectionRange({
    start: { blockId: "playground-b1", offset: 0 },
    end: { blockId: "playground-b1", offset: 5 },
  });
  const toolbar = createFloatingToolbar({
    state,
    commandRegistry: registry,
  });
  const blockContextMenu = createBlockContextMenu({
    state,
    commandRegistry: registry,
  });
  blockContextMenu.openForBlock("playground-b2");

  const selectionContextMenu = createSelectionContextMenu({
    state,
    commandRegistry: registry,
  });
  selectionContextMenu.openForSelection();

  const interactions = createBlockInteractionController();
  const blockActionMenu = createBlockActionMenu({
    state,
    commandRegistry: registry,
    interactions,
  });
  blockActionMenu.hover("playground-b2");

  const dnd = createBlockDnDController({
    state,
  });
  dnd.startDrag("playground-b2");
  dnd.updateDropIndex(0);

  const saveController = createEditorSaveController({
    state,
    storageKey: "playground-doc",
    autosave: {
      enabled: true,
      debounceMs: 800,
    },
    eventBus,
  });
  const clipboard = createEditorClipboardController({
    state,
  });
  const blockInspector = createBlockInspector({
    state,
  });

  eventLogger.record({
    type: "playground:fixture-ready",
    payload: {
      focusedBlockId: state.getSnapshot().focusedBlockId,
      blockCount: state.getSnapshot().document.blocks.length,
    },
  });

  return {
    state,
    editor,
    registry,
    palette,
    shortcuts,
    toolbar,
    blockContextMenu,
    selectionContextMenu,
    blockActionMenu,
    dnd,
    saveController,
    clipboard,
    blockInspector,
    eventLogger,
  };
}

export function renderEditorPlaygroundHtml(): string {
  const fixture = createEditorPlaygroundFixture();

  return [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    "    <title>Pulse Editor Playground</title>",
    "  </head>",
    "  <body>",
    "    <h1>Pulse editor shell playground</h1>",
    `    ${fixture.editor.render()}`,
    `    ${fixture.palette.render()}`,
    `    ${fixture.toolbar.render()}`,
    `    ${fixture.blockContextMenu.render()}`,
    `    ${fixture.selectionContextMenu.render()}`,
    `    ${fixture.blockActionMenu.render()}`,
    `    <pre data-dnd-indicator="true">${JSON.stringify(fixture.dnd.getSnapshot().indicator)}</pre>`,
    `    <pre data-save-status="true">${JSON.stringify(fixture.saveController.getStatus())}</pre>`,
    `    <pre data-clipboard-ready="true">${String(Boolean(fixture.clipboard))}</pre>`,
    `    ${fixture.blockInspector.render()}`,
    `    ${fixture.eventLogger.render()}`,
    "  </body>",
    "</html>",
  ].join("\n");
}
