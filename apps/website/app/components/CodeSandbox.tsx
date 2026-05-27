'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, RotateCcw, Terminal, AlertCircle } from 'lucide-react';

interface CodeSandboxProps {
  code: string;
  language: string;
  mode?: 'show' | 'run' | 'demo';
  onRun?: () => void;
}

function createSandboxHtml(code: string, language: string): string {
  if (language === 'html' || language === 'markdown') {
    return code;
  }

  if (language === 'css') {
    return `<style>${code}</style><div style="padding:1rem;font-family:sans-serif">CSS applied to this page</div>`;
  }

  // JS / TS / JSX / TSX / JSON / etc - run in a controlled environment
  const isJson = language === 'json';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 1rem; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6; background: #fff; color: #24292e; }
  .entry { margin-bottom: 0.25rem; white-space: pre-wrap; word-break: break-word; }
  .entry.error { color: #cf222e; }
  .entry.warn { color: #9a6700; }
  .entry.info { color: #0969da; }
  .entry.log { color: #24292e; }
</style>
</head>
<body>
<div id="output"></div>
<script>
(function() {
  const output = document.getElementById('output');
  const entries = [];
  function addEntry(type, args) {
    const msg = Array.from(args).map(a => {
      if (typeof a === 'object') return JSON.stringify(a, null, 2);
      return String(a);
    }).join(' ');
    entries.push({ type, msg });
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

  ${isJson ? `try { const data = JSON.parse(\`${code.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`); addEntry('log', [JSON.stringify(data, null, 2)]); } catch(e) { addEntry('error', [e.message]); }` : `try { ${code} } catch(e) { addEntry('error', [e.name + ': ' + e.message]); }`}
})();
</script>
</body>
</html>`;
}

export default function CodeSandbox({ code, language, mode = 'show', onRun }: CodeSandboxProps) {
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
      runCode();
    }
  // Intentionally omit dependencies: demo should only auto-run once on mount
  // eslint-disable-next-line
  }, []);

  const isRunnable = ['javascript', 'typescript', 'tsx', 'jsx', 'html', 'css', 'json'].includes(language);

  if (!isRunnable && mode !== 'demo') {
    return null;
  }

  return (
    <div className="pulse-code-sandbox">
      {mode !== 'demo' && (
        <div className="pulse-code-sandbox-header">
          <Terminal />
          <span>Output</span>
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
      )}
      {mode === 'demo' && (
        <div className="pulse-code-sandbox-header">
          <Terminal />
          <span>Live Demo</span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Code sandbox"
        sandbox="allow-scripts"
        style={{
          width: '100%',
          minHeight: mode === 'demo' ? '200px' : '120px',
          border: 'none',
          display: 'block',
          background: '#fff',
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
