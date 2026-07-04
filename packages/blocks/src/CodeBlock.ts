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
  hideChrome?: boolean;
  demoTitle?: string;
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
    theme: z.string().default("github-dark"),
    showLineNumbers: z.boolean().default(true),
    mode: z.enum(["show", "run", "demo"]).default("show"),
    hideChrome: z.boolean().default(true),
    demoTitle: z.string().default("Live Demo"),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
  })
  .passthrough() as z.ZodType<CodeBlockData>;

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

function escapeAttr(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Unicode-safe base64 encoding that works in both Node.js and browsers. */
export function utf8ToBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  // Browser fallback: encode UTF-8 bytes as Latin1 for btoa
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );
}

/** Unicode-safe base64 decoding that works in both Node.js and browsers. */
export function base64ToUtf8(b64: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf-8");
  }
  // Browser fallback: decode Latin1 bytes from atob back to UTF-8
  return decodeURIComponent(
    atob(b64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
}

export function buildSandboxSrcdoc(code: string, language: string): string {
  if (language === "html" || language === "markdown") {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:rgba(255,255,255,0.03)}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15)}*{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) rgba(255,255,255,0.03)}</style></head><body>${code}</body></html>`;
  }
  if (language === "css") {
    return `<style>${code}</style><div style="padding:1rem;font-family:sans-serif;background:#1e1e2e;color:#e5e7eb;min-height:100vh">CSS applied to this page</div>`;
  }
  const isJson = language === "json";
  const safeCode = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:1rem;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.5;background:#1e1e2e;color:#e5e7eb}.entry{margin-bottom:0.25rem;white-space:pre-wrap;word-break:break-word}.entry.error{color:#ff6b6b}.entry.warn{color:#f5a623}.entry.info{color:#4dabf7}.entry.log{color:#e5e7eb}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:rgba(255,255,255,0.03)}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15)}*{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) rgba(255,255,255,0.03)}</style></head><body><div id="output"></div><textarea id="user-code" style="display:none">${safeCode}</textarea><script>(function(){const output=document.getElementById('output');function addEntry(type,args){const msg=Array.from(args).map(a=>typeof a==='object'?JSON.stringify(a,null,2):String(a)).join(' ');const div=document.createElement('div');div.className='entry '+type;div.textContent=msg;output.appendChild(div);}const origLog=console.log,origError=console.error,origWarn=console.warn,origInfo=console.info;console.log=function(...args){addEntry('log',args);origLog.apply(console,args);};console.error=function(...args){addEntry('error',args);origError.apply(console,args);};console.warn=function(...args){addEntry('warn',args);origWarn.apply(console,args);};console.info=function(...args){addEntry('info',args);origInfo.apply(console,args);};window.onerror=function(msg,src,line,col,err){addEntry('error',[msg+(err?' — '+err.stack:'')]);};const code=document.getElementById('user-code').value;${isJson ? "try{const data=JSON.parse(code);addEntry('log',[JSON.stringify(data,null,2)]);}catch(e){addEntry('error',[e.message]);}" : "try{new Function(code)();}catch(e){addEntry('error',[e.name+': '+e.message]);}"}})();</script></body></html>`;
}

function renderFallbackCode(data: CodeBlockData): string {
  const escapedCode = escapeHtml(data.code);
  const lineNumbers = data.showLineNumbers ? ' data-line-numbers="true"' : "";
  const modeAttr = data.mode !== "show" ? ` data-mode="${data.mode}"` : "";
  const alignStyle =
    data.align && data.align !== "left" ? ` style="text-align: ${data.align};"` : "";

  const lines = escapedCode.split("\n");
  const codeHtml = lines
    .map((line) => `<span class="line">${line}</span>`)
    .join("\n");

  return wrapCodeBlock(
    `<pre data-block-type="code" data-language="${data.language}"${lineNumbers}${modeAttr}${alignStyle}><code class="language-${data.language}">${codeHtml}</code></pre>`,
    data,
  );
}

