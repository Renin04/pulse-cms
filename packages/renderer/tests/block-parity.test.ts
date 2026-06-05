import { beforeEach, describe, expect, it } from "vitest";
import type { Block } from "@pulse/core";
import {
  RendererRegistry,
  renderBlock,
  renderDocument,
  registerBuiltinRenderers,
  registerBasicRenderers,
  registerInteractiveRenderers,
  registerPhase2Renderers,
  registerBlockRenderer,
  unknownBlockFallback,
  unknownBlockDevFallback,
} from "../src/index";
import {
  TextBlock,
  HeadingBlock,
  ListBlock,
  BlockquoteBlock,
  HorizontalRuleBlock,
  CodeBlock,
  ImageBlock,
  LinkBlock,
  VideoBlock,
  AudioBlock,
  EmbedBlock,
  CalloutBlock,
  AlertBlock,
  TableBlock,
  FileBlock,
  QuizBlock,
  PollBlock,
  AccordionBlock,
  TabsBlock,
  ToggleBlock,
  FlashcardBlock,
  SpoilerBlock,
  ChartBlock,
  TimelineBlock,
  BUILTIN_BLOCK_DEFINITIONS,
} from "../../blocks/src/index";

function makeBlock(type: string, data: Record<string, unknown>, id = "b1"): Block {
  return {
    id,
    type,
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("registerBuiltinRenderers", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
  });

  it("registers all built-in block types", () => {
    registerBuiltinRenderers();
    const registry = RendererRegistry.getInstance();
    for (const def of BUILTIN_BLOCK_DEFINITIONS) {
      expect(registry.has(def.type)).toBe(true);
    }
  });

  it("is idempotent — calling twice does not throw", () => {
    expect(() => {
      registerBuiltinRenderers();
      registerBuiltinRenderers();
    }).not.toThrow();
  });

  it("registerBlockRenderer registers a single definition", () => {
    registerBlockRenderer(TextBlock);
    expect(RendererRegistry.getInstance().has("text")).toBe(true);
  });
});

describe("registerBasicRenderers", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
  });

  it("registers the 8 basic block types", () => {
    registerBasicRenderers();
    const registry = RendererRegistry.getInstance();
    for (const type of ["text", "heading", "list", "blockquote", "horizontal-rule", "link", "code", "image"]) {
      expect(registry.has(type)).toBe(true);
    }
  });
});

describe("Text block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(TextBlock);
  });

  it("renders plain text in a <p> with data-block-type", () => {
    const block = makeBlock("text", { text: "Hello world", marks: { bold: false, italic: false, underline: false, code: false } });
    const { html } = renderBlock(block);
    expect(html).toBe('<p data-block-type="text">Hello world</p>');
  });

  it("renders bold text", () => {
    const block = makeBlock("text", { text: "Bold", marks: { bold: true, italic: false, underline: false, code: false } });
    const { html } = renderBlock(block);
    expect(html).toContain("<strong>Bold</strong>");
  });

  it("renders italic text", () => {
    const block = makeBlock("text", { text: "Italic", marks: { bold: false, italic: true, underline: false, code: false } });
    const { html } = renderBlock(block);
    expect(html).toContain("<em>Italic</em>");
  });

  it("renders code-marked text", () => {
    const block = makeBlock("text", { text: "code()", marks: { bold: false, italic: false, underline: false, code: true } });
    const { html } = renderBlock(block);
    expect(html).toContain("<code>code()</code>");
  });

  it("escapes HTML entities in text", () => {
    const block = makeBlock("text", { text: '<script>alert("xss")</script>', marks: { bold: false, italic: false, underline: false, code: false } });
    const { html } = renderBlock(block);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("Heading block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(HeadingBlock);
  });

  it("renders h1 with correct id attribute", () => {
    const block = makeBlock("heading", { text: "My Title", level: 1 });
    const { html } = renderBlock(block);
    expect(html).toMatch(/^<h1 id="my-title"/);
    expect(html).toContain("My Title</h1>");
  });

  it("renders h2 by default level", () => {
    const block = makeBlock("heading", { text: "Section", level: 2 });
    const { html } = renderBlock(block);
    expect(html).toMatch(/<h2/);
    expect(html).toContain("Section</h2>");
  });

  it("uses anchorId when provided", () => {
    const block = makeBlock("heading", { text: "My Title", level: 2, anchorId: "custom-anchor" });
    const { html } = renderBlock(block);
    expect(html).toContain('id="custom-anchor"');
  });

  it("includes data-block-type attribute", () => {
    const block = makeBlock("heading", { text: "Test", level: 3 });
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="heading"');
  });
});

