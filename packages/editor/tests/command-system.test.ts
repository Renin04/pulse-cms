import { describe, expect, it } from "vitest";

import type { Block } from "../../core/src/types/block";
import {
  createMacroCommands,
  createCommandPalette,
  createCommandRegistry,
  createEditorStateAdapter,
  parseSlashTrigger,
  replaceSlashTrigger,
  type EditorCommand,
  type EditorCommandContext,
} from "../src";

interface TextBlockData extends Record<string, unknown> {
  text: string;
}

type TextBlock = Block<TextBlockData>;

function createTextBlock(id: string, text: string): TextBlock {
  const timestamp = new Date().toISOString();

  return {
    id,
    type: "text",
    data: { text },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createContext(): EditorCommandContext<TextBlock> {
  const state = createEditorStateAdapter<TextBlock>({
    document: {
      blocks: [createTextBlock("seed", "Seed")],
    },
  });

  return { state };
}

describe("command registry primitives", () => {
  it("registers commands and rejects duplicate ids", () => {
    const registry = createCommandRegistry<TextBlock>();

    const command: EditorCommand<TextBlock> = {
      id: "insert.text",
      title: "Insert text",
      category: "Insert",
      execute() {},
    };

    registry.register(command);

    expect(registry.has("insert.text")).toBe(true);
    expect(registry.get("insert.text")?.title).toBe("Insert text");
    expect(() => registry.register(command)).toThrow(
      'Command with id "insert.text" is already registered',
    );
  });

  it("filters unavailable commands and supports fuzzy search", () => {
    const context = createContext();
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.heading",
          title: "Insert heading",
          category: "Insert",
          keywords: ["title", "h1", "heading"],
          execute() {},
        },
        {
          id: "debug.toggle",
          title: "Toggle debug mode",
          category: "Debug",
          isAvailable: () => false,
          execute() {},
        },
      ],
    });

    const headingResults = registry.search("h1", context);
    expect(headingResults).toHaveLength(1);
    expect(headingResults[0].command.id).toBe("insert.heading");

    const visibleResults = registry.search("", context);
    expect(visibleResults.map((result) => result.command.id)).toEqual([
      "insert.heading",
    ]);

    const allResults = registry.search("", context, { includeUnavailable: true });
    expect(allResults.map((result) => result.command.id)).toEqual([
      "insert.heading",
      "debug.toggle",
    ]);
  });

  it("uses seeded and executed recent commands for empty-query ranking", async () => {
    const context = createContext();
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.alpha",
          title: "Insert alpha",
          category: "Insert",
          execute() {},
        },
        {
          id: "insert.beta",
          title: "Insert beta",
          category: "Insert",
          execute() {},
        },
        {
          id: "insert.gamma",
          title: "Insert gamma",
          category: "Insert",
          execute() {},
        },
      ],
      recentCommandIds: ["insert.beta", "insert.alpha"],
    });

    const initial = registry.search("", context);
    expect(initial.map((result) => result.command.id).slice(0, 2)).toEqual([
      "insert.beta",
      "insert.alpha",
    ]);

    await registry.execute("insert.gamma", context);

    const next = registry.search("", context);
    expect(next.map((result) => result.command.id).slice(0, 3)).toEqual([
      "insert.gamma",
      "insert.beta",
      "insert.alpha",
    ]);
  });
});

