import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export const SUPPORTED_CODE_LANGUAGES = [
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "json",
  "html",
  "css",
  "markdown",
  "bash",
  "http",
  "python",
  "go",
  "rust",
] as const;

export type SupportedCodeLanguage = (typeof SUPPORTED_CODE_LANGUAGES)[number];

export interface CodeBlockData extends Record<string, unknown> {
  code: string;
  language: SupportedCodeLanguage;
  theme: string;
  showLineNumbers: boolean;
  mode: "show" | "run" | "demo";
  align?: "left" | "center" | "right" | "justify";
}

export interface ShikiLikeHighlighter {
  codeToHtml(code: string, options: { lang: string; theme: string }): string;
}

const codeLanguageSchema = z.enum(SUPPORTED_CODE_LANGUAGES);

export const codeBlockDataSchema = z
  .object({
    code: z.string(),
    language: codeLanguageSchema,
    theme: z.string().default("github-light"),
    showLineNumbers: z.boolean().default(true),
    mode: z.enum(["show", "run", "demo"]).default("show"),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
  })
  .strict() as z.ZodType<CodeBlockData>;

let activeHighlighter: ShikiLikeHighlighter | null = null;

export function setCodeBlockHighlighter(
  highlighter: ShikiLikeHighlighter | null,
): void {
  activeHighlighter = highlighter;
}

export function supportsCodeLanguage(
  language: string,
): language is SupportedCodeLanguage {
  return (SUPPORTED_CODE_LANGUAGES as readonly string[]).includes(language);
}

function renderFallbackCode(data: CodeBlockData): string {
  const escapedCode = escapeHtml(data.code);
  const lineNumbers = data.showLineNumbers ? ' data-line-numbers="true"' : '';
  const modeAttr = data.mode !== 'show' ? ` data-mode="${data.mode}"` : '';
  const alignStyle = data.align && data.align !== 'left' ? ` style="text-align: ${data.align};"` : '';

  return wrapCodeBlock(
    `<pre data-block-type="code" data-language="${data.language}"${lineNumbers}${modeAttr}${alignStyle}><code class="language-${data.language}">${escapedCode}</code></pre>`,
    data,
  );
}

function wrapCodeBlock(innerHtml: string, data: CodeBlockData): string {
  const modeAttr = data.mode !== 'show' ? ` data-mode="${data.mode}"` : '';
  return `<div class="pulse-code-block" data-language="${data.language}"${modeAttr}>\n  <div class="pulse-code-header">\n    <div class="pulse-code-dots">\n      <span class="pulse-code-dot red"></span>\n      <span class="pulse-code-dot yellow"></span>\n      <span class="pulse-code-dot green"></span>\n    </div>\n    <span class="pulse-code-lang">${data.language}</span>\n  </div>\n  <div class="pulse-code-body">\n    ${innerHtml}\n  </div>\n</div>`;
}

export const CodeBlock: BlockTypeDefinition<CodeBlockData> = {
  type: "code",
  name: "Code",
  icon: "{}",
  schema: codeBlockDataSchema,
  defaultData: {
    code: "",
    language: "typescript",
    theme: "github-light",
    showLineNumbers: true,
    mode: "show",
  },
  config: {
    category: "basic",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = codeBlockDataSchema.parse(data);

    if (!activeHighlighter) {
      return renderFallbackCode(parsed);
    }

    try {
      let html = activeHighlighter.codeToHtml(parsed.code, {
        lang: parsed.language,
        theme: parsed.theme,
      });

      // Inject Pulse data attributes into the Shiki output
      const lineNumbers = parsed.showLineNumbers ? ' data-line-numbers="true"' : '';
      const modeAttr = parsed.mode !== 'show' ? ` data-mode="${parsed.mode}"` : '';
      const alignStyle = parsed.align && parsed.align !== 'left' ? ` style="text-align: ${parsed.align};"` : '';

      html = html.replace(
        /<pre/,
        `<pre data-block-type="code" data-language="${parsed.language}"${lineNumbers}${modeAttr}${alignStyle}`,
      );

      return wrapCodeBlock(html, parsed);
    } catch {
      // Fallback keeps rendering resilient even if highlighting fails.
      return renderFallbackCode(parsed);
    }
  },
  serialize(data) {
    const parsed = codeBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return codeBlockDataSchema.parse(parseJson<CodeBlockData>(content));
  },
};
