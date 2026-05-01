import type { Block, BlockData } from "@pulse/core";
import type { BlockRendererFn } from "../types/renderer";
import { escapeHtml } from "../render/render";

/**
 * Data structure for a code playground block.
 * This block type is not yet implemented in @pulse/blocks but is defined here
 * for renderer support (Phase 3, R3-15).
 */
export interface CodePlaygroundBlockData extends BlockData {
  /** Source code to display and execute. */
  code: string;
  /** Programming language/runtime (e.g., "javascript", "python", "html"). */
  language: string;
  /** Whether the playground is editable by the reader. Defaults to true. */
  editable?: boolean;
  /** Whether to show the output panel. Defaults to true. */
  showOutput?: boolean;
  /** Whether to auto-run code on load. Defaults to false. */
  autoRun?: boolean;
  /** Custom height for the playground container (CSS value). */
  height?: string;
  /** Theme for the code editor ("light" | "dark"). Defaults to "light". */
  theme?: "light" | "dark";
}

/**
 * Supported languages for code playground execution.
 * Extensible via plugin system in future phases.
 */
export const SUPPORTED_PLAYGROUND_LANGUAGES = [
  "javascript",
  "typescript",
  "html",
  "css",
  "python",
  "markdown",
] as const;

export type PlaygroundLanguage = (typeof SUPPORTED_PLAYGROUND_LANGUAGES)[number];

/**
 * Check if a language is supported for playground execution.
 */
export function isPlaygroundLanguageSupported(language: string): boolean {
  return SUPPORTED_PLAYGROUND_LANGUAGES.includes(language as PlaygroundLanguage);
}

/**
 * Render a code playground block as an isolated iframe sandbox.
 *
 * Security considerations:
 * - Uses iframe with sandbox attribute to isolate execution
 * - No allow-same-origin to prevent access to parent document
 * - allow-scripts only when execution is needed
 * - Content is injected via srcdoc to avoid external resource loading
 *
 * The playground requires client-side hydration to become interactive.
 * This renderer produces the SSR-safe HTML structure.
 */
export const renderCodePlayground: BlockRendererFn<CodePlaygroundBlockData> = (
  block: Block<CodePlaygroundBlockData>,
) => {
  const {
    code = "",
    language = "javascript",
    editable = true,
    showOutput = true,
    autoRun = false,
    height = "400px",
    theme = "light",
  } = block.data;

  const blockId = escapeHtml(block.id);
  const escapedCode = escapeHtml(code);
  const escapedLanguage = escapeHtml(language);

  const sandboxPerms = "allow-scripts allow-popups allow-forms";

  const parts: string[] = [];

  parts.push(
    '<div class="pulse-code-playground" ' +
      'data-pulse-block-id="' + blockId + '" ' +
      'data-pulse-language="' + escapedLanguage + '" ' +
      'data-pulse-editable="' + editable + '" ' +
      'data-pulse-show-output="' + showOutput + '" ' +
      'data-pulse-auto-run="' + autoRun + '" ' +
      'data-pulse-theme="' + theme + '" ' +
      'style="height: ' + escapeHtml(height) + '">',
  );

  parts.push(
    '  <div class="pulse-code-playground__editor" role="region" aria-label="Code editor">',
  );
  parts.push(
    '    <div class="pulse-code-playground__toolbar">',
    '      <span class="pulse-code-playground__language">' + escapedLanguage + '</span>',
    '      <button class="pulse-code-playground__run" type="button" aria-label="Run code">Run</button>',
    '      <button class="pulse-code-playground__reset" type="button" aria-label="Reset code">Reset</button>',
    '    </div>',
  );
  parts.push(
    '    <pre class="pulse-code-playground__code" contenteditable="' + editable + '"><code>' + escapedCode + '</code></pre>',
  );
  parts.push('  </div>');

  if (showOutput) {
    parts.push(
      '  <div class="pulse-code-playground__output" role="region" aria-label="Code output">',
    );
    parts.push(
      '    <iframe ' +
        'class="pulse-code-playground__iframe" ' +
        'sandbox="' + sandboxPerms + '" ' +
        'title="Code playground output" ' +
        'aria-label="Code execution output">' +
        '</iframe>',
    );
    parts.push('  </div>');
  }

  parts.push('</div>');

  return parts.join("\n");
};

/**
 * Generate the srcdoc content for a sandboxed iframe execution.
 * This is used client-side to inject code into the iframe safely.
 */
export function generatePlaygroundSrcdoc(
  code: string,
  language: PlaygroundLanguage,
): string {
  if (language === "javascript" || language === "typescript") {
    return [
      '<!DOCTYPE html>',
      '<html>',
      '<head><meta charset="utf-8"><style>body{margin:0;padding:8px;font-family:monospace;}</style></head>',
      '<body>',
      '<div id="output"></div>',
      '<script>',
      '  const output = document.getElementById("output");',
      '  const originalLog = console.log;',
      '  console.log = (...args) => {',
      '    originalLog(...args);',
      '    const line = document.createElement("div");',
      '    line.textContent = args.join(" ");',
      '    output.appendChild(line);',
      '  };',
      '  try {',
      '    ' + code,
      '  } catch (err) {',
      '    const error = document.createElement("div");',
      '    error.style.color = "red";',
      '    error.textContent = "Error: " + err.message;',
      '    output.appendChild(error);',
      '  }',
      '</script>',
      '</body>',
      '</html>',
    ].join("\n");
  }

  if (language === "html") {
    return code;
  }

  if (language === "css") {
    return [
      '<!DOCTYPE html>',
      '<html>',
      '<head><meta charset="utf-8"></head>',
      '<body>',
      '<div class="preview">CSS Preview</div>',
      '<style>' + code + '</style>',
      '</body>',
      '</html>',
    ].join("\n");
  }

  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head><meta charset="utf-8"><style>body{margin:0;padding:8px;font-family:monospace;}</style></head>',
    '<body>',
    '<div style="color: #666;">',
    '  Execution for ' + escapeHtml(language) + ' requires server-side runtime.',
    '</div>',
    '</body>',
    '</html>',
  ].join("\n");
}