describe("List block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(ListBlock);
  });

  it("renders unordered list", () => {
    const block = makeBlock("list", { style: "unordered", items: ["Alpha", "Beta"] });
    const { html } = renderBlock(block);
    expect(html).toMatch(/^<ul/);
    expect(html).toContain("<li>Alpha</li>");
    expect(html).toContain("<li>Beta</li>");
    expect(html).toContain('data-block-type="list"');
  });

  it("renders ordered list", () => {
    const block = makeBlock("list", { style: "numeric", items: ["First", "Second"] });
    const { html } = renderBlock(block);
    expect(html).toMatch(/^<ol/);
    expect(html).toContain("<li>First</li>");
  });

  it("renders ordered list with start attribute", () => {
    const block = makeBlock("list", { style: "numeric", items: ["Item"], start: 5 });
    const { html } = renderBlock(block);
    expect(html).toContain('start="5"');
  });
});

describe("Blockquote block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(BlockquoteBlock);
  });

  it("renders blockquote with quote text", () => {
    const block = makeBlock("blockquote", { quote: "Be yourself" });
    const { html } = renderBlock(block);
    expect(html).toContain("<blockquote");
    expect(html).toContain("<p>Be yourself</p>");
    expect(html).not.toContain("<cite>");
  });

  it("renders citation when provided", () => {
    const block = makeBlock("blockquote", { quote: "Be yourself", citation: "Oscar Wilde" });
    const { html } = renderBlock(block);
    expect(html).toContain(">Oscar Wilde</cite>");
  });
});

describe("HorizontalRule block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(HorizontalRuleBlock);
  });

  it("renders a self-closing <hr>", () => {
    const block = makeBlock("horizontal-rule", {});
    const { html } = renderBlock(block);
    expect(html).toContain("<hr");
    expect(html).toContain('data-block-type="horizontal-rule"');
  });
});

describe("Code block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(CodeBlock);
  });

  it("renders code in <pre><code> with language class", () => {
    const block = makeBlock("code", { code: "const x = 1;", language: "typescript", theme: "github-light", showLineNumbers: true });
    const { html } = renderBlock(block);
    expect(html).toContain('<pre data-block-type="code"');
    expect(html).toContain('data-language="typescript"');
    expect(html).toContain('class="language-typescript"');
    expect(html).toContain("const x = 1;");
  });

  it("escapes HTML in code content", () => {
    const block = makeBlock("code", { code: "<div>html</div>", language: "html", theme: "github-light", showLineNumbers: false });
    const { html } = renderBlock(block);
    expect(html).not.toContain("<div>");
    expect(html).toContain("&lt;div&gt;");
  });

  it("includes data-line-numbers when showLineNumbers is true", () => {
    const block = makeBlock("code", { code: "x", language: "javascript", theme: "github-light", showLineNumbers: true });
    const { html } = renderBlock(block);
    expect(html).toContain('data-line-numbers="true"');
  });
});

describe("Image block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(ImageBlock);
  });

  it("renders ready image with src", () => {
    const block = makeBlock("image", { src: "https://example.com/img.png", alt: "A photo", width: 800, height: 450, fit: "cover", status: "ready" });
    const { html } = renderBlock(block);
    expect(html).toContain('<figure data-block-type="image"');
    expect(html).toContain('src="https://example.com/img.png"');
    expect(html).toContain('alt="A photo"');
  });

  it("renders empty placeholder when src is null", () => {
    const block = makeBlock("image", { src: null, alt: "", width: 800, height: 450, fit: "cover", status: "idle" });
    const { html } = renderBlock(block);
    expect(html).toContain('data-status="empty"');
  });

  it("renders error state", () => {
    const block = makeBlock("image", { src: null, alt: "", width: 800, height: 450, fit: "cover", status: "error", errorMessage: "Upload failed" });
    const { html } = renderBlock(block);
    expect(html).toContain('data-status="error"');
    expect(html).toContain("Upload failed");
  });

  it("renders caption when provided", () => {
    const block = makeBlock("image", { src: "https://example.com/img.png", alt: "Photo", width: 800, height: 450, fit: "cover", status: "ready", caption: "A nice photo" });
    const { html } = renderBlock(block);
    expect(html).toContain("A nice photo</figcaption>");
  });
});

