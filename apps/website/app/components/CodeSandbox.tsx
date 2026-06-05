'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, RotateCcw, Terminal, AlertCircle } from 'lucide-react';

interface CodeSandboxProps {
  code: string;
  language: string;
  mode?: 'show' | 'run' | 'demo';
  onRun?: () => void;
  hideChrome?: boolean;
  noHeader?: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function createSandboxHtml(code: string, language: string): string {
  const safeCode = escapeHtml(code);

  if (language === 'html' || language === 'markdown') {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:rgba(255,255,255,0.03);border-radius:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:3px}::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.3)}*{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) rgba(255,255,255,0.03)}</style></head><body>' + code + '</body></html>';
  }

  if (language === 'css') {
    return '<style>' + code + '</style><div style="padding:1rem;font-family:sans-serif;background:#1e1e2e;color:#e5e7eb;min-height:100vh">CSS applied to this page</div>';
  }

  // JS / TS / JSX / TSX / JSON / etc — code is read from a hidden textarea so </script> in user code cannot break out
  const isJson = language === 'json';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 1rem; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.5; background: #1e1e2e; color: #e5e7eb; }
  .entry { margin-bottom: 0.25rem; white-space: pre-wrap; word-break: break-word; }
  .entry.error { color: #ff6b6b; }
  .entry.warn { color: #f5a623; }
  .entry.info { color: #4dabf7; }
  .entry.log { color: #e5e7eb; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
  * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) rgba(255,255,255,0.03); }
</style>
</head>
<body>
<div id="output"></div>
<textarea id="user-code" style="display:none">${safeCode}</textarea>
<script>
(function() {
  const output = document.getElementById('output');
  function addEntry(type, args) {
    const msg = Array.from(args).map(a => {
      if (typeof a === 'object') return JSON.stringify(a, null, 2);
      return String(a);
    }).join(' ');
    const div = document.createElement('div');
    div.className = 'entry ' + type;
    div.textContent = msg;
    output.appendChild(div);
  }
  const origLog = console.log;
  const origError = console.error;
  const origWarn = console.warn;
  const origInfo = console.info;
  console.log = function(...args) { addEntry('log', args); origLog.apply(console, args); };
  console.error = function(...args) { addEntry('error', args); origError.apply(console, args); };
  console.warn = function(...args) { addEntry('warn', args); origWarn.apply(console, args); };
  console.info = function(...args) { addEntry('info', args); origInfo.apply(console, args); };

  window.onerror = function(msg, src, line, col, err) {
    addEntry('error', [msg + (err ? ' — ' + err.stack : '')]);
  };

  const code = document.getElementById('user-code').value;
  ${isJson ? "try { const data = JSON.parse(code); addEntry('log', [JSON.stringify(data, null, 2)]); } catch(e) { addEntry('error', [e.message]); }" : "try { new Function(code)(); } catch(e) { addEntry('error', [e.name + ': ' + e.message]); }"}
})();
</script>
</body>
</html>`;
}

export default function CodeSandbox({ code, language, mode = 'show', onRun, hideChrome = true, noHeader = false }: CodeSandboxProps) {
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const demoRanRef = useRef(false);

  const runCode = useCallback(() => {
    setHasRun(true);
    setError(null);

    if (onRun) onRun();

    const html = createSandboxHtml(code, language);

    if (iframeRef.current) {
      iframeRef.current.srcdoc = html;
    }
  }, [code, language, onRun]);

  // Auto-run in demo mode once on mount, NOT on every code change
  useEffect(() => {
    if (mode === 'demo' && code && !demoRanRef.current) {
      demoRanRef.current = true;
      // Do NOT call runCode() here — it triggers onRun → parent setRunKey → remount → loop
      setHasRun(true);
      setError(null);
      const html = createSandboxHtml(code, language);
      if (iframeRef.current) {
        iframeRef.current.srcdoc = html;
      }
    }
  }, [mode, code, language]);

  const isRunnable = ['javascript', 'typescript', 'tsx', 'jsx', 'html', 'css', 'json'].includes(language);

  if (!isRunnable && mode !== 'demo') {
    return null;
  }

  // Clean demo mode — no chrome, just the iframe
  if (mode === 'demo' && hideChrome) {
    return (
      <iframe
        ref={iframeRef}
        title="Code demo"
        sandbox="allow-scripts"
        style={{
          width: '100%',
          minHeight: '200px',
          border: 'none',
          display: 'block',
          background: '#1e1e2e',
        }}
      />
    );
  }

  // No header mode (used inside editor tab panels)
  if (noHeader) {
    return (
      <iframe
        ref={iframeRef}
        title="Code sandbox"
        sandbox="allow-scripts"
        style={{
          width: '100%',
          minHeight: mode === 'demo' ? '200px' : '120px',
          border: 'none',
          display: 'block',
          background: '#1e1e2e',
        }}
      />
    );
  }

  return (
    <div className="pulse-code-sandbox">
      <div className="pulse-code-sandbox-header">
        <Terminal />
        <span>{mode === 'demo' ? 'Live Demo' : 'Output'}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={runCode}
          className="pulse-editor-code-run-btn"
          style={{ padding: '0.25rem 0.625rem', fontSize: '0.65rem' }}
        >
          {hasRun ? <RotateCcw style={{ width: 12, height: 12 }} /> : <Play style={{ width: 12, height: 12 }} />}
          {hasRun ? 'Rerun' : 'Run'}
        </button>
      </div>
      <iframe
        ref={iframeRef}
        title="Code sandbox"
        sandbox="allow-scripts"
        style={{
          width: '100%',
          minHeight: mode === 'demo' ? '200px' : '120px',
          border: 'none',
          display: 'block',
          background: '#1e1e2e',
        }}
      />
      {error && (
        <div className="pulse-code-sandbox-error">
          <AlertCircle style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />
          {error}
        </div>
      )}
    </div>
  );
}
