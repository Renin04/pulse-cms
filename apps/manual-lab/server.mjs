import { createServer } from "node:http";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EventBus, createInMemoryStorageDriver } from "../../dist/packages/core/src/index.js";
import {
  createBlockActionMenu,
  createBlockContextMenu,
  createBlockDnDController,
  createBlockInspector,
  createBlockInteractionController,
  createCommandPalette,
  createCommandRegistry,
  createDefaultShortcutBindings,
  createEditorClipboardController,
  createEditorRoot,
  createEditorSaveController,
  createEditorStateAdapter,
  createEventLoggerPanel,
  createExtendedBlockShortcutBindings,
  createFloatingToolbar,
  createInMemoryClipboardDriver,
  createInteractiveCreativeShortcutBindings,
  createPhase2ExpansionBlockShortcutBindings,
  createSelectionContextMenu,
  createShortcutRegistry,
  registerBlockActionCommands,
  registerClipboardCommands,
  registerExtendedBlockCommands,
  registerFormattingCommands,
  registerInteractiveCreativeBlockCommands,
  registerPhase2ExpansionBlockCommands,
} from "../../dist/packages/editor/src/index.js";

const HOST = process.env.PULSE_LAB_HOST ?? "127.0.0.1";
const PORT = Number.parseInt(process.env.PULSE_LAB_PORT ?? "4177", 10);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

function ensureBuildArtifacts() {
  const expectedFile = path.join(projectRoot, "dist", "packages", "editor", "src", "index.js");
  if (!existsSync(expectedFile)) {
    throw new Error(
      `Build artifacts not found at ${expectedFile}. Run \"npm run build\" before starting the manual lab server.`,
    );
  }
}