describe("Link block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(LinkBlock);
  });

  it("renders anchor with href and text", () => {
    const block = makeBlock("link", { text: "Visit Pulse", url: "https://pulse.dev", openInNewTab: false });
    const { html } = renderBlock(block);
    expect(html).toContain('<a');
    expect(html).toContain('href="https://pulse.dev"');
    expect(html).toContain("Visit Pulse");
  });

  it("adds target=_blank and rel for new tab", () => {
    const block = makeBlock("link", { text: "External", url: "https://example.com", openInNewTab: true });
    const { html } = renderBlock(block);
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noopener");
  });
});

describe("Video block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(VideoBlock);
  });

  it("renders video wrapper with data-block-type", () => {
    const block = makeBlock("video", { url: "https://www.youtube.com/watch?v=abc", provider: "youtube", title: "My video", autoplay: false, startAtSeconds: 0 });
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="video"');
  });
});

describe("Audio block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(AudioBlock);
  });

  it("renders audio element with src", () => {
    const block = makeBlock("audio", { src: "https://example.com/audio.mp3", title: "Podcast", autoplay: false, loop: false });
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="audio"');
    expect(html).toContain("https://example.com/audio.mp3");
  });
});

describe("Embed block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(EmbedBlock);
  });

  it("renders embed iframe wrapper with provider", () => {
    const block = makeBlock("embed", { url: "https://codepen.io/pen/abc", title: "Demo", provider: "codepen", aspectRatio: "16:9", allowFullscreen: true });
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="embed"');
    expect(html).toContain('data-provider="codepen"');
  });
});

describe("Callout block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(CalloutBlock);
  });

  it("renders callout with variant and body", () => {
    const block = makeBlock("callout", { variant: "info", title: "Note", body: "Keep this in mind.", icon: "i" });
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="callout"');
    expect(html).toContain('data-variant="info"');
    expect(html).toContain("Keep this in mind.");
  });

  it("renders warning variant", () => {
    const block = makeBlock("callout", { variant: "warning", body: "Careful!", icon: "⚠️" });
    const { html } = renderBlock(block);
    expect(html).toContain('data-variant="warning"');
  });
});

describe("Alert block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(AlertBlock);
  });

  it("renders alert with severity and message", () => {
    const block = makeBlock("alert", { severity: "success", message: "Operation complete.", dismissible: false, isDismissed: false });
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="alert"');
    expect(html).toContain('data-severity="success"');
    expect(html).toContain("Operation complete.");
  });

  it("renders dismissed alert with data-dismissed attribute", () => {
    const block = makeBlock("alert", { severity: "info", message: "Hello", dismissible: true, isDismissed: true });
    const { html } = renderBlock(block);
    expect(html).toContain('data-dismissed="true"');
  });
});

describe("Table block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(TableBlock);
  });

  it("renders table with headers and rows", () => {
    const block = makeBlock("table", { columns: ["Name", "Age"], rows: [["Alice", "30"], ["Bob", "25"]] });
    const { html } = renderBlock(block);
    expect(html).toContain('<table');
    expect(html).toContain("<th");
    expect(html).toContain("Name");
    expect(html).toContain("Alice");
  });

  it("renders caption when provided", () => {
    const block = makeBlock("table", { columns: ["X"], rows: [], caption: "Sample data" });
    const { html } = renderBlock(block);
    expect(html).toContain("<caption>Sample data</caption>");
  });
});

describe("File block renderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBlockRenderer(FileBlock);
  });

  it("renders file download link", () => {
    const block = makeBlock("file", { name: "report.pdf", url: "https://example.com/report.pdf", openInNewTab: false });
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="file"');
    expect(html).toContain("report.pdf");
  });
});

