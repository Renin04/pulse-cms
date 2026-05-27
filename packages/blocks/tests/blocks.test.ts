import { beforeEach, describe, expect, it } from "vitest";

import { BlockRegistry } from "../../core/src/registry/BlockRegistry";
import {
  AccordionBlock,
  addAccordionItem,
  addCarouselSlide,
  addChartDataset,
  addComparisonRow,
  addFlashcard,
  addGalleryImage,
  addImageHotspot,
  addMangaPanel,
  addPollOption,
  addQuizOption,
  addSurveyQuestion,
  addTabItem,
  addTimelineEntry,
  addTableRow,
  AnnotatedImageBlock,
  AlertBlock,
  AudioBlock,
  applyImageUploadError,
  applyImageUploadSuccess,
  BASIC_BLOCK_DEFINITIONS,
  BeforeAfterBlock,
  CalloutBlock,
  CardBlock,
  CarouselBlock,
  ChartBlock,
  BlockquoteBlock,
  CodeBlock,
  ComparisonBlock,
  DiagramBlock,
  dismissAlert,
  EmbedBlock,
  EXTENDED_BLOCK_DEFINITIONS,
  FileBlock,
  FlashcardBlock,
  GalleryBlock,
  HeadingBlock,
  HeroSectionBlock,
  HorizontalRuleBlock,
  ImageBlock,
  INTERACTIVE_CREATIVE_BLOCK_DEFINITIONS,
  MapBlock,
  MathEquationBlock,
  ListBlock,
  LinkBlock,
  MangaPanelBlock,
  PHASE2_EXPANSION_BLOCK_DEFINITIONS,
  PollBlock,
  QuizBlock,
  registerInteractiveCreativeBlocks,
  registerBasicBlocks,
  registerExtendedBlocks,
  registerPhase2ExpansionBlocks,
  resizeImage,
  resetAlert,
  setActiveTab,
  setBeforeAfterPosition,
  setMangaLayout,
  setCodeBlockHighlighter,
  SpoilerBlock,
  SpeechBubbleBlock,
  startImageUpload,
  SurveyBlock,
  SUPPORTED_CODE_LANGUAGES,
  supportsCodeLanguage,
  TabsBlock,
  TableBlock,
  TextBlock,
  TimelineBlock,
  ToggleBlock,
  toggleQuizOptionCorrect,
  toggleDefaultState,
  updateCallout,
  updateSurveyQuestion,
  updateTableCell,
  VideoBlock,
  votePollOption,
} from "../src";

describe("basic block definitions", () => {
  beforeEach(() => {
    BlockRegistry.resetInstance();
    setCodeBlockHighlighter(null);
  });

  it("exports all basic block definitions", () => {
    expect(BASIC_BLOCK_DEFINITIONS.map((block) => block.type)).toEqual([
      "text",
      "heading",
      "list",
      "blockquote",
      "horizontal-rule",
      "link",
      "code",
      "image",
    ]);
  });

  it("registers all basic blocks with the core registry", () => {
    const registry = BlockRegistry.getInstance();

    const firstBatch = registerBasicBlocks(registry);
    const secondBatch = registerBasicBlocks(registry);

    expect(firstBatch).toHaveLength(8);
    expect(secondBatch).toHaveLength(0);
    expect(registry.has("text")).toBe(true);
    expect(registry.has("heading")).toBe(true);
    expect(registry.has("list")).toBe(true);
    expect(registry.has("blockquote")).toBe(true);
    expect(registry.has("horizontal-rule")).toBe(true);
    expect(registry.has("link")).toBe(true);
    expect(registry.has("code")).toBe(true);
    expect(registry.has("image")).toBe(true);
  });
});

describe("extended block definitions", () => {
  beforeEach(() => {
    BlockRegistry.resetInstance();
  });

  it("exports extended block definitions for editor session 11-12", () => {
    expect(EXTENDED_BLOCK_DEFINITIONS.map((block) => block.type)).toEqual([
      "video",
      "audio",
      "file",
      "table",
      "embed",
      "callout",
      "alert",
    ]);
  });

  it("registers extended blocks with the core registry", () => {
    const registry = BlockRegistry.getInstance();

    const firstBatch = registerExtendedBlocks(registry);
    const secondBatch = registerExtendedBlocks(registry);

    expect(firstBatch).toHaveLength(7);
    expect(secondBatch).toHaveLength(0);
    expect(registry.has("video")).toBe(true);
    expect(registry.has("audio")).toBe(true);
    expect(registry.has("file")).toBe(true);
    expect(registry.has("table")).toBe(true);
    expect(registry.has("embed")).toBe(true);
    expect(registry.has("callout")).toBe(true);
    expect(registry.has("alert")).toBe(true);
  });
});