function createSeedBlock(id, text) {
  const timestamp = new Date().toISOString();

  return {
    id,
    type: "text",
    data: {
      text,
      marks: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
      },
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function parseShortcutCombo(combo) {
  const tokens = String(combo)
    .split("+")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  const input = {
    key: "",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
  };

  for (const token of tokens) {
    if (token === "ctrl" || token === "control" || token === "mod") {
      input.ctrlKey = true;
      continue;
    }

    if (token === "cmd" || token === "command" || token === "meta") {
      input.metaKey = true;
      continue;
    }

    if (token === "alt" || token === "option") {
      input.altKey = true;
      continue;
    }

    if (token === "shift") {
      input.shiftKey = true;
      continue;
    }

    input.key = token === "space" ? " " : token;
  }

  if (!input.key) {
    throw new Error(`Shortcut combo \"${combo}\" has no primary key`);
  }

  return input;
}

function createRuntime() {
  const state = createEditorStateAdapter({
    document: {
      id: "manual-lab-doc",
      metadata: {
        title: "Pulse Manual Lab",
      },
      blocks: [
        createSeedBlock("lab-b1", "Welcome to the Pulse Manual Lab"),
        createSeedBlock("lab-b2", "Type / or \\ then try nested command suggestions"),
        createSeedBlock("lab-b3", "متن فارسی و English together are both welcome here"),
      ],
    },
  });

  const eventBus = new EventBus();
  const registry = createCommandRegistry({
    commands: [
      {
        id: "insert.paragraph",
        title: "Insert paragraph",
        description: "Insert a plain text paragraph block",
        category: "Insert",
        menuPath: ["insert", "text"],
        slashTrigger: "paragraph",
        aliases: ["text", "پاراگراف"],
        keywords: ["plain", "body"],
        execute(context) {
          const timestamp = new Date().toISOString();
          context.state.insertBlock({
            id: `lab-paragraph-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: "text",
            data: {
              text: "New paragraph",
              marks: {
                bold: false,
                italic: false,
                underline: false,
                code: false,
              },
            },
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        },
      },
    ],
    recentCommandIds: ["insert.paragraph"],
  });

  registerFormattingCommands(registry);
  registerExtendedBlockCommands(registry);
  registerInteractiveCreativeBlockCommands(registry);
  registerPhase2ExpansionBlockCommands(registry);
  registerBlockActionCommands(registry);
  registerClipboardCommands(registry);

  const shortcuts = createShortcutRegistry({
    commandRegistry: registry,
    platform: "windows",
  });
  for (const binding of createDefaultShortcutBindings()) {
    if (registry.has(binding.commandId)) {
      shortcuts.register(binding);
    }
  }
  for (const binding of createExtendedBlockShortcutBindings()) {
    if (registry.has(binding.commandId)) {
      shortcuts.register(binding);
    }
  }
  for (const binding of createInteractiveCreativeShortcutBindings()) {
    if (registry.has(binding.commandId)) {
      shortcuts.register(binding);
    }
  }
  for (const binding of createPhase2ExpansionBlockShortcutBindings()) {
    if (registry.has(binding.commandId)) {
      shortcuts.register(binding);
    }
  }

  const palette = createCommandPalette({
    registry,
    maxResults: 14,
  });

  const editor = createEditorRoot({
    state,
    id: "manual-lab-editor",
    emptyStateLabel: "No blocks yet. Use Insert commands to get started.",
  });

  const blockContextMenu = createBlockContextMenu({
    state,
    commandRegistry: registry,
  });
  const selectionContextMenu = createSelectionContextMenu({
    state,
    commandRegistry: registry,
  });

  const interactions = createBlockInteractionController();
  const blockActionMenu = createBlockActionMenu({
    state,
    commandRegistry: registry,
    interactions,
  });

  const dnd = createBlockDnDController({
    state,
  });

  const storageDriver = createInMemoryStorageDriver();
  const saveController = createEditorSaveController({
    state,
    storageKey: "manual-lab-save",
    storageDriver,
    autosave: {
      enabled: true,
      debounceMs: 900,
    },
    eventBus,
  });

  const clipboardDriver = createInMemoryClipboardDriver();
  const clipboard = createEditorClipboardController({
    state,
    driver: clipboardDriver,
  });

  const toolbar = createFloatingToolbar({
    state,
    commandRegistry: registry,
  });

  const blockInspector = createBlockInspector({
    state,
    title: "Focused block inspector",
  });

  const eventLogger = createEventLoggerPanel({
    state,
    eventBus,
    maxEntries: 120,
  });

  state.setFocusedBlock("lab-b2");
  blockActionMenu.hover("lab-b2");

  return {
    state,
    eventBus,
    registry,
    shortcuts,
    palette,
    editor,
    blockContextMenu,
    selectionContextMenu,
    blockActionMenu,
    dnd,
    saveController,
    clipboard,
    toolbar,
    blockInspector,
    eventLogger,
  };
}

let runtime = createRuntime();

function createCommandContext() {
  return {
    state: runtime.state,
    onSaveDocument: async () => runtime.saveController.saveNow(),
    clipboard: {
      copySelectedBlocks: () => runtime.clipboard.copySelectedBlocks(),
      pasteBlocks: (options) => runtime.clipboard.pasteBlocks(options),
    },
  };
}

function toBlockSummary(block) {
  const text = typeof block.data?.text === "string" ? block.data.text : JSON.stringify(block.data);
  return {
    id: block.id,
    type: block.type,
    text,
    parentId: block.parentId ?? null,
  };
}

function createSnapshot(statusMessage = "Ready") {
  const stateSnapshot = runtime.state.getSnapshot();
  const paletteState = runtime.palette.getState();
  const blockMenuState = runtime.blockContextMenu.getState();
  const selectionMenuState = runtime.selectionContextMenu.getState();
  const blockActionState = runtime.blockActionMenu.getState();

  return {
    statusMessage,
    now: new Date().toISOString(),
    document: {
      id: stateSnapshot.document.id,
      focusedBlockId: stateSnapshot.focusedBlockId,
      activeBlockIds: stateSnapshot.activeBlockIds,
      selection: stateSnapshot.selection,
      blocks: stateSnapshot.document.blocks.map(toBlockSummary),
      metadata: stateSnapshot.document.metadata,
    },
    commands: runtime.registry.list().map((command) => ({
      id: command.id,
      title: command.title,
      category: command.category ?? "General",
      slashTrigger: command.slashTrigger ?? "",
      menuPath: command.menuPath ?? [],
      aliases: command.aliases ?? [],
    })),
    shortcuts: runtime.shortcuts.list().map((binding) => ({
      id: binding.id,
      combo: binding.combo,
      commandId: binding.commandId,
      description: binding.description ?? "",
    })),
    recentCommands: runtime.registry.getRecentCommandIds(),
    saveStatus: runtime.saveController.getStatus(),
    dnd: runtime.dnd.getSnapshot(),
    palette: {
      state: paletteState,
      html: runtime.palette.render(),
    },
    blockContextMenu: {
      state: blockMenuState,
      html: runtime.blockContextMenu.render(),
    },
    selectionContextMenu: {
      state: selectionMenuState,
      html: runtime.selectionContextMenu.render(),
    },
    blockActionMenu: {
      state: blockActionState,
      html: runtime.blockActionMenu.render(),
    },
    toolbar: {
      state: runtime.toolbar.getState(createCommandContext()),
      html: runtime.toolbar.render(createCommandContext()),
    },
    inspector: {
      snapshot: runtime.blockInspector.getSnapshot(),
      html: runtime.blockInspector.render(),
    },
    eventLogger: {
      filter: runtime.eventLogger.getFilter(),
      entries: runtime.eventLogger.getEntries(),
      html: runtime.eventLogger.render(),
    },
    editorHtml: runtime.editor.render(),
  };
}

async function applyAction(action, payload) {
  const commandContext = createCommandContext();

  switch (action) {
    case "reset": {
      runtime.saveController.dispose();
      runtime.eventLogger.dispose();
      runtime = createRuntime();
      return "Runtime reset to fresh fixture.";
    }
    case "focus": {
      runtime.state.setFocusedBlock(payload.blockId ?? null);
      return `Focused block: ${payload.blockId ?? "none"}`;
    }
    case "updateText": {
      const blockId = payload.blockId;
      const text = String(payload.text ?? "");
      if (!blockId) {
        throw new Error("Missing blockId for updateText action");
      }

      runtime.state.updateBlock(blockId, (block) => {
        if (block.type !== "text") {
          return block;
        }

        return {
          ...block,
          data: {
            ...block.data,
            text,
          },
          updatedAt: new Date().toISOString(),
        };
      });

      return `Updated text block ${blockId}.`;
    }
    case "setSelection": {
      const blockId = payload.blockId;
      const start = Number(payload.start ?? 0);
      const end = Number(payload.end ?? 0);
      if (!blockId) {
        throw new Error("Missing blockId for setSelection action");
      }

      runtime.state.setSelectionRange({
        start: { blockId, offset: start },
        end: { blockId, offset: end },
      });

      return `Selection set on ${blockId} (${start}..${end}).`;
    }
    case "openPalette": {
      const trigger = payload.trigger === "\\" ? "\\" : "/";
      const queryText = String(payload.query ?? "");
      const fullText = `${trigger}${queryText}`;
      runtime.palette.openFromText(fullText, fullText.length, commandContext);
      return `Opened command palette from ${trigger} trigger.`;
    }
    case "paletteKey": {
      const key = String(payload.key ?? "");
      const result = await runtime.palette.handleKey(key, commandContext);
      return `Palette key ${key} -> ${result.type}.`;
    }
    case "executeCommand": {
      const commandId = String(payload.commandId ?? "");
      if (!commandId) {
        throw new Error("Missing commandId for executeCommand action");
      }

      await runtime.registry.execute(commandId, commandContext);
      return `Executed command ${commandId}.`;
    }
    case "dispatchShortcut": {
      const combo = String(payload.combo ?? "");
      const input = parseShortcutCombo(combo);
      const result = await runtime.shortcuts.dispatch(input, commandContext);
      return `Shortcut ${combo} -> ${result.type}.`;
    }
    case "openBlockContext": {
      const blockId = String(payload.blockId ?? "");
      runtime.blockContextMenu.openForBlock(blockId);
      return `Opened block context menu for ${blockId}.`;
    }
    case "openSelectionContext": {
      runtime.selectionContextMenu.openForSelection();
      return "Opened selection context menu.";
    }
    case "executeBlockContext": {
      const commandId = String(payload.commandId ?? "");
      await runtime.blockContextMenu.execute(commandId);
      return `Executed block context command ${commandId}.`;
    }
    case "executeSelectionContext": {
      const commandId = String(payload.commandId ?? "");
      await runtime.selectionContextMenu.execute(commandId);
      return `Executed selection context command ${commandId}.`;
    }
    case "hoverBlockAction": {
      const blockId = payload.blockId ? String(payload.blockId) : null;
      runtime.blockActionMenu.hover(blockId);
      return `Hover state moved to ${blockId ?? "none"}.`;
    }
    case "executeBlockAction": {
      const commandId = String(payload.commandId ?? "");
      await runtime.blockActionMenu.execute(commandId);
      return `Executed block action command ${commandId}.`;
    }
    case "startDnD": {
      const blockId = String(payload.blockId ?? "");
      runtime.dnd.startDrag(blockId);
      return `Started drag for ${blockId}.`;
    }
    case "setDropIndex": {
      const index = Number(payload.index ?? 0);
      runtime.dnd.updateDropIndex(index);
      return `Drop index set to ${index}.`;
    }
    case "drop": {
      runtime.dnd.drop();
      return "Applied drag-and-drop reorder.";
    }
    case "copy": {
      const result = await runtime.clipboard.copySelectedBlocks();
      return result.copied
        ? `Copied ${result.blockIds.length} block(s).`
        : "No eligible blocks selected for copy.";
    }
    case "paste": {
      const mode = payload.mode ?? "insert";
      const result = await runtime.clipboard.pasteBlocks({ mode });
      return result.pasted
        ? `Pasted ${result.blockIds.length} block(s) with mode ${mode}.`
        : "Paste produced no blocks.";
    }
    case "save": {
      const result = await runtime.saveController.saveNow();
      return `Manual save completed at ${result.savedAt}.`;
    }
    case "autosaveFlush": {
      await runtime.saveController.flushAutosave();
      return "Autosave queue flushed.";
    }
    case "setEventFilter": {
      const text = String(payload.text ?? "").trim();
      const source = String(payload.source ?? "").trim();
      runtime.eventLogger.setFilter({
        text: text || undefined,
        sources: source ? [source] : undefined,
      });
      return "Event logger filter updated.";
    }
    case "clearEvents": {
      runtime.eventLogger.clear();
      return "Event logger entries cleared.";
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(payload));
}

function sendHtml(response, html) {
  response.statusCode = 200;
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(html);
}

function renderLitePage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pulse Visual Editor Lab</title>
    <style>
      :root {
        --ink: #1f2937;
        --muted: #6b7280;
        --line: #d7dce2;
        --line-strong: #aab4c0;
        --paper: #ffffff;
        --page: #f4f6f9;
        --brand: #0f766e;
        --brand-soft: #d5f4ef;
        --danger: #b42318;
        --shadow-soft: 0 8px 24px rgba(15, 23, 42, 0.08);
        --shadow-pop: 0 16px 36px rgba(15, 23, 42, 0.14);
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
      }

      body {
        color: var(--ink);
        font-family: "Inter", "Segoe UI", "Noto Sans", "Noto Sans Arabic", sans-serif;
        background:
          radial-gradient(circle at 10% 4%, #fef3c7 0, transparent 24%),
          radial-gradient(circle at 86% 0%, #dbeafe 0, transparent 26%),
          linear-gradient(168deg, #f8fafc 0%, #eef2f7 100%);
      }

      .lab-shell {
        width: min(1080px, calc(100% - 1.4rem));
        margin: 0.9rem auto 1.5rem;
        display: grid;
        gap: 0.8rem;
      }

      .lab-header,
      .lab-status,
      .editor-wrap {
        border: 1px solid var(--line);
        background: var(--paper);
        border-radius: 16px;
        box-shadow: var(--shadow-soft);
      }

      .lab-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.9rem;
        padding: 0.9rem 1rem;
      }

      .lab-header h1 {
        margin: 0;
        font-size: clamp(1.06rem, 2.6vw, 1.45rem);
        letter-spacing: 0.01em;
      }

      .lab-header p {
        margin: 0.3rem 0 0;
        color: var(--muted);
        font-size: 0.9rem;
        max-width: 720px;
      }

      .lab-actions {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        flex-wrap: wrap;
      }

      .ghost-link,
      .lab-actions button {
        appearance: none;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 0.4rem 0.8rem;
        font: inherit;
        font-weight: 600;
        font-size: 0.82rem;
        color: #0f172a;
        background: #ffffff;
        text-decoration: none;
        cursor: pointer;
      }

      .lab-actions button.primary {
        border-color: transparent;
        color: #f8fffe;
        background: linear-gradient(125deg, #0f766e, #0b5e57);
      }

      .lab-actions button.danger {
        border-color: #f0c9c6;
        color: var(--danger);
        background: #fff7f6;
      }

      .editor-wrap {
        padding: 1rem;
      }

      .editor-surface {
        width: min(840px, 100%);
        margin: 0 auto;
        border: 1px solid #e6ebf0;
        border-radius: 18px;
        background: #ffffff;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
        padding: 0.95rem 0.95rem 1.1rem;
      }

      .editor-canvas {
        display: grid;
        gap: 0.5rem;
      }

      .editor-block {
        position: relative;
        padding-inline-start: 2rem;
        border-radius: 11px;
        transition: background 120ms ease, border-color 120ms ease;
        border: 1px solid transparent;
      }

      .editor-block:hover,
      .editor-block.is-active {
        background: #f8fafc;
        border-color: #dce4ec;
      }

      .editor-block-rail {
        position: absolute;
        inset-inline-start: 0.35rem;
        inset-block-start: 0.38rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        opacity: 0;
        transform: translateX(-2px);
        transition: opacity 120ms ease, transform 120ms ease;
      }

      .editor-block:hover .editor-block-rail,
      .editor-block.is-active .editor-block-rail {
        opacity: 1;
        transform: translateX(0);
      }

      .rail-btn {
        appearance: none;
        border: 1px solid #d3dbe5;
        background: #fff;
        color: #334155;
        width: 1.42rem;
        height: 1.42rem;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font: inherit;
        font-size: 0.78rem;
        cursor: pointer;
      }

      .rail-btn:hover {
        border-color: #9fb0c2;
        background: #f8fbff;
      }

      .editor-block-type {
        position: absolute;
        inset-inline-end: 0.45rem;
        inset-block-start: -0.36rem;
        border: 1px solid #d5deea;
        border-radius: 999px;
        background: #f4f8fd;
        color: #556579;
        padding: 0.08rem 0.44rem;
        font-size: 0.64rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }

      .editor-block-content {
        min-height: 1.9rem;
        padding: 0.33rem 0.1rem 0.32rem;
        outline: none;
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.56;
        font-size: 1rem;
        caret-color: #1f2937;
        cursor: text;
        text-align: start;
        unicode-bidi: plaintext;
      }

      .editor-block-content:empty::before {
        content: attr(data-placeholder);
        color: #9aa6b2;
      }

      .editor-block-content[data-empty="false"]:empty::before {
        content: "";
      }

      .lab-status {
        display: grid;
        gap: 0.42rem;
        padding: 0.72rem 0.84rem;
      }

      .status-message {
        font-size: 0.86rem;
        color: #223143;
      }

      .status-message.is-error {
        color: #8e1f1f;
      }

      .status-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.34rem;
      }

      .chip {
        border-radius: 999px;
        border: 1px solid #d7e2ec;
        background: #f8fbff;
        color: #3d4f62;
        padding: 0.12rem 0.52rem;
        font-size: 0.73rem;
      }

      .overlay {
        position: fixed;
        z-index: 30;
        display: none;
        min-width: 290px;
        max-width: min(420px, calc(100vw - 1.4rem));
        border: 1px solid #cad3df;
        border-radius: 12px;
        background: #fff;
        box-shadow: var(--shadow-pop);
      }

      .overlay.open {
        display: block;
      }

      .palette-head {
        padding: 0.45rem 0.6rem 0.4rem;
        border-bottom: 1px solid #e5eaf0;
      }

      .palette-query {
        margin: 0;
        font-size: 0.79rem;
        color: #1e3a57;
        font-family: "Iosevka", "Cascadia Code", "Consolas", monospace;
        text-align: start;
        unicode-bidi: plaintext;
      }

      .palette-breadcrumb {
        margin-top: 0.2rem;
        display: flex;
        gap: 0.2rem;
        flex-wrap: wrap;
      }

      .palette-breadcrumb span {
        border-radius: 999px;
        background: #eef4fb;
        border: 1px solid #d6e1ee;
        color: #42566d;
        font-size: 0.68rem;
        padding: 0.06rem 0.4rem;
      }

      .palette-list {
        max-height: min(350px, 48vh);
        overflow: auto;
        padding: 0.34rem;
        display: grid;
        gap: 0.22rem;
      }

      .palette-item {
        width: 100%;
        border: 1px solid transparent;
        border-radius: 9px;
        background: #fff;
        text-align: start;
        padding: 0.4rem 0.5rem;
        cursor: pointer;
        display: grid;
        gap: 0.14rem;
      }

      .palette-item.is-active {
        border-color: #a4c4ff;
        background: #eff6ff;
      }

      .palette-item-title {
        font-size: 0.82rem;
        color: #1f2f42;
      }

      .palette-item-meta {
        font-size: 0.71rem;
        color: #607188;
        text-align: start;
        unicode-bidi: plaintext;
      }

      .palette-empty {
        color: #6b7280;
        font-size: 0.78rem;
        padding: 0.45rem 0.52rem 0.55rem;
      }

      .quick-menu {
        padding: 0.35rem;
      }

      .quick-menu-title {
        font-size: 0.7rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #6b7280;
        padding: 0.18rem 0.32rem;
      }

      .quick-menu button {
        width: 100%;
        border: 1px solid transparent;
        border-radius: 8px;
        background: #fff;
        color: #203041;
        text-align: start;
        padding: 0.42rem 0.5rem;
        cursor: pointer;
        font: inherit;
        font-size: 0.81rem;
      }

      .quick-menu button:hover {
        background: #f3f8ff;
        border-color: #d2e0f1;
      }

      .selection-toolbar {
        min-width: auto;
        padding: 0.25rem;
        display: none;
        border-radius: 10px;
      }

      .selection-toolbar.open {
        display: flex;
        align-items: center;
        gap: 0.22rem;
      }

      .toolbar-btn {
        border: 1px solid #d8e0ea;
        border-radius: 8px;
        background: #fff;
        color: #1f2937;
        font: inherit;
        font-size: 0.78rem;
        padding: 0.28rem 0.48rem;
        cursor: pointer;
      }

      .toolbar-btn:hover {
        background: #f4f8fc;
      }

      .toolbar-btn[disabled] {
        opacity: 0.45;
        cursor: not-allowed;
      }

      @media (max-width: 800px) {
        .lab-shell {
          width: calc(100% - 0.8rem);
          margin: 0.45rem auto 0.9rem;
        }

        .editor-wrap {
          padding: 0.62rem;
        }

        .editor-surface {
          padding: 0.62rem 0.58rem 0.72rem;
          border-radius: 14px;
        }

        .lab-header {
          padding: 0.76rem 0.72rem;
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <main class="lab-shell">
      <header class="lab-header">
        <div>
          <h1>Pulse Visual Editor Lab</h1>
          <p>
            Real contenteditable surface with slash/backslash command chains, nested Tab/Enter confirmation,
            block quick actions, and floating formatting toolbar.
          </p>
        </div>
        <div class="lab-actions">
          <span id="save-chip" class="chip">Save: pending</span>
          <button id="save-button" class="primary" type="button">Save</button>
          <button id="reset-button" class="danger" type="button">Reset</button>
          <a href="/advanced" class="ghost-link">Advanced</a>
        </div>
      </header>

      <section class="editor-wrap">
        <div class="editor-surface" dir="auto">
          <div id="editor-canvas" class="editor-canvas" aria-label="Pulse visual editor" role="region"></div>
        </div>
      </section>

      <section class="lab-status">
        <div id="status-message" class="status-message">Booting runtime…</div>
        <div class="status-chips">
          <span id="focus-chip" class="chip">Focus: none</span>
          <span id="path-chip" class="chip">Path: root</span>
          <span id="recent-chip" class="chip">Recent: none</span>
        </div>
      </section>
    </main>

    <aside id="palette-popover" class="overlay" aria-label="Command suggestions"></aside>
    <aside id="quick-menu" class="overlay quick-menu" aria-label="Block quick actions"></aside>
    <div id="selection-toolbar" class="overlay selection-toolbar" role="toolbar" aria-label="Formatting toolbar"></div>

    <script>
      (function () {
        const BACKSLASH = String.fromCharCode(92);
        const PALETTE_KEYS = new Set(["Tab", "Enter", "ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Escape"]);

        const elements = {
          canvas: document.getElementById("editor-canvas"),
          palette: document.getElementById("palette-popover"),
          quickMenu: document.getElementById("quick-menu"),
          toolbar: document.getElementById("selection-toolbar"),
          status: document.getElementById("status-message"),
          focusChip: document.getElementById("focus-chip"),
          pathChip: document.getElementById("path-chip"),
          recentChip: document.getElementById("recent-chip"),
          saveChip: document.getElementById("save-chip"),
          saveButton: document.getElementById("save-button"),
          resetButton: document.getElementById("reset-button"),
        };

        const runtime = {
          snapshot: null,
          activeBlockId: null,
          serverFocusedBlockId: null,
          commandAnchor: null,
          paletteItems: [],
          quickMenuBlockId: null,
          quickMenuRect: null,
          textTimers: new Map(),
          selectionTimer: null,
          lastSelectionKey: "",
          selectionRect: null,
          commandTitles: new Map(),
          lastPaletteSignature: "",
        };

        function escapeHtml(value) {
          return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
        }

        function setStatus(message, isError) {
          elements.status.textContent = message;
          elements.status.classList.toggle("is-error", Boolean(isError));
        }

        function toBlockText(block) {
          return typeof block.text === "string" ? block.text : "";
        }

        function toElement(target) {
          if (target instanceof Element) {
            return target;
          }

          if (target && target.nodeType === Node.TEXT_NODE) {
            return target.parentElement;
          }

          return null;
        }

        function closestFromTarget(target, selector) {
          const element = toElement(target);
          return element ? element.closest(selector) : null;
        }

        async function request(action, payload) {
          const response = await fetch("/api/action", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ action, payload: payload || {} }),
          });

          const body = await response.json();
          if (!response.ok) {
            throw new Error(body.error || ("Action " + action + " failed"));
          }

          applySnapshot(body.snapshot);
          return body.snapshot;
        }

        async function syncServerFocus(blockId) {
          if (!blockId || runtime.serverFocusedBlockId === blockId) {
            return;
          }

          const response = await fetch("/api/action", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              action: "focus",
              payload: { blockId },
            }),
          });

          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || "Failed to sync focus");
          }

          runtime.serverFocusedBlockId = blockId;
        }

        async function fetchSnapshot() {
          const response = await fetch("/api/state");
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body.error || "Failed to fetch state");
          }

          applySnapshot(body.snapshot);
          return body.snapshot;
        }

        function applySnapshot(snapshot) {
          runtime.snapshot = snapshot;
          runtime.serverFocusedBlockId = snapshot.document.focusedBlockId || null;
          runtime.commandTitles.clear();
          for (const command of snapshot.commands) {
            runtime.commandTitles.set(command.id, command.title);
          }

          const activeExists = snapshot.document.blocks.some((block) => block.id === runtime.activeBlockId);
          if (!activeExists) {
            runtime.activeBlockId = snapshot.document.focusedBlockId || snapshot.document.blocks[0]?.id || null;
          }

          renderMeta(snapshot);
          renderBlocks(snapshot);
          renderPalette(snapshot);
          renderQuickMenu(snapshot);
          renderToolbar(snapshot);
        }

        function renderMeta(snapshot) {
          setStatus(snapshot.statusMessage || "Ready", false);
          elements.focusChip.textContent = "Focus: " + (snapshot.document.focusedBlockId || "none");

          const path = snapshot.palette.state.path.length > 0
            ? snapshot.palette.state.path.join(" / ")
            : "root";
          const query = snapshot.palette.state.query ? (" · " + snapshot.palette.state.query) : "";
          elements.pathChip.textContent = "Path: " + path + query;

          const recent = snapshot.recentCommands && snapshot.recentCommands.length > 0
            ? snapshot.recentCommands.slice(0, 2).join(", ")
            : "none";
          elements.recentChip.textContent = "Recent: " + recent;
          elements.saveChip.textContent = "Save: " + (snapshot.saveStatus.lastSavedAt ? "saved" : "pending");
        }

        function renderedBlockIds() {
          return Array.from(elements.canvas.querySelectorAll(".editor-block"))
            .map((node) => node.getAttribute("data-block-id"))
            .filter(Boolean);
        }

        function shouldRebuildBlocks(snapshot) {
          const target = snapshot.document.blocks.map((block) => block.id);
          const current = renderedBlockIds();
          if (target.length !== current.length) {
            return true;
          }

          for (let index = 0; index < target.length; index += 1) {
            if (target[index] !== current[index]) {
              return true;
            }
          }

          return false;
        }

        function createBlockNode(block) {
          const article = document.createElement("article");
          article.className = "editor-block";
          article.setAttribute("data-block-id", block.id);
          article.setAttribute("dir", "auto");

          const rail = document.createElement("div");
          rail.className = "editor-block-rail";

          const handle = document.createElement("button");
          handle.type = "button";
          handle.className = "rail-btn";
          handle.setAttribute("data-action", "menu");
          handle.setAttribute("aria-label", "Block quick actions");
          handle.textContent = "⋮";

          const add = document.createElement("button");
          add.type = "button";
          add.className = "rail-btn";
          add.setAttribute("data-action", "insert");
          add.setAttribute("aria-label", "Insert block command");
          add.textContent = "+";

          rail.append(handle, add);

          const typeChip = document.createElement("span");
          typeChip.className = "editor-block-type";
          typeChip.textContent = block.type;

          const content = document.createElement("div");
          content.className = "editor-block-content";
          content.contentEditable = "true";
          content.tabIndex = 0;
          content.spellcheck = true;
          content.setAttribute("dir", "auto");
          content.setAttribute("role", "textbox");
          content.setAttribute("aria-multiline", "true");
          content.setAttribute("data-block-id", block.id);
          content.setAttribute("data-placeholder", "Type / or " + BACKSLASH + " for commands");
          content.textContent = toBlockText(block);
          content.setAttribute("data-empty", content.textContent.length === 0 ? "true" : "false");

          article.append(rail, typeChip, content);
          return article;
        }

        function renderBlocks(snapshot) {
          if (shouldRebuildBlocks(snapshot)) {
            elements.canvas.innerHTML = "";
            for (const block of snapshot.document.blocks) {
              elements.canvas.append(createBlockNode(block));
            }
          }

          const nodeMap = new Map(
            Array.from(elements.canvas.querySelectorAll(".editor-block"))
              .map((node) => [node.getAttribute("data-block-id"), node]),
          );

          for (const block of snapshot.document.blocks) {
            const wrapper = nodeMap.get(block.id);
            if (!wrapper) {
              continue;
            }

            const content = wrapper.querySelector(".editor-block-content");
            if (!content) {
              continue;
            }

            const nextText = toBlockText(block);
            const focusedContent = document.activeElement === content;
            if (!focusedContent && content.textContent !== nextText) {
              content.textContent = nextText;
            }

            content.setAttribute("data-empty", content.textContent.length === 0 ? "true" : "false");
            const isActive = block.id === runtime.activeBlockId;
            wrapper.classList.toggle("is-active", isActive);
          }
        }

        function setActiveBlock(blockId, syncServer) {
          if (!blockId) {
            return;
          }

          if (runtime.activeBlockId === blockId) {
            if (syncServer) {
              syncServerFocus(blockId).catch((error) => {
                setStatus(error instanceof Error ? error.message : String(error), true);
              });
            }
            return;
          }

          runtime.activeBlockId = blockId;
          for (const node of elements.canvas.querySelectorAll(".editor-block")) {
            node.classList.toggle("is-active", node.getAttribute("data-block-id") === blockId);
          }

          if (syncServer) {
            syncServerFocus(blockId).catch((error) => {
              setStatus(error instanceof Error ? error.message : String(error), true);
            });
          }
        }

        function contentByBlockId(blockId) {
          if (!blockId) {
            return null;
          }

          return elements.canvas.querySelector('.editor-block-content[data-block-id="' + blockId + '"]');
        }

        function scheduleTextSync(blockId, text, delay) {
          if (!blockId) {
            return;
          }

          const wait = typeof delay === "number" ? delay : 150;
          const prevTimer = runtime.textTimers.get(blockId);
          if (prevTimer) {
            clearTimeout(prevTimer);
          }

          const timer = setTimeout(() => {
            runtime.textTimers.delete(blockId);
            request("updateText", { blockId, text }).catch((error) => {
              setStatus(error instanceof Error ? error.message : String(error), true);
            });
          }, wait);

          runtime.textTimers.set(blockId, timer);
        }

        async function flushTextSync(blockId) {
          if (!blockId) {
            return;
          }

          const timer = runtime.textTimers.get(blockId);
          if (timer) {
            clearTimeout(timer);
            runtime.textTimers.delete(blockId);
          }

          const content = contentByBlockId(blockId);
          if (!content) {
            return;
          }

          await request("updateText", {
            blockId,
            text: content.textContent || "",
          });
        }

        function isBoundaryChar(char) {
          if (!char) {
            return true;
          }

          if (
            char === " " ||
            char === "\\n" ||
            char === "\\r" ||
            char === "\\t" ||
            char === "(" ||
            char === ")" ||
            char === "[" ||
            char === "]" ||
            char === "{" ||
            char === "}"
          ) {
            return true;
          }

          const code = char.charCodeAt(0);
          return (
            code === 0x200e ||
            code === 0x200f ||
            (code >= 0x202a && code <= 0x202e) ||
            (code >= 0x2066 && code <= 0x2069)
          );
        }

        function offsetWithin(content, node, offset) {
          try {
            const range = document.createRange();
            range.selectNodeContents(content);
            range.setEnd(node, offset);
            return range.toString().length;
          } catch {
            return null;
          }
        }

        function caretOffset(content) {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) {
            return null;
          }

          const range = selection.getRangeAt(0);
          if (!content.contains(range.endContainer)) {
            return null;
          }

          return offsetWithin(content, range.endContainer, range.endOffset);
        }

        function setCaretOffset(content, targetOffset) {
          const selection = window.getSelection();
          if (!selection) {
            return;
          }

          const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
          let traversed = 0;
          let node = walker.nextNode();

          while (node) {
            const size = node.textContent ? node.textContent.length : 0;
            if (traversed + size >= targetOffset) {
              const range = document.createRange();
              range.setStart(node, Math.max(0, targetOffset - traversed));
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
              return;
            }

            traversed += size;
            node = walker.nextNode();
          }

          const range = document.createRange();
          range.selectNodeContents(content);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        function findCommandToken(content) {
          const caret = caretOffset(content);
          if (caret === null) {
            return null;
          }

          const text = content.textContent || "";
          const beforeCursor = text.slice(0, caret);

          for (let index = beforeCursor.length - 1; index >= 0; index -= 1) {
            const trigger = beforeCursor.charAt(index);
            if (trigger !== "/" && trigger !== BACKSLASH) {
              continue;
            }

            const charBefore = index > 0 ? beforeCursor.charAt(index - 1) : "";
            if (!isBoundaryChar(charBefore)) {
              continue;
            }

            const query = beforeCursor.slice(index + 1);
          if (query.includes("\\n") || query.includes("\\r") || query.includes("\\t")) {
            return null;
          }

            return {
              trigger,
              query,
              start: index,
              end: caret,
            };
          }

          return null;
        }

        function replaceSegment(content, start, end, replacement) {
          const current = content.textContent || "";
          content.textContent = current.slice(0, start) + replacement + current.slice(end);
          content.setAttribute("data-empty", content.textContent.length === 0 ? "true" : "false");
        }

        function applyPalettePathToContent(content, paletteState) {
          if (!runtime.commandAnchor) {
            return;
          }

          const blockId = content.getAttribute("data-block-id");
          if (!blockId || runtime.commandAnchor.blockId !== blockId) {
            return;
          }

          const trigger = runtime.commandAnchor.trigger;
          const pathPrefix = paletteState.path.length > 0
            ? paletteState.path.join(trigger) + trigger
            : "";
          const replacement = trigger + pathPrefix + (paletteState.query || "");

          replaceSegment(content, runtime.commandAnchor.start, runtime.commandAnchor.end, replacement);
          const nextOffset = runtime.commandAnchor.start + replacement.length;
          runtime.commandAnchor.end = nextOffset;
          setCaretOffset(content, nextOffset);
        }

        function clearCommandFromContent(content) {
          if (!runtime.commandAnchor) {
            return;
          }

          const blockId = content.getAttribute("data-block-id");
          if (!blockId || runtime.commandAnchor.blockId !== blockId) {
            return;
          }

          replaceSegment(content, runtime.commandAnchor.start, runtime.commandAnchor.end, "");
          setCaretOffset(content, runtime.commandAnchor.start);
          runtime.commandAnchor = null;
          runtime.lastPaletteSignature = "";
        }

        function closePaletteViaApi() {
          if (!runtime.snapshot || !runtime.snapshot.palette.state.isOpen) {
            return;
          }

          request("paletteKey", { key: "Escape" }).catch((error) => {
            setStatus(error instanceof Error ? error.message : String(error), true);
          });
        }

        function probePalette(content) {
          const blockId = content.getAttribute("data-block-id");
          if (!blockId) {
            return;
          }

          const token = findCommandToken(content);
          if (!token) {
            runtime.commandAnchor = null;
            runtime.lastPaletteSignature = "";
            closePaletteViaApi();
            return;
          }

          const signature = blockId + "|" + token.trigger + "|" + token.query + "|" + token.end;
          if (signature === runtime.lastPaletteSignature && runtime.snapshot?.palette.state.isOpen) {
            positionPalette();
            return;
          }

          runtime.lastPaletteSignature = signature;
          runtime.commandAnchor = {
            blockId,
            trigger: token.trigger,
            start: token.start,
            end: token.end,
          };

          request("openPalette", {
            trigger: token.trigger,
            query: token.query,
          }).catch((error) => {
            setStatus(error instanceof Error ? error.message : String(error), true);
          });
        }

        function schedulePaletteProbe(content, immediate) {
          if (immediate) {
            probePalette(content);
            return;
          }

          window.setTimeout(() => {
            probePalette(content);
          }, 35);
        }

        function resolvePaletteTrigger(paletteState) {
          if (runtime.commandAnchor?.trigger) {
            return runtime.commandAnchor.trigger;
          }

          const trigger = paletteState.trigger?.trigger;
          return trigger === BACKSLASH ? BACKSLASH : "/";
        }

        function renderPalette(snapshot) {
          const paletteState = snapshot.palette.state;
          if (!paletteState.isOpen) {
            elements.palette.classList.remove("open");
            elements.palette.innerHTML = "";
            runtime.paletteItems = [];
            return;
          }

          const trigger = resolvePaletteTrigger(paletteState);
          const queryPreview = trigger +
            (paletteState.path.length > 0 ? paletteState.path.join(trigger) + trigger : "") +
            paletteState.query;

          const breadcrumb = paletteState.path.length > 0
            ? '<div class="palette-breadcrumb">' +
              paletteState.path.map((segment) => '<span>' + escapeHtml(segment) + "</span>").join("") +
              "</div>"
            : "";

          const items = [];
          for (const entry of paletteState.submenuEntries) {
            items.push({
              type: "submenu",
              title: entry.title,
              description: entry.commandCount + " commands",
              path: entry.path,
            });
          }

          for (const result of paletteState.results) {
            items.push({
              type: "command",
              commandId: result.command.id,
              title: result.command.title,
              description: (result.command.category || "General") + " · " + (result.command.description || result.command.id),
            });
          }

          runtime.paletteItems = items;

          const list = items.length === 0
            ? '<div class="palette-empty">No commands found</div>'
            : '<div class="palette-list">' +
              items
                .map((item, index) => {
                  const isActive = index === paletteState.activeIndex ? " is-active" : "";
                  return [
                    '<button type="button" class="palette-item' + isActive + '" data-item-index="' + index + '">',
                    '<span class="palette-item-title">' + escapeHtml(item.title) + "</span>",
                    '<span class="palette-item-meta">' + escapeHtml(item.description) + "</span>",
                    "</button>",
                  ].join("");
                })
                .join("") +
              "</div>";

          elements.palette.innerHTML = [
            '<div class="palette-head">',
            '<p class="palette-query" dir="auto">' + escapeHtml(queryPreview) + "</p>",
            breadcrumb,
            "</div>",
            list,
          ].join("");

          elements.palette.classList.add("open");
          positionPalette();
        }

        function paletteAnchorRect() {
          const selection = window.getSelection();
          const activeContent = contentByBlockId(runtime.activeBlockId);
          if (selection && selection.rangeCount > 0 && activeContent) {
            const range = selection.getRangeAt(0);
            if (activeContent.contains(range.endContainer)) {
              const rect = range.getBoundingClientRect();
              if (rect.width > 0 || rect.height > 0) {
                return rect;
              }
            }
          }

          if (activeContent) {
            return activeContent.getBoundingClientRect();
          }

          return null;
        }

        function positionPalette() {
          if (!elements.palette.classList.contains("open")) {
            return;
          }

          const rect = paletteAnchorRect();
          if (!rect) {
            return;
          }

          const width = elements.palette.offsetWidth || 340;
          const height = elements.palette.offsetHeight || 260;
          const left = Math.min(Math.max(10, rect.left), window.innerWidth - width - 10);
          const top = Math.min(rect.bottom + 8, window.innerHeight - height - 10);

          elements.palette.style.left = left + "px";
          elements.palette.style.top = top + "px";
        }

        function getSelectionInfo() {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            return null;
          }

          const range = selection.getRangeAt(0);
          const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE
            ? range.startContainer
            : range.startContainer.parentElement;
          const endElement = range.endContainer.nodeType === Node.ELEMENT_NODE
            ? range.endContainer
            : range.endContainer.parentElement;

          const startContent = startElement ? startElement.closest(".editor-block-content") : null;
          const endContent = endElement ? endElement.closest(".editor-block-content") : null;

          if (!startContent || !endContent || startContent !== endContent) {
            return null;
          }

          const blockId = startContent.getAttribute("data-block-id");
          if (!blockId) {
            return null;
          }

          const start = offsetWithin(startContent, range.startContainer, range.startOffset);
          const end = offsetWithin(startContent, range.endContainer, range.endOffset);
          if (start === null || end === null || start === end) {
            return null;
          }

          const rect = range.getBoundingClientRect();
          const anchorRect = rect.width > 0 || rect.height > 0
            ? rect
            : startContent.getBoundingClientRect();

          return {
            blockId,
            start: Math.min(start, end),
            end: Math.max(start, end),
            rect: anchorRect,
          };
        }

        function scheduleSelectionSync(selectionInfo) {
          const key = selectionInfo.blockId + ":" + selectionInfo.start + ":" + selectionInfo.end;
          if (runtime.lastSelectionKey === key) {
            return;
          }

          runtime.lastSelectionKey = key;
          if (runtime.selectionTimer) {
            clearTimeout(runtime.selectionTimer);
          }

          runtime.selectionTimer = setTimeout(() => {
            runtime.selectionTimer = null;
            request("setSelection", {
              blockId: selectionInfo.blockId,
              start: selectionInfo.start,
              end: selectionInfo.end,
            }).catch((error) => {
              setStatus(error instanceof Error ? error.message : String(error), true);
            });
          }, 80);
        }

        function renderToolbar(snapshot) {
          const state = snapshot.toolbar.state;
          if (!state.visible || !runtime.selectionRect) {
            elements.toolbar.classList.remove("open");
            elements.toolbar.innerHTML = "";
            return;
          }

          elements.toolbar.innerHTML = state.buttons
            .map((button) => {
              return [
                '<button type="button" class="toolbar-btn" data-command-id="',
                escapeHtml(button.commandId),
                '"',
                button.disabled ? " disabled" : "",
                ">",
                escapeHtml(button.title),
                "</button>",
              ].join("");
            })
            .join("");

          elements.toolbar.classList.add("open");
          positionToolbar();
        }

        function positionToolbar() {
          if (!elements.toolbar.classList.contains("open") || !runtime.selectionRect) {
            return;
          }

          const rect = runtime.selectionRect;
          const width = elements.toolbar.offsetWidth || 240;
          const height = elements.toolbar.offsetHeight || 42;

          const left = Math.min(Math.max(10, rect.left + (rect.width / 2) - (width / 2)), window.innerWidth - width - 10);
          const top = Math.max(10, rect.top - height - 8);

          elements.toolbar.style.left = left + "px";
          elements.toolbar.style.top = top + "px";
        }

        function openQuickMenu(blockId, source) {
          if (!blockId) {
            return;
          }

          runtime.quickMenuBlockId = blockId;
          runtime.quickMenuRect = source.getBoundingClientRect();
          request("hoverBlockAction", { blockId }).catch((error) => {
            setStatus(error instanceof Error ? error.message : String(error), true);
          });
        }

        function closeQuickMenu() {
          runtime.quickMenuBlockId = null;
          runtime.quickMenuRect = null;
          elements.quickMenu.classList.remove("open");
          elements.quickMenu.innerHTML = "";
        }

        function renderQuickMenu(snapshot) {
          if (!runtime.quickMenuBlockId) {
            elements.quickMenu.classList.remove("open");
            elements.quickMenu.innerHTML = "";
            return;
          }

          const state = snapshot.blockActionMenu.state;
          if (!state.visible || state.blockId !== runtime.quickMenuBlockId) {
            elements.quickMenu.classList.remove("open");
            elements.quickMenu.innerHTML = "";
            return;
          }

          const buttons = state.commandIds
            .map((commandId) => {
              const title = runtime.commandTitles.get(commandId) || commandId;
              return '<button type="button" data-command-id="' + escapeHtml(commandId) + '">' + escapeHtml(title) + "</button>";
            })
            .join("");

          elements.quickMenu.innerHTML = '<div class="quick-menu-title">Quick actions</div>' + buttons;
          elements.quickMenu.classList.add("open");
          positionQuickMenu();
        }

        function positionQuickMenu() {
          if (!elements.quickMenu.classList.contains("open") || !runtime.quickMenuRect) {
            return;
          }

          const rect = runtime.quickMenuRect;
          const width = elements.quickMenu.offsetWidth || 220;
          const height = elements.quickMenu.offsetHeight || 180;
          const left = Math.min(Math.max(10, rect.left - 4), window.innerWidth - width - 10);
          const top = Math.min(rect.bottom + 6, window.innerHeight - height - 10);

          elements.quickMenu.style.left = left + "px";
          elements.quickMenu.style.top = top + "px";
        }

        elements.canvas.addEventListener("focusin", (event) => {
          const content = closestFromTarget(event.target, ".editor-block-content");
          if (!content) {
            return;
          }

          const blockId = content.getAttribute("data-block-id");
          setActiveBlock(blockId, true);
        });

        elements.canvas.addEventListener("mousedown", (event) => {
          const actionButton = closestFromTarget(event.target, "button[data-action]");
          if (actionButton) {
            return;
          }

          const content = closestFromTarget(event.target, ".editor-block-content");
          if (!content) {
            const block = closestFromTarget(event.target, ".editor-block");
            const contentElement = block ? block.querySelector(".editor-block-content") : null;
            if (contentElement && document.activeElement !== contentElement) {
              contentElement.focus();
            }
            return;
          }

          if (document.activeElement !== content) {
            content.focus();
          }
        });

        elements.canvas.addEventListener("input", (event) => {
          const content = closestFromTarget(event.target, ".editor-block-content");
          if (!content) {
            return;
          }

          const blockId = content.getAttribute("data-block-id");
          if (!blockId) {
            return;
          }

          content.setAttribute("data-empty", content.textContent.length === 0 ? "true" : "false");
          scheduleTextSync(blockId, content.textContent || "", 130);
          schedulePaletteProbe(content, false);
        });

        elements.canvas.addEventListener("click", async (event) => {
          try {
            const button = closestFromTarget(event.target, "button[data-action]");
            if (button) {
              const block = button.closest(".editor-block");
              const blockId = block ? block.getAttribute("data-block-id") : null;
              if (!blockId) {
                return;
              }

              if (button.getAttribute("data-action") === "menu") {
                openQuickMenu(blockId, button);
                return;
              }

              if (button.getAttribute("data-action") === "insert") {
                setActiveBlock(blockId, true);
                await syncServerFocus(blockId);
                await request("openPalette", {
                  trigger: "/",
                  query: "insert/",
                });
                return;
              }
            }

            const content = closestFromTarget(event.target, ".editor-block-content");
            if (content) {
              const blockId = content.getAttribute("data-block-id");
              if (document.activeElement !== content) {
                content.focus();
              }
              setActiveBlock(blockId, true);
              return;
            }

            const block = closestFromTarget(event.target, ".editor-block");
            if (!block) {
              return;
            }

            const blockId = block.getAttribute("data-block-id");
            setActiveBlock(blockId, true);
            const contentElement = block.querySelector(".editor-block-content");
            if (!contentElement) {
              return;
            }

            contentElement.focus();
            setCaretOffset(contentElement, (contentElement.textContent || "").length);
          } catch (error) {
            setStatus(error instanceof Error ? error.message : String(error), true);
          }
        });

        elements.canvas.addEventListener("keydown", async (event) => {
          const content = closestFromTarget(event.target, ".editor-block-content");
          if (!content) {
            return;
          }

          const blockId = content.getAttribute("data-block-id");
          if (!blockId) {
            return;
          }

          try {
            if (runtime.snapshot?.palette.state.isOpen && PALETTE_KEYS.has(event.key)) {
              event.preventDefault();
              await syncServerFocus(blockId);
              await flushTextSync(blockId);
              const nextSnapshot = await request("paletteKey", {
                key: event.key,
              });

              if ((event.key === "Tab" || event.key === "ArrowRight" || event.key === "ArrowLeft") && nextSnapshot.palette.state.isOpen) {
                applyPalettePathToContent(content, nextSnapshot.palette.state);
                scheduleTextSync(blockId, content.textContent || "", 70);
              }

              if (event.key === "Enter" && !nextSnapshot.palette.state.isOpen) {
                clearCommandFromContent(content);
                scheduleTextSync(blockId, content.textContent || "", 0);
              }

              if (event.key === "Escape") {
                runtime.commandAnchor = null;
                runtime.lastPaletteSignature = "";
              }

              return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
              event.preventDefault();
              await syncServerFocus(blockId);
              await flushTextSync(blockId);
              await request("save");
              return;
            }

            if (event.key === "/" || event.key === BACKSLASH) {
              schedulePaletteProbe(content, true);
              return;
            }

            if (event.key === "Backspace" || event.key === "Delete") {
              schedulePaletteProbe(content, false);
            }
          } catch (error) {
            setStatus(error instanceof Error ? error.message : String(error), true);
          }
        });

        elements.canvas.addEventListener("keyup", (event) => {
          const content = closestFromTarget(event.target, ".editor-block-content");
          if (!content) {
            return;
          }

          if (
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "ArrowUp" ||
            event.key === "ArrowDown"
          ) {
            schedulePaletteProbe(content, true);
          }
        });

        elements.palette.addEventListener("click", async (event) => {
          const button = closestFromTarget(event.target, "button[data-item-index]");
          if (!button) {
            return;
          }

          const index = Number(button.getAttribute("data-item-index"));
          const item = runtime.paletteItems[index];
          if (!item) {
            return;
          }

          try {
            const activeContent = contentByBlockId(runtime.activeBlockId);
            if (item.type === "submenu") {
              const trigger = resolvePaletteTrigger(runtime.snapshot.palette.state);
              const query = item.path.join(trigger) + trigger;
              await syncServerFocus(runtime.activeBlockId);
              const nextSnapshot = await request("openPalette", {
                trigger,
                query,
              });

              if (activeContent) {
                applyPalettePathToContent(activeContent, nextSnapshot.palette.state);
                scheduleTextSync(runtime.activeBlockId, activeContent.textContent || "", 70);
              }
              return;
            }

            await syncServerFocus(runtime.activeBlockId);
            await flushTextSync(runtime.activeBlockId);
            await request("executeCommand", {
              commandId: item.commandId,
            });

            if (activeContent) {
              clearCommandFromContent(activeContent);
              scheduleTextSync(runtime.activeBlockId, activeContent.textContent || "", 0);
            }
          } catch (error) {
            setStatus(error instanceof Error ? error.message : String(error), true);
          }
        });

        elements.quickMenu.addEventListener("click", async (event) => {
          const button = closestFromTarget(event.target, "button[data-command-id]");
          if (!button) {
            return;
          }

          const commandId = button.getAttribute("data-command-id");
          if (!commandId) {
            return;
          }

          try {
            await syncServerFocus(runtime.quickMenuBlockId || runtime.activeBlockId);
            await request("executeBlockAction", { commandId });
            closeQuickMenu();
          } catch (error) {
            setStatus(error instanceof Error ? error.message : String(error), true);
          }
        });

        elements.toolbar.addEventListener("click", async (event) => {
          const button = closestFromTarget(event.target, "button[data-command-id]");
          if (!button || button.hasAttribute("disabled")) {
            return;
          }

          const commandId = button.getAttribute("data-command-id");
          if (!commandId) {
            return;
          }

          try {
            await syncServerFocus(runtime.activeBlockId);
            await request("executeCommand", { commandId });
          } catch (error) {
            setStatus(error instanceof Error ? error.message : String(error), true);
          }
        });

        elements.saveButton.addEventListener("click", async () => {
          try {
            await syncServerFocus(runtime.activeBlockId);
            await flushTextSync(runtime.activeBlockId);
            await request("save");
          } catch (error) {
            setStatus(error instanceof Error ? error.message : String(error), true);
          }
        });

        elements.resetButton.addEventListener("click", async () => {
          try {
            for (const timer of runtime.textTimers.values()) {
              clearTimeout(timer);
            }
            runtime.textTimers.clear();
            runtime.commandAnchor = null;
            runtime.lastPaletteSignature = "";
            runtime.lastSelectionKey = "";
            runtime.selectionRect = null;
            closeQuickMenu();
            await request("reset");
          } catch (error) {
            setStatus(error instanceof Error ? error.message : String(error), true);
          }
        });

        document.addEventListener("selectionchange", () => {
          const selectionInfo = getSelectionInfo();
          if (!selectionInfo) {
            runtime.selectionRect = null;
            if (runtime.snapshot?.toolbar.state.visible) {
              renderToolbar(runtime.snapshot);
            } else {
              elements.toolbar.classList.remove("open");
              elements.toolbar.innerHTML = "";
            }
            return;
          }

          runtime.selectionRect = selectionInfo.rect;
          setActiveBlock(selectionInfo.blockId, false);
          scheduleSelectionSync(selectionInfo);
          positionToolbar();
        });

        document.addEventListener("mousedown", (event) => {
          const target = event.target;
          const insideQuick = elements.quickMenu.contains(target);
          const quickButton = closestFromTarget(target, "button[data-action=menu]");
          if (!insideQuick && !quickButton) {
            closeQuickMenu();
          }

          const insidePalette = elements.palette.contains(target);
          const insideEditable = closestFromTarget(target, ".editor-block-content");
          if (!insidePalette && !insideEditable && runtime.snapshot?.palette.state.isOpen) {
            closePaletteViaApi();
          }
        });

        window.addEventListener("resize", () => {
          positionPalette();
          positionQuickMenu();
          positionToolbar();
        });

        window.addEventListener("scroll", () => {
          positionPalette();
          positionQuickMenu();
          positionToolbar();
        }, true);

        fetchSnapshot().catch((error) => {
          setStatus(error instanceof Error ? error.message : String(error), true);
        });
      })();
    </script>
  </body>
</html>`;
}
function renderAdvancedPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pulse Manual Lab</title>
    <style>
      :root {
        --bg: #f3efe7;
        --ink: #182027;
        --muted: #56616b;
        --card: #fffdf8;
        --line: #d8d3c8;
        --accent: #0b7285;
        --accent-soft: #d9eef2;
        --accent-2: #c77039;
        --good: #2b9348;
        --bad: #bc4749;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Sora", "Avenir Next", "Trebuchet MS", "Noto Sans Arabic", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at 8% 12%, #fff8e8 0, transparent 28%),
          radial-gradient(circle at 92% 4%, #d9eef2 0, transparent 24%),
          linear-gradient(170deg, #f5f1e9 0%, #ece7de 45%, #f7f3ea 100%);
      }

      .shell {
        width: min(1360px, 100% - 2rem);
        margin: 1rem auto 2rem;
      }

      .hero {
        background: linear-gradient(110deg, #ffffffde, #ffffffab);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 1rem 1.25rem;
        backdrop-filter: blur(6px);
        box-shadow: 0 10px 30px #0000000f;
      }

      .hero h1 {
        margin: 0;
        font-size: clamp(1.2rem, 2.3vw, 1.9rem);
        letter-spacing: 0.02em;
      }

      .hero p {
        margin: 0.35rem 0 0;
        color: var(--muted);
      }

      .layout {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
        gap: 1rem;
      }

      .panel {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 16px;
        box-shadow: 0 8px 24px #00000010;
      }

      .controls {
        padding: 0.9rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      }

      .section {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 0.75rem;
        background: #fffdfb;
      }

      .section h2 {
        margin: 0 0 0.55rem;
        font-size: 0.9rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #38505d;
      }

      .row {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      label {
        font-size: 0.76rem;
        color: var(--muted);
        display: block;
        margin-bottom: 0.25rem;
      }

      input,
      textarea,
      select,
      button {
        width: 100%;
        font: inherit;
        border-radius: 10px;
        border: 1px solid var(--line);
        background: #fff;
        color: var(--ink);
      }

      input,
      textarea,
      select {
        padding: 0.5rem 0.55rem;
      }

      textarea {
        min-height: 68px;
        resize: vertical;
      }

      button {
        cursor: pointer;
        padding: 0.52rem 0.6rem;
        font-weight: 600;
        background: linear-gradient(130deg, var(--accent) 0%, #117a8b 90%);
        border-color: transparent;
        color: #f8fcff;
        transition: transform 120ms ease, filter 120ms ease;
      }

      button:hover {
        transform: translateY(-1px);
        filter: brightness(1.04);
      }

      button.secondary {
        background: linear-gradient(130deg, #66717d, #4f5b66);
      }

      button.ghost {
        background: linear-gradient(130deg, #ffffff, #f1efe8);
        color: #2f3e49;
        border-color: var(--line);
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }

      .chip {
        font-size: 0.73rem;
        border-radius: 999px;
        padding: 0.2rem 0.55rem;
        border: 1px solid transparent;
        background: var(--accent-soft);
        color: #18434e;
      }

      .chip.good {
        background: #e9f7ed;
        color: #1f6b35;
      }

      .chip.warn {
        background: #fff5e9;
        color: #865a2f;
      }

      .status {
        border-radius: 10px;
        padding: 0.55rem 0.65rem;
        font-size: 0.82rem;
        border: 1px solid #d2cec2;
        background: #fffdf6;
      }

      .workspace {
        padding: 0.9rem;
        display: grid;
        gap: 0.75rem;
      }

      .surface {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 0.72rem;
        background: #fff;
      }

      .surface h3 {
        margin: 0 0 0.45rem;
        font-size: 0.9rem;
        color: #2f4452;
      }

      .preview-frame {
        border: 1px dashed #c8c3b8;
        border-radius: 10px;
        padding: 0.6rem;
        background: #fffdfa;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.6rem;
      }

      .mono {
        font-family: "Iosevka", "Consolas", "SFMono-Regular", monospace;
        font-size: 0.78rem;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .block-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.45rem;
      }

      .block-list li {
        border: 1px solid #ddd8cb;
        border-radius: 9px;
        background: #fdfbf6;
        padding: 0.42rem 0.5rem;
        font-size: 0.8rem;
      }

      .muted {
        color: var(--muted);
      }

      @media (max-width: 980px) {
        .layout {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <header class="hero panel">
        <h1>Pulse Manual Lab</h1>
        <p>
          Interactive local server for testing current editor capabilities: slash/backslash suggestions,
          nested commands, shortcuts, context menus, drag-drop, save/clipboard, inspector, and event logger.
          <a href="/" style="margin-inline-start: 0.4rem; color: #0b7285; font-weight: 700; text-decoration: none;">
            Switch to Simple Mode
          </a>
        </p>
      </header>

      <section class="layout">
        <aside class="panel controls">
          <div class="status" id="status-message">Booting runtime…</div>

          <div class="section">
            <h2>Runtime</h2>
            <div class="row">
              <button id="reset-runtime" class="secondary">Reset Runtime</button>
              <button id="manual-save">Manual Save</button>
              <button id="flush-autosave" class="ghost">Flush Autosave</button>
              <button id="copy-blocks" class="ghost">Copy Blocks</button>
              <button id="paste-blocks">Paste Blocks</button>
              <button id="clear-events" class="ghost">Clear Events</button>
            </div>
          </div>

          <div class="section">
            <h2>Block Focus & Text</h2>
            <label for="focus-block">Focus block</label>
            <select id="focus-block"></select>
            <div class="row" style="margin-top: 0.45rem;">
              <button id="apply-focus" class="ghost">Apply Focus</button>
              <button id="hover-action">Hover Action Menu</button>
            </div>
            <label for="text-value" style="margin-top: 0.5rem;">Update text (dir auto)</label>
            <textarea id="text-value" dir="auto" placeholder="Type Persian + English mixed text"></textarea>
            <button id="apply-text" style="margin-top: 0.45rem;">Update Focused Text Block</button>
          </div>

          <div class="section">
            <h2>Selection & Toolbar</h2>
            <label for="selection-block">Selection block</label>
            <select id="selection-block"></select>
            <div class="row">
              <div>
                <label for="selection-start">Start</label>
                <input id="selection-start" type="number" value="0" />
              </div>
              <div>
                <label for="selection-end">End</label>
                <input id="selection-end" type="number" value="5" />
              </div>
            </div>
            <div class="row" style="margin-top: 0.45rem;">
              <button id="set-selection">Set Selection</button>
              <button id="open-selection-menu" class="ghost">Open Selection Menu</button>
            </div>
          </div>

          <div class="section">
            <h2>Slash / Backslash Suggestions</h2>
            <div class="row">
              <div>
                <label for="command-trigger">Trigger</label>
                <select id="command-trigger">
                  <option value="/">Slash (/)</option>
                  <option value="\\">Backslash (\\)</option>
                </select>
              </div>
              <div>
                <label for="command-query">Query</label>
                <input id="command-query" dir="auto" placeholder="e.g. insert/media or تیتر" />
              </div>
            </div>
            <div class="row" style="margin-top: 0.45rem;">
              <button id="open-palette">Open Suggestions</button>
              <button id="palette-tab" class="ghost">Tab (Pre-confirm)</button>
              <button id="palette-enter">Enter (Final)</button>
              <button id="palette-up" class="ghost">Arrow Up</button>
              <button id="palette-down" class="ghost">Arrow Down</button>
              <button id="palette-right" class="ghost">Arrow Right</button>
              <button id="palette-left" class="ghost">Arrow Left</button>
            </div>
          </div>

          <div class="section">
            <h2>Command & Shortcut Execution</h2>
            <label for="command-select">Command registry</label>
            <select id="command-select"></select>
            <button id="execute-command" style="margin-top: 0.45rem;">Execute Command</button>
            <label for="shortcut-select" style="margin-top: 0.55rem;">Shortcut combos</label>
            <select id="shortcut-select"></select>
            <button id="dispatch-shortcut" class="ghost" style="margin-top: 0.45rem;">Dispatch Shortcut</button>
          </div>

          <div class="section">
            <h2>Context & DnD</h2>
            <label for="context-block">Block menu target</label>
            <select id="context-block"></select>
            <div class="row" style="margin-top: 0.45rem;">
              <button id="open-block-menu">Open Block Menu</button>
              <button id="execute-block-menu" class="ghost">Run First Block Menu Item</button>
              <button id="execute-selection-menu" class="ghost">Run First Selection Item</button>
            </div>
            <label for="dnd-block" style="margin-top: 0.55rem;">Drag block</label>
            <select id="dnd-block"></select>
            <div class="row">
              <div>
                <label for="drop-index">Drop index</label>
                <input id="drop-index" type="number" value="0" />
              </div>
              <div style="display: flex; align-items: end;">
                <button id="apply-dnd">Apply DnD</button>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Event Filters</h2>
            <label for="event-text">Contains text</label>
            <input id="event-text" dir="auto" placeholder="saved / selection / فارسی" />
            <label for="event-source" style="margin-top: 0.45rem;">Source</label>
            <select id="event-source">
              <option value="">All sources</option>
              <option value="state">state</option>
              <option value="event-bus">event-bus</option>
              <option value="custom">custom</option>
            </select>
            <button id="apply-event-filter" style="margin-top: 0.45rem;">Apply Event Filter</button>
          </div>
        </aside>

        <section class="panel workspace">
          <div class="chips" id="meta-chips"></div>

          <article class="surface">
            <h3>Editor Surface</h3>
            <div class="preview-frame" id="editor-preview"></div>
          </article>

          <section class="meta-grid">
            <article class="surface">
              <h3>Command Palette</h3>
              <div class="preview-frame" id="palette-preview"></div>
            </article>
            <article class="surface">
              <h3>Floating Toolbar</h3>
              <div class="preview-frame" id="toolbar-preview"></div>
            </article>
          </section>

          <section class="meta-grid">
            <article class="surface">
              <h3>Block Context Menu</h3>
              <div class="preview-frame" id="block-context-preview"></div>
            </article>
            <article class="surface">
              <h3>Selection Context Menu</h3>
              <div class="preview-frame" id="selection-context-preview"></div>
            </article>
          </section>

          <section class="meta-grid">
            <article class="surface">
              <h3>Block Action Menu</h3>
              <div class="preview-frame" id="block-action-preview"></div>
            </article>
            <article class="surface">
              <h3>DnD + Save Status</h3>
              <pre class="mono" id="status-json"></pre>
            </article>
          </section>

          <section class="meta-grid">
            <article class="surface">
              <h3>Focused Block Inspector</h3>
              <div class="preview-frame" id="inspector-preview"></div>
            </article>
            <article class="surface">
              <h3>Event Logger</h3>
              <div class="preview-frame" id="event-preview"></div>
            </article>
          </section>

          <article class="surface">
            <h3>Document Blocks</h3>
            <ul class="block-list" id="block-list"></ul>
          </article>
        </section>
      </section>
    </main>

    <script>
      const elements = {
        status: document.getElementById("status-message"),
        chips: document.getElementById("meta-chips"),
        editorPreview: document.getElementById("editor-preview"),
        palettePreview: document.getElementById("palette-preview"),
        toolbarPreview: document.getElementById("toolbar-preview"),
        blockContextPreview: document.getElementById("block-context-preview"),
        selectionContextPreview: document.getElementById("selection-context-preview"),
        blockActionPreview: document.getElementById("block-action-preview"),
        statusJson: document.getElementById("status-json"),
        inspectorPreview: document.getElementById("inspector-preview"),
        eventPreview: document.getElementById("event-preview"),
        blockList: document.getElementById("block-list"),
        focusBlock: document.getElementById("focus-block"),
        contextBlock: document.getElementById("context-block"),
        selectionBlock: document.getElementById("selection-block"),
        dndBlock: document.getElementById("dnd-block"),
        commandSelect: document.getElementById("command-select"),
        shortcutSelect: document.getElementById("shortcut-select"),
      };

      let currentSnapshot = null;

      function setStatus(message, isError = false) {
        elements.status.textContent = message;
        elements.status.style.borderColor = isError ? "#e9b4b4" : "#d2cec2";
        elements.status.style.color = isError ? "#932626" : "#2c3c48";
      }

      function optionMarkup(value, label) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        return option;
      }

      function fillSelect(select, options, currentValue) {
        select.innerHTML = "";
        for (const { value, label } of options) {
          select.append(optionMarkup(value, label));
        }

        if (currentValue && options.some((option) => option.value === currentValue)) {
          select.value = currentValue;
        }
      }

      function renderSnapshot(snapshot) {
        currentSnapshot = snapshot;
        setStatus(snapshot.statusMessage);

        const focusLabel = snapshot.document.focusedBlockId ?? "none";
        const chips = [
          "<span class=\\\"chip\\\">Doc: " + snapshot.document.id + "</span>",
          "<span class=\\\"chip\\\">Focused: " + focusLabel + "</span>",
          "<span class=\\\"chip\\\">Blocks: " + snapshot.document.blocks.length + "</span>",
          "<span class=\\\"chip warn\\\">Recent: " + ((snapshot.recentCommands || []).join(\", \") || \"none\") + "</span>",
          "<span class=\\\"chip good\\\">Save: " + (snapshot.saveStatus.lastSavedAt ? \"saved\" : \"pending\") + "</span>",
        ];
        elements.chips.innerHTML = chips.join(" ");

        elements.editorPreview.innerHTML = snapshot.editorHtml;
        elements.palettePreview.innerHTML = snapshot.palette.html || "<span class='muted'>Palette closed</span>";
        elements.toolbarPreview.innerHTML = snapshot.toolbar.html || "<span class='muted'>Toolbar hidden</span>";
        elements.blockContextPreview.innerHTML = snapshot.blockContextMenu.html || "<span class='muted'>Closed</span>";
        elements.selectionContextPreview.innerHTML = snapshot.selectionContextMenu.html || "<span class='muted'>Closed</span>";
        elements.blockActionPreview.innerHTML = snapshot.blockActionMenu.html || "<span class='muted'>Hidden</span>";
        elements.inspectorPreview.innerHTML = snapshot.inspector.html;
        elements.eventPreview.innerHTML = snapshot.eventLogger.html;

        elements.statusJson.textContent = JSON.stringify(
          {
            dnd: snapshot.dnd,
            save: snapshot.saveStatus,
            palette: snapshot.palette.state,
          },
          null,
          2,
        );

        elements.blockList.innerHTML = snapshot.document.blocks
          .map((block) => {
            return "<li><strong>" + block.id + "</strong> <span class=\\\"muted\\\">(" + block.type + ")</span><br /><span dir=\\\"auto\\\">" + String(block.text) + "</span></li>";
          })
          .join(\"\");

        const blockOptions = snapshot.document.blocks.map((block) => ({
          value: block.id,
          label: block.id + \" — \" + block.type,
        }));

        const focusedId = snapshot.document.focusedBlockId || blockOptions[0]?.value;
        fillSelect(elements.focusBlock, blockOptions, focusedId);
        fillSelect(elements.contextBlock, blockOptions, focusedId);
        fillSelect(elements.selectionBlock, blockOptions, focusedId);
        fillSelect(elements.dndBlock, blockOptions, focusedId);

        const commandOptions = snapshot.commands.map((command) => ({
          value: command.id,
          label: command.id + \" — \" + command.title,
        }));
        fillSelect(elements.commandSelect, commandOptions, snapshot.palette.state.results[0]?.command.id);

        const shortcutOptions = snapshot.shortcuts.map((binding) => ({
          value: binding.combo,
          label: binding.combo + \" -> \" + binding.commandId,
        }));
        fillSelect(elements.shortcutSelect, shortcutOptions, shortcutOptions[0]?.value);
      }

      async function request(action, payload = {}) {
        const response = await fetch("/api/action", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ action, payload }),
        });

        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error || (\"Action \" + action + \" failed\"));
        }

        renderSnapshot(body.snapshot);
      }

      async function bootstrap() {
        const response = await fetch("/api/state");
        const body = await response.json();
        renderSnapshot(body.snapshot);
      }

      function on(id, handler) {
        document.getElementById(id).addEventListener("click", async () => {
          try {
            await handler();
          } catch (error) {
            setStatus(error instanceof Error ? error.message : String(error), true);
          }
        });
      }

      on("reset-runtime", () => request("reset"));
      on("manual-save", () => request("save"));
      on("flush-autosave", () => request("autosaveFlush"));
      on("copy-blocks", () => request("copy"));
      on("paste-blocks", () => request("paste", { mode: "insert" }));
      on("clear-events", () => request("clearEvents"));

      on("apply-focus", () => request("focus", { blockId: elements.focusBlock.value }));
      on("hover-action", () => request("hoverBlockAction", { blockId: elements.focusBlock.value }));
      on("apply-text", () => request("updateText", {
        blockId: elements.focusBlock.value,
        text: document.getElementById("text-value").value,
      }));

      on("set-selection", () => request("setSelection", {
        blockId: elements.selectionBlock.value,
        start: Number(document.getElementById("selection-start").value),
        end: Number(document.getElementById("selection-end").value),
      }));
      on("open-selection-menu", () => request("openSelectionContext"));

      on("open-palette", () => request("openPalette", {
        trigger: document.getElementById("command-trigger").value,
        query: document.getElementById("command-query").value,
      }));
      on("palette-tab", () => request("paletteKey", { key: "Tab" }));
      on("palette-enter", () => request("paletteKey", { key: "Enter" }));
      on("palette-up", () => request("paletteKey", { key: "ArrowUp" }));
      on("palette-down", () => request("paletteKey", { key: "ArrowDown" }));
      on("palette-right", () => request("paletteKey", { key: "ArrowRight" }));
      on("palette-left", () => request("paletteKey", { key: "ArrowLeft" }));

      on("execute-command", () => request("executeCommand", {
        commandId: elements.commandSelect.value,
      }));
      on("dispatch-shortcut", () => request("dispatchShortcut", {
        combo: elements.shortcutSelect.value,
      }));

      on("open-block-menu", () => request("openBlockContext", {
        blockId: elements.contextBlock.value,
      }));
      on("execute-block-menu", async () => {
        if (!currentSnapshot || currentSnapshot.blockContextMenu.state.items.length === 0) {
          throw new Error("Open block context menu first");
        }

        const firstItem = currentSnapshot.blockContextMenu.state.items.find((item) => !item.disabled);
        if (!firstItem) {
          throw new Error("No enabled block context commands available");
        }

        await request("executeBlockContext", { commandId: firstItem.commandId });
      });
      on("execute-selection-menu", async () => {
        if (!currentSnapshot || currentSnapshot.selectionContextMenu.state.items.length === 0) {
          throw new Error("Open selection context menu first");
        }

        const firstItem = currentSnapshot.selectionContextMenu.state.items.find((item) => !item.disabled);
        if (!firstItem) {
          throw new Error("No enabled selection commands available");
        }

        await request("executeSelectionContext", { commandId: firstItem.commandId });
      });

      on("apply-dnd", async () => {
        const blockId = elements.dndBlock.value;
        const dropIndex = Number(document.getElementById("drop-index").value);

        await request("startDnD", { blockId });
        await request("setDropIndex", { index: dropIndex });
        await request("drop");
      });

      on("apply-event-filter", () => request("setEventFilter", {
        text: document.getElementById("event-text").value,
        source: document.getElementById("event-source").value,
      }));

      bootstrap().catch((error) => {
        setStatus(error instanceof Error ? error.message : String(error), true);
      });
    </script>
  </body>
</html>`;
}

ensureBuildArtifacts();

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);

    if (request.method === "GET" && url.pathname === "/") {
      sendHtml(response, renderLitePage());
      return;
    }

    if (request.method === "GET" && url.pathname === "/advanced") {
      sendHtml(response, renderAdvancedPage());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/state") {
      sendJson(response, 200, {
        snapshot: createSnapshot("Manual lab ready."),
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/action") {
      const body = await readJson(request);
      const action = body.action;
      const payload = body.payload ?? {};

      if (!action || typeof action !== "string") {
        sendJson(response, 400, {
          error: "Action name is required.",
        });
        return;
      }

      const statusMessage = await applyAction(action, payload);
      sendJson(response, 200, {
        snapshot: createSnapshot(statusMessage),
      });
      return;
    }

    sendJson(response, 404, {
      error: "Not found",
    });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log(`[pulse:manual-lab] ready at ${url}`);
  console.log("[pulse:manual-lab] If imports fail, rerun via npm script to keep Node specifier-resolution flag.");
});