function wrapCodeBlock(innerHtml: string, data: CodeBlockData): string {
  const isRunnable = [
    "javascript",
    "typescript",
    "tsx",
    "jsx",
    "html",
    "css",
    "json",
  ].includes(data.language);

  // Run mode — emit tabs, run button, and output iframe directly
  if (data.mode === "run" && isRunnable) {
    const srcdoc = buildSandboxSrcdoc(data.code, data.language);
    const escapedSrcdoc = escapeAttr(srcdoc);
    return `<div class="pulse-code-block" data-mode="run" data-active-tab="code" data-language="${data.language}">
  <div class="pulse-code-header">
    <div class="pulse-code-dots">
      <span class="pulse-code-dot red"></span>
      <span class="pulse-code-dot yellow"></span>
      <span class="pulse-code-dot green"></span>
    </div>
    <span class="pulse-code-lang">${data.language}</span>
    <div class="pulse-code-tabs">
      <button class="pulse-code-tab active" data-tab="code">Code</button>
      <button class="pulse-code-tab" data-tab="output">Output</button>
    </div>
    <button class="pulse-code-run-btn" data-run>Run</button>
  </div>
  <div class="pulse-code-body">
    <div class="pulse-code-panel" data-panel="code">
      ${innerHtml}
    </div>
    <div class="pulse-code-panel" data-panel="output">
      <iframe sandbox="allow-scripts" title="Code sandbox" srcdoc="${escapedSrcdoc}" style="width:100%;min-height:120px;border:none;display:block;background:#1e1e2e;"></iframe>
    </div>
  </div>
</div>`;
  }

  // Demo mode — emit block + iframe directly (no wrapper, no card chrome)
  if (data.mode === "demo" && isRunnable) {
    const codeB64 = utf8ToBase64(data.code);
    const hideChromeAttr = ` data-hide-chrome="${String(data.hideChrome ?? true)}"`;
    const srcdoc = buildSandboxSrcdoc(data.code, data.language);
    const escapedSrcdoc = escapeAttr(srcdoc);

    const blockHtml = `<div class="pulse-code-block" data-mode="demo" data-language="${data.language}"${hideChromeAttr} data-code="${codeB64}">
  <div class="pulse-code-header">
    <div class="pulse-code-dots">
      <span class="pulse-code-dot red"></span>
      <span class="pulse-code-dot yellow"></span>
      <span class="pulse-code-dot green"></span>
    </div>
    <span class="pulse-code-lang">${data.language}</span>
  </div>
  <div class="pulse-code-body">
    ${innerHtml}
  </div>
</div>`;

    return `${blockHtml}
<iframe sandbox="allow-scripts" title="Code demo" srcdoc="${escapedSrcdoc}" style="width:100%;min-height:200px;border:none;display:block;background:transparent;"></iframe>`;
  }

  // Show mode (or non-runnable languages in run/demo)
  const modeAttr = data.mode !== "show" ? ` data-mode="${data.mode}"` : "";
  const hideChromeAttr =
    data.mode === "demo"
      ? ` data-hide-chrome="${String(data.hideChrome ?? true)}"`
      : "";
  const demoTitleAttr =
    data.mode === "demo" && data.demoTitle
      ? ` data-demo-title="${escapeHtml(data.demoTitle)}"`
      : "";
  return `<div class="pulse-code-block" data-language="${data.language}"${modeAttr}${hideChromeAttr}${demoTitleAttr}>
  <div class="pulse-code-header">
    <div class="pulse-code-dots">
      <span class="pulse-code-dot red"></span>
      <span class="pulse-code-dot yellow"></span>
      <span class="pulse-code-dot green"></span>
    </div>
    <span class="pulse-code-lang">${data.language}</span>
  </div>
  <div class="pulse-code-body">
    ${innerHtml}
  </div>
</div>`;
}

export const CodeBlock: BlockTypeDefinition<CodeBlockData> = {
  type: "code",
  name: "Code",
  icon: "{}",
  schema: codeBlockDataSchema,
  defaultData: {
    code: "",
    language: "typescript",
    theme: "github-dark",
    showLineNumbers: true,
    mode: "show",
    hideChrome: true,
    demoTitle: "Live Demo",
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
      const theme = "github-dark";
      let html = activeHighlighter.codeToHtml(parsed.code, {
        lang: parsed.language,
        theme,
      });

      const lineNumbers = parsed.showLineNumbers
        ? ' data-line-numbers="true"'
        : "";
      const modeAttr =
        parsed.mode !== "show" ? ` data-mode="${parsed.mode}"` : "";
      const alignStyle =
        parsed.align && parsed.align !== "left"
          ? ` style="text-align: ${parsed.align};"`
          : "";

      html = html.replace(
        /<pre/,
        `<pre data-block-type="code" data-language="${parsed.language}"${lineNumbers}${modeAttr}${alignStyle}`,
      );

      return wrapCodeBlock(html, parsed);
    } catch {
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
