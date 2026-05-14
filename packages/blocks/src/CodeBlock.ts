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
  const lineNumbers = data.showLineNumbers ? " data-line-numbers=\"true\"" : "";

  return `<pre data-block-type="code" data-language="${data.language}"${lineNumbers}><code class="language-${data.language}">${escapedCode}</code></pre>`;
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
      return activeHighlighter.codeToHtml(parsed.code, {
        lang: parsed.language,
        theme: parsed.theme,
      });
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