describe("Interactive block renderers", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerInteractiveRenderers();
  });

  it("renders quiz block", () => {
    const block = makeBlock("quiz", QuizBlock.defaultData as Record<string, unknown>);
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="quiz"');
  });

  it("renders poll block", () => {
    const block = makeBlock("poll", PollBlock.defaultData as Record<string, unknown>);
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="poll"');
  });
});

describe("Phase 2 expansion block renderers", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerPhase2Renderers();
  });

  it("renders accordion block", () => {
    const block = makeBlock("accordion", AccordionBlock.defaultData as Record<string, unknown>);
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="accordion"');
  });

  it("renders tabs block", () => {
    const block = makeBlock("tabs", TabsBlock.defaultData as Record<string, unknown>);
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="tabs"');
  });

  it("renders toggle block", () => {
    const block = makeBlock("toggle", ToggleBlock.defaultData as Record<string, unknown>);
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="toggle"');
  });

  it("renders flashcard block", () => {
    const block = makeBlock("flashcard", FlashcardBlock.defaultData as Record<string, unknown>);
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="flashcard"');
  });

  it("renders spoiler block", () => {
    const block = makeBlock("spoiler", SpoilerBlock.defaultData as Record<string, unknown>);
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="spoiler"');
  });

  it("renders chart block", () => {
    const block = makeBlock("chart", ChartBlock.defaultData as Record<string, unknown>);
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="chart"');
  });

  it("renders timeline block", () => {
    const block = makeBlock("timeline", TimelineBlock.defaultData as Record<string, unknown>);
    const { html } = renderBlock(block);
    expect(html).toContain('data-block-type="timeline"');
  });
});

describe("renderDocument with builtin renderers", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
    registerBuiltinRenderers();
  });

  it("renders a mixed document with multiple block types", () => {
    const blocks: Block[] = [
      makeBlock("heading", { text: "Welcome", level: 1 }, "h1"),
      makeBlock("text", { text: "Hello there", marks: { bold: false, italic: false, underline: false, code: false } }, "p1"),
      makeBlock("list", { style: "unordered", items: ["Point A", "Point B"] }, "l1"),
      makeBlock("horizontal-rule", {}, "hr1"),
    ];
    const { html, blocks: rendered } = renderDocument(blocks);
    expect(rendered).toHaveLength(4);
    expect(html).toContain("<h1");
    expect(html).toContain("<p");
    expect(html).toContain("<ul");
    expect(html).toContain("<hr");
  });

  it("per-block output has correct blockId and blockType", () => {
    const blocks: Block[] = [
      makeBlock("heading", { text: "Test", level: 2 }, "my-id"),
    ];
    const { blocks: rendered } = renderDocument(blocks);
    expect(rendered[0].blockId).toBe("my-id");
    expect(rendered[0].blockType).toBe("heading");
  });
});

describe("Unknown block fallbacks", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
  });

  it("unknownBlockFallback renders data-block-type=unknown with original type", () => {
    const block = makeBlock("my-custom-type", {});
    const html = unknownBlockFallback(block);
    expect(html).toContain('data-block-type="unknown"');
    expect(html).toContain('data-original-type="my-custom-type"');
    expect(html).toContain("my-custom-type");
  });

  it("unknownBlockDevFallback renders visible warning with block type", () => {
    const block = makeBlock("mystery-block", {});
    const html = unknownBlockDevFallback(block);
    expect(html).toContain("mystery-block");
    expect(html).toContain('role="alert"');
  });

  it("unknownBlockFallback escapes HTML in block type", () => {
    const block = makeBlock('<script>alert(1)</script>', {});
    const html = unknownBlockFallback(block);
    expect(html).not.toContain("<script>");
  });

  it("renderBlock uses string unknownBlockFallback config", () => {
    const block = makeBlock("no-renderer", {});
    const { html } = renderBlock(block, { unknownBlockFallback: "<!-- missing -->" });
    expect(html).toBe("<!-- missing -->");
  });

  it("renderBlock uses function unknownBlockFallback config", () => {
    const block = makeBlock("no-renderer", {});
    const { html } = renderBlock(block, {
      unknownBlockFallback: (b) => unknownBlockFallback(b),
    });
    expect(html).toContain('data-block-type="unknown"');
  });
});