describe("interactive/creative block definitions", () => {
  beforeEach(() => {
    BlockRegistry.resetInstance();
  });

  it("exports interactive and creative block definitions for session 13-14", () => {
    expect(INTERACTIVE_CREATIVE_BLOCK_DEFINITIONS.map((block) => block.type)).toEqual([
      "quiz",
      "poll",
      "survey",
      "manga-panel",
      "speech-bubble",
      "card",
      "gallery",
      "carousel",
    ]);
  });

  it("registers interactive/creative blocks with the core registry", () => {
    const registry = BlockRegistry.getInstance();

    const firstBatch = registerInteractiveCreativeBlocks(registry);
    const secondBatch = registerInteractiveCreativeBlocks(registry);

    expect(firstBatch).toHaveLength(8);
    expect(secondBatch).toHaveLength(0);
    expect(registry.has("quiz")).toBe(true);
    expect(registry.has("poll")).toBe(true);
    expect(registry.has("survey")).toBe(true);
    expect(registry.has("manga-panel")).toBe(true);
    expect(registry.has("speech-bubble")).toBe(true);
    expect(registry.has("card")).toBe(true);
    expect(registry.has("gallery")).toBe(true);
    expect(registry.has("carousel")).toBe(true);
  });
});

describe("phase 2 expansion block definitions", () => {
  beforeEach(() => {
    BlockRegistry.resetInstance();
  });

  it("exports phase 2 expansion block definitions for pre-migration PM-8", () => {
    expect(PHASE2_EXPANSION_BLOCK_DEFINITIONS.map((block) => block.type)).toEqual([
      "flashcard",
      "accordion",
      "tabs",
      "toggle",
      "spoiler",
      "chart",
      "map",
      "math-equation",
      "diagram",
      "timeline",
      "comparison",
      "before-after",
      "hero-section",
      "annotated-image",
    ]);
  });

  it("registers phase 2 expansion blocks with the core registry", () => {
    const registry = BlockRegistry.getInstance();

    const firstBatch = registerPhase2ExpansionBlocks(registry);
    const secondBatch = registerPhase2ExpansionBlocks(registry);

    expect(firstBatch).toHaveLength(14);
    expect(secondBatch).toHaveLength(0);
    expect(registry.has("flashcard")).toBe(true);
    expect(registry.has("accordion")).toBe(true);
    expect(registry.has("tabs")).toBe(true);
    expect(registry.has("toggle")).toBe(true);
    expect(registry.has("spoiler")).toBe(true);
    expect(registry.has("chart")).toBe(true);
    expect(registry.has("map")).toBe(true);
    expect(registry.has("math-equation")).toBe(true);
    expect(registry.has("diagram")).toBe(true);
    expect(registry.has("timeline")).toBe(true);
    expect(registry.has("comparison")).toBe(true);
    expect(registry.has("before-after")).toBe(true);
    expect(registry.has("hero-section")).toBe(true);
    expect(registry.has("annotated-image")).toBe(true);
  });
});

describe("TextBlock", () => {
  it("renders, serializes, and deserializes text data with inline formatting", () => {
    const data = {
      text: "Hello Pulse",
      marks: {
        bold: true,
        italic: false,
        underline: false,
        code: false,
      },
    };

    const html = TextBlock.render(data);
    expect(html).toContain("<strong>Hello Pulse</strong>");

    const serialized = TextBlock.serialize(data);
    const restored = TextBlock.deserialize(serialized);
    expect(restored).toEqual(data);
  });

  it("renders inline code marks and escapes html in code spans", () => {
    const html = TextBlock.render({
      text: '<script>alert("xss")</script>',
      marks: {
        bold: false,
        italic: false,
        underline: false,
        code: true,
      },
    });

    expect(html).toContain("<code>");
    expect(html).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("renders with alignment attribute (PM4-2)", () => {
    const html = TextBlock.render({
      text: "Centered text",
      marks: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
      },
      align: "center",
    });

    expect(html).toContain('style="text-align: center;"');
    expect(html).toContain("<p data-block-type=\"text\"");
  });

  it("renders without style attribute for left alignment (default)", () => {
    const html = TextBlock.render({
      text: "Left text",
      marks: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
      },
      align: "left",
    });

    expect(html).not.toContain("style=");
    expect(html).toContain("<p data-block-type=\"text\">");
  });

  it("supports all alignment options", () => {
    const alignments: Array<"left" | "center" | "right" | "justify"> = [
      "left",
      "center",
      "right",
      "justify",
    ];

    for (const align of alignments) {
      const html = TextBlock.render({
        text: "Test",
        marks: { bold: false, italic: false, underline: false, code: false },
        align,
      });

      if (align === "left") {
        expect(html).not.toContain("style=");
      } else {
        expect(html).toContain(`style="text-align: ${align};"`);
      }
    }
  });
});