describe("slash parser and command palette", () => {
  it("parses slash triggers and replaces slash ranges", () => {
    const match = parseSlashTrigger("Hello /heading", 14);

    expect(match).not.toBeNull();
    expect(match?.trigger).toBe("/");
    expect(match?.query).toBe("heading");
    expect(match?.range).toEqual({ start: 6, end: 14 });
    expect(replaceSlashTrigger("Hello /heading", match!, "")).toBe("Hello ");

    const backslashMatch = parseSlashTrigger("\\insert\\media", "\\insert\\media".length);
    expect(backslashMatch).not.toBeNull();
    expect(backslashMatch?.trigger).toBe("\\");
    expect(backslashMatch?.query).toBe("insert\\media");

    const bidiSlash = parseSlashTrigger("سلام \u200f/heading", "سلام \u200f/heading".length);
    expect(bidiSlash).not.toBeNull();
    expect(bidiSlash?.query).toBe("heading");

    expect(parseSlashTrigger("path/heading", 12)).toBeNull();
  });

  it("opens palette from slash text and renders grouped categories", () => {
    const context = createContext();
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.heading",
          title: "Insert heading",
          category: "Blocks",
          execute() {},
        },
        {
          id: "insert.image",
          title: "Insert image",
          category: "Media",
          execute() {},
        },
      ],
    });

    const palette = createCommandPalette({ registry });
    const state = palette.openFromText("/ins", 4, context);

    expect(state.isOpen).toBe(true);
    expect(state.results).toHaveLength(2);

    const html = palette.render();
    expect(html).toContain('data-command-palette="true"');
    expect(html).toContain('data-category="Blocks"');
    expect(html).toContain('data-category="Media"');
  });

  it("renders active command preview without mutating state on highlight", () => {
    const context = createContext();
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.alpha",
          title: "Insert alpha",
          category: "Insert",
          description: "Default alpha command",
          getPreview() {
            return "Preview alpha payload";
          },
          execute(commandContext) {
            commandContext.state.insertBlock(createTextBlock("alpha", "Alpha"));
          },
        },
      ],
    });

    const palette = createCommandPalette({ registry });
    const beforeCount = context.state.getSnapshot().document.blocks.length;
    const state = palette.openWithQuery("alpha", context);

    expect(state.activePreview).toBe("Preview alpha payload");
    expect(palette.render()).toContain('data-command-preview="true"');
    expect(context.state.getSnapshot().document.blocks).toHaveLength(beforeCount);
  });

  it("supports keyboard navigation and command execution integration", async () => {
    const context = createContext();

    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.alpha",
          title: "Insert alpha",
          category: "Insert",
          execute(commandContext) {
            commandContext.state.insertBlock(createTextBlock("insert-alpha", "Alpha"));
          },
        },
        {
          id: "insert.beta",
          title: "Insert beta",
          category: "Insert",
          execute(commandContext) {
            commandContext.state.insertBlock(createTextBlock("insert-beta", "Beta"));
          },
        },
      ],
    });

    const palette = createCommandPalette({ registry });
    palette.openWithQuery("", context);

    await palette.handleKey("ArrowDown", context);
    const executeAction = await palette.handleKey("Enter", context);

    expect(executeAction).toEqual({
      type: "executed",
      commandId: "insert.beta",
    });

    const documentBlocks = context.state.getSnapshot().document.blocks;
    expect(documentBlocks.map((block) => block.id)).toEqual([
      "seed",
      "insert-beta",
    ]);

    expect(palette.getState().isOpen).toBe(false);
    expect(registry.getRecentCommandIds()[0]).toBe("insert.beta");
  });

  it("wraps keyboard navigation and closes on escape", async () => {
    const context = createContext();
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.one",
          title: "Insert one",
          execute() {},
        },
        {
          id: "insert.two",
          title: "Insert two",
          execute() {},
        },
      ],
    });

    const palette = createCommandPalette({ registry });
    palette.openWithQuery("", context);

    await palette.handleKey("ArrowUp", context);

    expect(palette.getState().activeIndex).toBe(1);

    const closeAction = await palette.handleKey("Escape", context);
    expect(closeAction).toEqual({ type: "closed" });
    expect(palette.getState().isOpen).toBe(false);
  });

  it("supports nested command submenus and path navigation", async () => {
    const context = createContext();
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.video",
          title: "Insert video",
          category: "Media",
          menuPath: ["insert", "media"],
          execute() {},
        },
        {
          id: "insert.audio",
          title: "Insert audio",
          category: "Media",
          menuPath: ["insert", "media"],
          execute() {},
        },
      ],
    });

    const palette = createCommandPalette({ registry });
    const rootState = palette.openWithQuery("", context);

    expect(rootState.submenuEntries.map((entry) => entry.path.join("/"))).toEqual(["insert"]);

    const navigateIntoInsert = await palette.handleKey("Enter", context);
    expect(navigateIntoInsert.type).toBe("navigated");
    expect(navigateIntoInsert.path).toEqual(["insert"]);

    const insertState = palette.getState();
    expect(insertState.path).toEqual(["insert"]);
    expect(insertState.submenuEntries.map((entry) => entry.path.join("/"))).toEqual([
      "insert/media",
    ]);

    const navigateIntoMedia = await palette.handleKey("ArrowRight", context);
    expect(navigateIntoMedia.type).toBe("navigated");
    expect(navigateIntoMedia.path).toEqual(["insert", "media"]);

    const mediaState = palette.getState();
    expect(mediaState.path).toEqual(["insert", "media"]);
    expect(mediaState.results.map((result) => result.command.id)).toEqual([
      "insert.audio",
      "insert.video",
    ]);

    const navigateBack = await palette.handleKey("ArrowLeft", context);
    expect(navigateBack).toEqual({
      type: "navigated",
      path: ["insert"],
    });
  });

  it("parses nested slash queries into menu paths", () => {
    const context = createContext();
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.video",
          title: "Insert video",
          category: "Media",
          menuPath: ["insert", "media"],
          execute() {},
        },
      ],
    });
    const palette = createCommandPalette({ registry });
    const state = palette.openFromText("/insert/media/vid", 17, context);

    expect(state.path).toEqual(["insert", "media"]);
    expect(state.query).toBe("vid");
    expect(state.results.map((result) => result.command.id)).toEqual(["insert.video"]);
  });

  it("supports tab as preliminary suggestion before final enter execution", async () => {
    const context = createContext();
    const insertedBlockIds: string[] = [];
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.video",
          title: "Insert video",
          category: "Media",
          menuPath: ["insert", "media"],
          slashTrigger: "video",
          execute(commandContext) {
            insertedBlockIds.push("insert.video");
            commandContext.state.insertBlock(createTextBlock("video-1", "Video"));
          },
        },
      ],
    });

    const palette = createCommandPalette({ registry });
    palette.openFromText("/ins", 4, context);

    const firstTab = await palette.handleKey("Tab", context);
    expect(firstTab).toEqual({
      type: "suggested",
      path: ["insert"],
    });
    expect(insertedBlockIds).toHaveLength(0);

    const secondTab = await palette.handleKey("Tab", context);
    expect(secondTab).toEqual({
      type: "suggested",
      path: ["insert", "media"],
    });
    expect(insertedBlockIds).toHaveLength(0);

    expect(palette.render()).toContain("/insert/media/");

    const executeResult = await palette.handleKey("Enter", context);
    expect(executeResult).toEqual({
      type: "executed",
      commandId: "insert.video",
    });
    expect(insertedBlockIds).toEqual(["insert.video"]);
  });

  it("handles Persian command aliases for slash and backslash triggers", async () => {
    const context = createContext();
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.heading",
          title: "Insert heading",
          category: "Insert",
          slashTrigger: "heading",
          aliases: ["تیتر", "سرتیتر"],
          execute() {},
        },
      ],
    });
    const palette = createCommandPalette({ registry });

    const slashState = palette.openFromText("/تی", "/تی".length, context);
    expect(slashState.results.map((result) => result.command.id)).toEqual(["insert.heading"]);

    const backslashState = palette.openFromText("\\تی", "\\تی".length, context);
    expect(backslashState.results.map((result) => result.command.id)).toEqual([
      "insert.heading",
    ]);
    expect(palette.render()).toContain("\\تی");

    const bidiState = palette.openFromText(
      "/\u200fتی",
      "/\u200fتی".length,
      context,
    );
    expect(bidiState.results.map((result) => result.command.id)).toEqual(["insert.heading"]);
  });

  it("supports backslash macro menu with quick insert and template commands", async () => {
    const context = createContext();
    const registry = createCommandRegistry<TextBlock>();
    const { commands, macroRegistry } = createMacroCommands<TextBlock>({
      currentAuthor: "Pulse QA",
    });

    for (const command of commands) {
      registry.register(command);
    }

    expect(macroRegistry.list()).toHaveLength(5);

    const palette = createCommandPalette({ registry });
    const openState = palette.openFromText("\\date", "\\date".length, context);

    expect(openState.trigger?.trigger).toBe("\\");
    expect(openState.results.some((result) => result.command.id === "editor.macro.insertDate")).toBe(
      true,
    );

    const executeAction = await palette.handleKey("Enter", context);
    expect(executeAction).toEqual({
      type: "executed",
      commandId: "editor.macro.insertDate",
    });

    const blocks = context.state.getSnapshot().document.blocks;
    expect(blocks).toHaveLength(2);
    expect(typeof blocks[1].data.text).toBe("string");

    await registry.execute("editor.macro.template.note", context);
    const finalBlocks = context.state.getSnapshot().document.blocks;
    expect(finalBlocks).toHaveLength(5);
  });
});

