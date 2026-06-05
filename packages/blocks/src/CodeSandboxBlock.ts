import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";
import {
  SUPPORTED_CODE_LANGUAGES,
  type SupportedCodeLanguage,
  buildSandboxSrcdoc,
  utf8ToBase64,
} from "./CodeBlock";

export interface CodeSandboxBlockData extends Record<string, unknown> {
  code: string;
  language: SupportedCodeLanguage;
  theme: string;
  showLineNumbers: boolean;
  readOnly: boolean;
}

const codeSandboxLanguageSchema = z.enum(SUPPORTED_CODE_LANGUAGES);

export const codeSandboxBlockDataSchema = z
  .object({
    code: z.string(),
    language: codeSandboxLanguageSchema,
    theme: z.string().default("github-dark"),
    showLineNumbers: z.boolean().default(true),
    readOnly: z.boolean().default(false),
  })
  .passthrough() as z.ZodType<CodeSandboxBlockData>;

function escapeAttr(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function buildPyodideSrcdoc(code: string): string {
  const safeCode = escapeHtml(code);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body{margin:0;padding:1rem;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.5;background:#1e1e2e;color:#e5e7eb}
.entry{margin-bottom:0.25rem;white-space:pre-wrap;word-break:break-word}
.entry.error{color:#ff6b6b}
.entry.warn{color:#f5a623}
.entry.info{color:#4dabf7}
.entry.log{color:#e5e7eb}
#loader{display:flex;align-items:center;gap:0.5rem;padding:1rem}
.spinner{border:3px solid rgba(255,255,255,0.1);border-top-color:#4dabf7;border-radius:50%;width:24px;height:24px;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:rgba(255,255,255,0.03)}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15)}
*{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) rgba(255,255,255,0.03)}
</style>
</head>
<body>
<div id="loader"><div class="spinner"></div><span>Loading Pyodide...</span></div>
<div id="output"></div>
<textarea id="user-code" style="display:none">${safeCode}</textarea>
<script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>
<script>
(async function(){
  const loader=document.getElementById('loader');
  const output=document.getElementById('output');
  function addEntry(type,text){
    const div=document.createElement('div');
    div.className='entry '+type;
    div.textContent=text;
    output.appendChild(div);
  }
  try{
    let pyodide=await loadPyodide();
    loader.style.display='none';
    pyodide.setStdout({batched:(text)=>addEntry('log',text)});
    pyodide.setStderr({batched:(text)=>addEntry('error',text)});
    const code=document.getElementById('user-code').value;
    await pyodide.runPythonAsync(code);
  }catch(err){
    loader.style.display='none';
    addEntry('error',(err&&err.message)?err.message:String(err));
  }
})();
</script>
</body>
</html>`;
}

function renderFallbackCodeSandbox(data: CodeSandboxBlockData): string {
  const escapedCode = escapeHtml(data.code);

  const runnableInBrowser = [
    "javascript",
    "typescript",
    "tsx",
    "jsx",
    "html",
    "css",
    "json",
    "python",
  ].includes(data.language);

  const runButtonHtml = runnableInBrowser
    ? `<button class="pulse-code-run-btn" data-run>Run</button>`
    : `<button class="pulse-code-run-btn" disabled data-run>Run</button>`;

  const editorHtml = data.readOnly
    ? `<pre data-block-type="code-sandbox" data-language="${data.language}"><code class="language-${data.language}">${escapedCode}</code></pre>`
    : `<textarea class="pulse-sandbox-editor" data-sandbox-editor placeholder="Write your code here..." spellcheck="false">${escapedCode}</textarea>`;

  const outputHtml = runnableInBrowser
    ? `<iframe sandbox="allow-scripts" title="Code sandbox" style="width:100%;min-height:160px;border:none;display:block;background:#1e1e2e;"></iframe>`
    : `<div class="pulse-sandbox-no-run">Execution not available for ${data.language} in browser sandbox</div>`;

  return `<div class="pulse-code-block" data-mode="sandbox" data-active-tab="code" data-language="${data.language}">
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
    ${runButtonHtml}
  </div>
  <div class="pulse-code-body">
    <div class="pulse-code-panel" data-panel="code">
      ${editorHtml}
    </div>
    <div class="pulse-code-panel" data-panel="output">
      ${outputHtml}
    </div>
  </div>
</div>`;
}

export const CodeSandboxBlock: BlockTypeDefinition<CodeSandboxBlockData> = {
  type: "code-sandbox",
  name: "Code Sandbox",
  icon: "SANDBOX",
  schema: codeSandboxBlockDataSchema,
  defaultData: {
    code: "",
    language: "javascript",
    theme: "github-dark",
    showLineNumbers: true,
    readOnly: false,
  },
  config: {
    category: "basic",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = codeSandboxBlockDataSchema.parse(data);
    return renderFallbackCodeSandbox(parsed);
  },
  serialize(data) {
    const parsed = codeSandboxBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return codeSandboxBlockDataSchema.parse(parseJson<CodeSandboxBlockData>(content));
  },
};