describe("HeadingBlock", () => {
  it("renders heading tags with level and auto-generated anchor", () => {
    const html = HeadingBlock.render({
      text: "Core Session",
      level: 3,
    });

    expect(html).toContain("<h3");
    expect(html).toContain('id="core-session"');
  });

  it("serializes and deserializes heading data", () => {
    const data = {
      text: "Heading",
      level: 2 as const,
      anchorId: "heading-anchor",
    };

    expect(HeadingBlock.deserialize(HeadingBlock.serialize(data))).toEqual(data);
  });
});

describe("ListBlock", () => {
  it("renders ordered and unordered list variants", () => {
    const ordered = ListBlock.render({
      style: "numeric",
      items: ["first", "second"],
      start: 4,
    });
    const unordered = ListBlock.render({
      style: "unordered",
      items: ["alpha"],
    });

    expect(ordered).toContain("<ol");
    expect(ordered).toContain('start="4"');
    expect(unordered).toContain("<ul");
  });

  it("accepts legacy ordered boolean list data", () => {
    const ordered = ListBlock.render({
      ordered: true,
      items: ["first", "second"],
      start: 2,
    });
    const unordered = ListBlock.deserialize(
      JSON.stringify({
        ordered: false,
        items: ["alpha"],
      }),
    );

    expect(ordered).toContain("<ol");
    expect(ordered).toContain('start="2"');
    expect(unordered).toEqual({
      style: "unordered",
      items: ["alpha"],
    });
  });

  it("renders roman and abjad list variants", () => {
    const roman = ListBlock.render({
      style: "roman",
      items: ["first", "second"],
    });
    const abjad = ListBlock.render({
      style: "abjad",
      items: ["اول", "دوم"],
    });

    expect(roman).toContain('class="pulse-list-roman"');
    expect(roman).toContain("<ol");
    expect(abjad).toContain('data-list-style="abjad"');
    expect(abjad).toContain('data-marker="ا"');
    expect(abjad).toContain('data-marker="ب"');
  });

  it("allows empty items via schema", () => {
    expect(() =>
      ListBlock.deserialize(
        JSON.stringify({
          style: "unordered",
          items: [],
        }),
      ),
    ).not.toThrow();
  });
});

describe("BlockquoteBlock", () => {
  it("renders quote and citation content", () => {
    const html = BlockquoteBlock.render({
      quote: "Talk is cheap. Show me the code.",
      citation: "Linus Torvalds",
    });

    expect(html).toContain("<blockquote");
    expect(html).toContain(">Linus Torvalds</cite>");
  });

  it("serializes and deserializes blockquote data", () => {
    const data = {
      quote: "Ship small, learn fast.",
      citation: "Pulse Team",
    };

    expect(BlockquoteBlock.deserialize(BlockquoteBlock.serialize(data))).toEqual(data);
  });
});

describe("HorizontalRuleBlock", () => {
  it("renders and round-trips empty data safely", () => {
    const data = {};
    const html = HorizontalRuleBlock.render(data);

    expect(html).toContain("<hr");
    expect(HorizontalRuleBlock.deserialize(HorizontalRuleBlock.serialize(data))).toEqual(
      data,
    );
  });
});