describe("command aliases — resolveByAlias / findByAlias / getAliasMap (PM-023)", () => {
  it("resolves a command by exact alias string", () => {
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.heading",
          title: "Insert heading",
          category: "Insert",
          aliases: ["title", "h1"],
          execute() {},
        },
      ],
    });

    const command = registry.resolveByAlias("title");
    expect(command?.id).toBe("insert.heading");
  });

  it("resolves alias case-insensitively after normalisation", () => {
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "format.bold",
          title: "Bold",
          aliases: ["STRONG", "بولد"],
          execute() {},
        },
      ],
    });

    expect(registry.resolveByAlias("strong")?.id).toBe("format.bold");
    expect(registry.resolveByAlias("STRONG")?.id).toBe("format.bold");
    expect(registry.resolveByAlias("بولد")?.id).toBe("format.bold");
  });

  it("returns undefined for unknown alias", () => {
    const registry = createCommandRegistry<TextBlock>();
    expect(registry.resolveByAlias("nonexistent")).toBeUndefined();
  });

  it("findByAlias is an alias for resolveByAlias", () => {
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.link",
          title: "Insert link",
          aliases: ["url"],
          execute() {},
        },
      ],
    });

    expect(registry.findByAlias("url")?.id).toBe("insert.link");
  });

  it("getAliasMap returns all registered alias → commandId pairs", () => {
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.heading",
          title: "Insert heading",
          aliases: ["title", "h1"],
          execute() {},
        },
        {
          id: "insert.image",
          title: "Insert image",
          aliases: ["photo", "pic"],
          execute() {},
        },
      ],
    });

    const aliasMap = registry.getAliasMap();
    expect(aliasMap.get("title")).toBe("insert.heading");
    expect(aliasMap.get("h1")).toBe("insert.heading");
    expect(aliasMap.get("photo")).toBe("insert.image");
    expect(aliasMap.get("pic")).toBe("insert.image");
  });

  it("removes aliases from index when a command is unregistered", () => {
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.video",
          title: "Insert video",
          aliases: ["movie"],
          execute() {},
        },
      ],
    });

    expect(registry.resolveByAlias("movie")?.id).toBe("insert.video");
    registry.unregister("insert.video");
    expect(registry.resolveByAlias("movie")).toBeUndefined();
    expect(registry.getAliasMap().has("movie")).toBe(false);
  });

  it("aliases participate in search scoring", () => {
    const context = createContext();
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "insert.heading",
          title: "Insert heading",
          aliases: ["title", "تیتر"],
          execute() {},
        },
        {
          id: "insert.paragraph",
          title: "Insert paragraph",
          execute() {},
        },
      ],
    });

    const results = registry.search("تیتر", context);
    expect(results[0].command.id).toBe("insert.heading");
  });

  it("does not index duplicate alias (first registration wins)", () => {
    const registry = createCommandRegistry<TextBlock>({
      commands: [
        {
          id: "cmd.one",
          title: "One",
          aliases: ["shared"],
          execute() {},
        },
        {
          id: "cmd.two",
          title: "Two",
          aliases: ["shared"],
          execute() {},
        },
      ],
    });

    const resolved = registry.resolveByAlias("shared");
    expect(resolved?.id).toBe("cmd.one");
  });
});