describe("LinkBlock", () => {
  it("renders safe anchor attributes for external links", () => {
    const html = LinkBlock.render({
      text: "Pulse",
      url: "https://example.com/docs",
      openInNewTab: true,
      title: "Open docs",
    });

    expect(html).toContain('href="https://example.com/docs"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("rejects javascript protocol links", () => {
    expect(() =>
      LinkBlock.deserialize(
        JSON.stringify({
          text: "Bad",
          url: "javascript:alert(1)",
          openInNewTab: false,
        }),
      ),
    ).toThrow("Unsupported link protocol");
  });
});

describe("CodeBlock", () => {
  it("supports at least ten languages", () => {
    expect(SUPPORTED_CODE_LANGUAGES.length).toBeGreaterThanOrEqual(10);
    expect(supportsCodeLanguage("typescript")).toBe(true);
    expect(supportsCodeLanguage("http")).toBe(true);
    expect(supportsCodeLanguage("unknown-language")).toBe(false);
  });

  it("renders fallback html without a highlighter", () => {
    const html = CodeBlock.render({
      code: "const value = 1;",
      language: "typescript",
      theme: "github-light",
      showLineNumbers: true,
      mode: "show",
    });

    expect(html).toContain("<pre");
    expect(html).toContain("language-typescript");
  });

  it("uses shiki-like highlighter when configured", () => {
    setCodeBlockHighlighter({
      codeToHtml(code, options) {
        return `<pre data-lang="${options.lang}" data-theme="${options.theme}">${code}</pre>`;
      },
    });

    const html = CodeBlock.render({
      code: "console.log('pulse')",
      language: "javascript",
      theme: "github-dark",
      showLineNumbers: false,
      mode: "show",
    });

    expect(html).toContain('data-lang="javascript"');
    expect(html).toContain('data-theme="github-dark"');
  });

  it("accepts legacy code blocks without theme", () => {
    const parsed = CodeBlock.deserialize(
      JSON.stringify({
        code: "GET /blog HTTP/1.1",
        language: "http",
        showLineNumbers: true,
      }),
    );

    expect(parsed).toEqual({
      code: "GET /blog HTTP/1.1",
      language: "http",
      theme: "github-light",
      showLineNumbers: true,
      mode: "show",
    });
  });
});

describe("ImageBlock", () => {
  it("handles upload success, resize, and upload errors gracefully", () => {
    const initial =
      typeof ImageBlock.defaultData === "function"
        ? ImageBlock.defaultData()
        : ImageBlock.defaultData;

    const uploading = startImageUpload(initial);
    expect(uploading.status).toBe("uploading");

    const ready = applyImageUploadSuccess(uploading, {
      src: "https://example.com/image.png",
      width: 1200,
      height: 800,
      alt: "hero",
    });

    expect(ready.status).toBe("ready");
    expect(ready.src).toBe("https://example.com/image.png");

    const resized = resizeImage(ready, 600, 400);
    expect(resized.width).toBe(600);
    expect(resized.height).toBe(400);

    const errored = applyImageUploadError(resized, new Error("Network error"));
    expect(errored.status).toBe("error");
    expect(errored.errorMessage).toBe("Network error");

    const html = ImageBlock.render(errored);
    expect(html).toContain('role="alert"');
  });

  it("serializes and deserializes image data", () => {
    const data = {
      src: "https://example.com/photo.jpg",
      alt: "cover",
      width: 800,
      height: 600,
      caption: "A cover image",
      fit: "contain" as const,
      status: "ready" as const,
    };

    expect(ImageBlock.deserialize(ImageBlock.serialize(data))).toEqual(data);
  });

  it("handles full metadata workflow with title, credit, source, license (PM4-3)", () => {
    const initial =
      typeof ImageBlock.defaultData === "function"
        ? ImageBlock.defaultData()
        : ImageBlock.defaultData;

    const ready = applyImageUploadSuccess(initial, {
      src: "https://example.com/photo.jpg",
      width: 1200,
      height: 800,
      alt: "A mountain landscape",
      title: "Mountain view at sunset",
      caption: "Beautiful mountain scenery",
      credit: "Photo by John Doe",
      source: "https://example.com/gallery",
      license: "CC BY-SA 4.0",
    });

    expect(ready.alt).toBe("A mountain landscape");
    expect(ready.title).toBe("Mountain view at sunset");
    expect(ready.caption).toBe("Beautiful mountain scenery");
    expect(ready.credit).toBe("Photo by John Doe");
    expect(ready.source).toBe("https://example.com/gallery");
    expect(ready.license).toBe("CC BY-SA 4.0");
  });

  it("renders image with title attribute (PM4-3)", () => {
    const data = {
      src: "https://example.com/photo.jpg",
      alt: "Mountain",
      title: "Mountain view",
      width: 800,
      height: 600,
      fit: "cover" as const,
      status: "ready" as const,
    };

    const html = ImageBlock.render(data);
    expect(html).toContain('title="Mountain view"');
  });

  it("renders image with attribution metadata (PM4-3)", () => {
    const data = {
      src: "https://example.com/photo.jpg",
      alt: "City skyline",
      width: 800,
      height: 600,
      credit: "Jane Smith",
      source: "https://unsplash.com",
      license: "CC0",
      fit: "cover" as const,
      status: "ready" as const,
    };

    const html = ImageBlock.render(data);
    expect(html).toContain('class="image-attribution"');
    expect(html).toContain("Credit: Jane Smith");
    expect(html).toContain("Source: https://unsplash.com");
    expect(html).toContain("License: CC0");
  });

  it("renders image without attribution when metadata is empty (PM4-3)", () => {
    const data = {
      src: "https://example.com/photo.jpg",
      alt: "Simple image",
      width: 800,
      height: 600,
      fit: "cover" as const,
      status: "ready" as const,
    };

    const html = ImageBlock.render(data);
    expect(html).not.toContain('class="image-attribution"');
  });

  it("serializes and deserializes full metadata (PM4-3)", () => {
    const data = {
      src: "https://example.com/photo.jpg",
      alt: "Test image",
      title: "Image title",
      width: 800,
      height: 600,
      caption: "Image caption",
      credit: "Photographer name",
      source: "https://source.com",
      license: "MIT",
      fit: "cover" as const,
      status: "ready" as const,
    };

    const serialized = ImageBlock.serialize(data);
    const deserialized = ImageBlock.deserialize(serialized);

    expect(deserialized).toEqual(data);
  });
});

describe("VideoBlock", () => {
  it("renders html5 video and round-trips serialized data", () => {
    const data = {
      url: "https://cdn.example.com/video.mp4",
      provider: "html5" as const,
      title: "Product demo",
      caption: "Watch the walkthrough",
      autoplay: false,
      startAtSeconds: 12,
    };

    const html = VideoBlock.render(data);
    expect(html).toContain('data-block-type="video"');
    expect(html).toContain("<video");
    expect(VideoBlock.deserialize(VideoBlock.serialize(data))).toEqual(data);
  });

  it("rejects unsafe video protocols", () => {
    expect(() =>
      VideoBlock.deserialize(
        JSON.stringify({
          url: "javascript:alert(1)",
          provider: "youtube",
          title: "Unsafe",
          autoplay: false,
          startAtSeconds: 0,
        }),
      ),
    ).toThrow("Unsupported video URL protocol");
  });
});

describe("AudioBlock", () => {
  it("renders audio player metadata and serializes data", () => {
    const data = {
      src: "https://cdn.example.com/audio.mp3",
      title: "Podcast",
      artist: "Pulse Team",
      autoplay: false,
      loop: true,
    };

    const html = AudioBlock.render(data);
    expect(html).toContain("<audio");
    expect(html).toContain("Podcast - Pulse Team");
    expect(AudioBlock.deserialize(AudioBlock.serialize(data))).toEqual(data);
  });
});

describe("FileBlock", () => {
  it("renders a secure file link with metadata", () => {
    const data = {
      name: "Release Notes",
      url: "https://example.com/release-notes.pdf",
      sizeBytes: 2_560_000,
      mimeType: "application/pdf",
      openInNewTab: true,
    };

    const html = FileBlock.render(data);
    expect(html).toContain('data-block-type="file"');
    expect(html).toContain("application/pdf");
    expect(html).toContain("MB");
  });
});

describe("TableBlock", () => {
  it("supports row/cell edit helpers with schema validation", () => {
    const initial = {
      columns: ["Name", "Role"],
      rows: [["Ava", "Engineer"]],
    };

    const withRow = addTableRow(initial, ["Leo", "Designer"]);
    const withCellUpdate = updateTableCell(withRow, 1, 1, "Product Designer");
    const html = TableBlock.render(withCellUpdate);

    expect(withCellUpdate.rows[1][1]).toBe("Product Designer");
    expect(html).toContain("<table>");
    expect(html).toContain("Product Designer");
  });

  it("rejects rows with invalid column counts", () => {
    expect(() =>
      TableBlock.deserialize(
        JSON.stringify({
          columns: ["Only"],
          rows: [["Too", "Many"]],
        }),
      ),
    ).toThrow("must include 1 columns");
  });
});

describe("EmbedBlock", () => {
  it("renders iframe embed with aspect ratio wrapper", () => {
    const html = EmbedBlock.render({
      url: "https://example.com/embed/123",
      title: "Prototype",
      provider: "figma",
      aspectRatio: "16:9",
      allowFullscreen: true,
    });

    expect(html).toContain('data-block-type="embed"');
    expect(html).toContain("<iframe");
    expect(html).toContain("padding-top:56.25%");
  });
});

describe("CalloutBlock", () => {
  it("updates callout data through validated patch helper", () => {
    const next = updateCallout(
      {
        variant: "info",
        title: "Heads up",
        body: "Original copy",
      },
      {
        variant: "warning",
        body: "Updated copy",
      },
    );

    expect(next.variant).toBe("warning");
    expect(CalloutBlock.render(next)).toContain('data-variant="warning"');
  });
});

describe("AlertBlock", () => {
  it("supports dismiss/reset helpers and render states", () => {
    const ready = {
      severity: "warning" as const,
      title: "Storage warning",
      message: "You are close to your storage limit.",
      dismissible: true,
      isDismissed: false,
    };

    const dismissed = dismissAlert(ready);
    expect(dismissed.isDismissed).toBe(true);
    expect(AlertBlock.render(dismissed)).toContain('data-dismissed="true"');

    const reset = resetAlert(dismissed);
    expect(reset.isDismissed).toBe(false);
    expect(AlertBlock.render(reset)).toContain('role="alert"');
  });

  it("rejects dismissing non-dismissible alerts", () => {
    expect(() =>
      dismissAlert({
        severity: "info",
        message: "Always visible",
        dismissible: false,
        isDismissed: false,
      }),
    ).toThrow("Alert is not dismissible");
  });
});

describe("QuizBlock", () => {
  it("adds options and toggles the correct answer for single-choice quizzes", () => {
    const withOption = addQuizOption(
      {
        question: "Best insertion trigger?",
        options: [
          { id: "q1", text: "/menu", isCorrect: true },
          { id: "q2", text: "Right click", isCorrect: false },
        ],
        allowMultiple: false,
        randomizeOptions: false,
        showExplanations: true,
      },
      { text: "Keyboard shortcut" },
    );

    const toggled = toggleQuizOptionCorrect(withOption, "q2");
    expect(toggled.options.find((option) => option.id === "q2")?.isCorrect).toBe(true);
    expect(toggled.options.find((option) => option.id === "q1")?.isCorrect).toBe(false);
    expect(QuizBlock.render(toggled)).toContain('data-block-type="quiz"');
  });
});

describe("PollBlock", () => {
  it("supports poll option append and vote updates", () => {
    const withOption = addPollOption(
      {
        question: "Favorite editor path?",
        options: [
          { id: "p1", label: "Slash command", votes: 3 },
          { id: "p2", label: "Toolbar", votes: 1 },
        ],
        allowMultiple: false,
      },
      "Shortcut",
    );
    const voted = votePollOption(withOption, "p2", 2);

    expect(voted.options.find((option) => option.id === "p2")?.votes).toBe(3);
    expect(PollBlock.render(voted)).toContain("Favorite editor path?");
  });
});

describe("SurveyBlock", () => {
  it("adds and updates survey questions with validation", () => {
    const withQuestion = addSurveyQuestion(
      {
        title: "Pulse feedback",
        questions: [
          {
            id: "s1",
            prompt: "How useful is slash menu?",
            type: "rating",
            required: true,
            scaleMax: 5,
          },
        ],
      },
      {
        prompt: "Preferred command entrypoint?",
        type: "single",
        required: true,
        options: ["Slash", "Toolbar", "Shortcut"],
      },
    );

    const updated = updateSurveyQuestion(withQuestion, withQuestion.questions[1].id, {
      prompt: "Preferred insertion entrypoint?",
    });

    expect(updated.questions).toHaveLength(2);
    expect(updated.questions[1].prompt).toBe("Preferred insertion entrypoint?");
    expect(SurveyBlock.render(updated)).toContain('data-block-type="survey"');
  });
});

describe("MangaPanelBlock", () => {
  it("updates layout and appends panels", () => {
    const withPanel = addMangaPanel(
      {
        layout: "single",
        panels: [{ id: "m1", caption: "Opening" }],
        readingDirection: "rtl",
      },
      {
        caption: "Cliffhanger",
      },
    );
    const withLayout = setMangaLayout(withPanel, "two-up");

    expect(withLayout.layout).toBe("two-up");
    expect(withLayout.panels).toHaveLength(2);
    expect(MangaPanelBlock.render(withLayout)).toContain('data-block-type="manga-panel"');
  });
});

describe("SpeechBubbleBlock", () => {
  it("renders dialogue metadata", () => {
    const html = SpeechBubbleBlock.render({
      speaker: "Guide",
      text: "Use the palette for faster authoring.",
      tone: "happy",
      align: "center",
    });

    expect(html).toContain('data-block-type="speech-bubble"');
    expect(html).toContain("Guide");
  });
});

describe("CardBlock", () => {
  it("renders optional media and CTA link", () => {
    const html = CardBlock.render({
      title: "Command Palette",
      body: "Search and run editor actions quickly.",
      mediaUrl: "https://example.com/cover.png",
      linkUrl: "https://example.com/docs/palette",
      ctaLabel: "Read docs",
    });

    expect(html).toContain('data-block-type="card"');
    expect(html).toContain("Read docs");
  });
});

describe("GalleryBlock", () => {
  it("adds gallery images and renders layout metadata", () => {
    const withImage = addGalleryImage(
      {
        title: "Storyboard",
        layout: "grid",
        columns: 2,
        images: [
          {
            id: "g1",
            src: "https://example.com/1.png",
            alt: "Frame 1",
          },
        ],
      },
      {
        src: "https://example.com/2.png",
        alt: "Frame 2",
      },
    );

    expect(withImage.images).toHaveLength(2);
    expect(GalleryBlock.render(withImage)).toContain('data-block-type="gallery"');
  });
});

describe("CarouselBlock", () => {
  it("adds slides and renders indicators", () => {
    const withSlide = addCarouselSlide(
      {
        slides: [{ id: "c1", title: "Slide one" }],
        autoplay: true,
        intervalMs: 4000,
        showIndicators: true,
      },
      {
        title: "Slide two",
        body: "Second panel",
      },
    );
    const html = CarouselBlock.render(withSlide);

    expect(withSlide.slides).toHaveLength(2);
    expect(html).toContain('data-block-type="carousel"');
    expect(html).toContain('data-indicators="true"');
  });
});

describe("FlashcardBlock", () => {
  it("adds flashcards and renders card stack metadata", () => {
    const withCard = addFlashcard(
      {
        title: "Learning set",
        shuffle: false,
        cards: [
          {
            id: "fc-1",
            front: "Question",
            back: "Answer",
          },
        ],
      },
      {
        front: "Shortcut to open search?",
        back: "Use slash trigger.",
      },
    );

    expect(withCard.cards).toHaveLength(2);
    expect(FlashcardBlock.render(withCard)).toContain('data-block-type="flashcard"');
  });
});

describe("Accordion/Tabs/Toggle/Spoiler blocks", () => {
  it("supports accordion and tab helper flows with validation", () => {
    const withAccordionItem = addAccordionItem(
      {
        allowMultiple: true,
        items: [
          {
            id: "acc-1",
            title: "What is Pulse?",
            content: "A modular editor.",
            defaultOpen: false,
          },
        ],
      },
      {
        title: "How do I insert blocks?",
        content: "Use slash commands.",
        defaultOpen: true,
      },
    );
    expect(withAccordionItem.items).toHaveLength(2);
    expect(AccordionBlock.render(withAccordionItem)).toContain('data-block-type="accordion"');

    const withTab = addTabItem(
      {
        tabs: [
          { id: "tab-a", label: "A", content: "Alpha" },
          { id: "tab-b", label: "B", content: "Beta" },
        ],
        activeTabId: "tab-a",
      },
      {
        label: "C",
        content: "Gamma",
      },
    );
    const switched = setActiveTab(withTab, withTab.tabs[2].id);
    expect(switched.activeTabId).toBe(withTab.tabs[2].id);
    expect(TabsBlock.render(switched)).toContain('data-block-type="tabs"');
  });

  it("toggles and reveals visibility blocks", () => {
    const toggled = toggleDefaultState({
      label: "Expand",
      content: "Details",
      defaultOn: false,
    });

    expect(toggled.defaultOn).toBe(true);
    expect(ToggleBlock.render(toggled)).toContain('data-block-type="toggle"');

    const revealed = SpoilerBlock.render({
      label: "Spoiler",
      content: "Hidden text",
      revealed: true,
    });
    expect(revealed).toContain('data-block-type="spoiler"');
  });
});

describe("Chart/Map/Math/Diagram/Timeline blocks", () => {
  it("supports structured data helpers and renderer output", () => {
    const withDataset = addChartDataset(
      {
        chartType: "bar",
        labels: ["A", "B"],
        datasets: [{ id: "d1", label: "Series 1", values: [1, 2] }],
      },
      {
        label: "Series 2",
        values: [3, 4],
      },
    );
    expect(withDataset.datasets).toHaveLength(2);
    expect(ChartBlock.render(withDataset)).toContain('data-block-type="chart"');

    expect(
      MapBlock.render({
        provider: "mapbox",
        latitude: 35.7,
        longitude: 51.4,
        zoom: 12,
      }),
    ).toContain('data-block-type="map"');

    expect(
      MathEquationBlock.render({
        latex: "\\\\frac{a}{b}",
        displayMode: false,
      }),
    ).toContain('data-block-type="math-equation"');

    expect(
      DiagramBlock.render({
        engine: "mermaid",
        source: "graph LR; A-->B",
      }),
    ).toContain('data-block-type="diagram"');

    const withEntry = addTimelineEntry(
      {
        entries: [
          {
            id: "t1",
            title: "Start",
            date: "2026-04-01T00:00:00.000Z",
          },
        ],
      },
      {
        title: "Finish",
        date: "2026-04-02T00:00:00.000Z",
      },
    );
    expect(withEntry.entries).toHaveLength(2);
    expect(TimelineBlock.render(withEntry)).toContain('data-block-type="timeline"');
  });
});

describe("Comparison/BeforeAfter/Hero/Annotated image blocks", () => {
  it("supports helper operations and secure URL validation", () => {
    const withRow = addComparisonRow(
      {
        leftTitle: "A",
        rightTitle: "B",
        rows: [
          {
            id: "r1",
            label: "Latency",
            leftValue: "Low",
            rightValue: "High",
          },
        ],
      },
      {
        label: "Cost",
        leftValue: "Medium",
        rightValue: "Low",
      },
    );
    expect(withRow.rows).toHaveLength(2);
    expect(ComparisonBlock.render(withRow)).toContain('data-block-type="comparison"');

    const beforeAfter = setBeforeAfterPosition(
      {
        beforeUrl: "https://example.com/before.jpg",
        afterUrl: "https://example.com/after.jpg",
        beforeLabel: "Before",
        afterLabel: "After",
        position: 40,
      },
      65,
    );
    expect(beforeAfter.position).toBe(65);
    expect(BeforeAfterBlock.render(beforeAfter)).toContain('data-block-type="before-after"');

    expect(
      HeroSectionBlock.render({
        title: "Ship faster",
        subtitle: "With reusable blocks",
      }),
    ).toContain('data-block-type="hero-section"');

    const withHotspot = addImageHotspot(
      {
        imageUrl: "https://example.com/annotated.jpg",
        alt: "Annotated",
        hotspots: [],
      },
      {
        x: 50,
        y: 25,
        label: "Key area",
      },
    );
    expect(withHotspot.hotspots).toHaveLength(1);
    expect(AnnotatedImageBlock.render(withHotspot)).toContain('data-block-type="annotated-image"');
  });

  it("rejects unsupported annotated-image protocols", () => {
    expect(() =>
      AnnotatedImageBlock.deserialize(
        JSON.stringify({
          imageUrl: "javascript:alert(1)",
          alt: "bad",
          hotspots: [],
        }),
      ),
    ).toThrow("Unsupported annotated image URL protocol");
  });
});

describe("blocks integration with core registry", () => {
  it("validates block schema data when creating core blocks", async () => {
    const registry = BlockRegistry.getInstance();
    registerBasicBlocks(registry);

    await expect(
      registry.createBlock("heading", {
        text: "Invalid heading",
        level: 8,
      }),
    ).rejects.toThrow();

    await expect(
      registry.createBlock("code", {
        code: "print('ok')",
        language: "python",
        theme: "github-light",
        showLineNumbers: true,
      }),
    ).resolves.toMatchObject({
      type: "code",
    });
  });
});

describe("xss hardening", () => {
  it("escapes unsafe html across block renderers", () => {
    const headingHtml = HeadingBlock.render({
      text: "<img src=x onerror=alert(1)>",
      level: 2,
    });
    const listHtml = ListBlock.render({
      style: "unordered",
      items: ['<a href="javascript:alert(1)">x</a>'],
    });

    expect(headingHtml).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(headingHtml).not.toContain("<img");
    expect(listHtml).toContain("&lt;a href=&quot;javascript:alert(1)&quot;&gt;x&lt;/a&gt;");
    expect(listHtml).not.toContain('<a href="javascript:alert(1)">');
  });
});
