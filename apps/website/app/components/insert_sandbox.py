import sys

with open('StudioBlockEditors.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

insert_text = """}

const CODE_SANDBOX_LANGUAGES = [
  'typescript', 'tsx', 'javascript', 'jsx', 'json', 'html', 'css',
  'markdown', 'bash', 'http', 'python', 'go', 'rust',
];

export function EditableCodeSandbox({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { code: string; language: string; showLineNumbers?: boolean; readOnly?: boolean };
  const [hasRun, setHasRun] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isRunnable = ['javascript', 'typescript', 'tsx', 'jsx', 'html', 'css', 'json', 'python'].includes(data.language);
  const isPython = data.language === 'python';

  const runCode = useCallback(() => {
    setHasRun(true);
    let html: string;
    if (isPython) {
      html = buildPyodideSrcdoc(data.code);
    } else {
      html = createSandboxHtml(data.code, data.language);
    }
    if (iframeRef.current) {
      iframeRef.current.srcdoc = html;
    }
  }, [data.code, data.language, isPython]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={data.language}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, language: e.target.value } }))}
          className="rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] outline-none"
        >
          {CODE_SANDBOX_LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-xs text-[var(--neutral-600)]">
          <input
            type="checkbox"
            checked={data.showLineNumbers ?? true}
            onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, showLineNumbers: e.target.checked } }))}
            className="h-4 w-4 accent-[var(--pulse-red)]"
          />
          Line numbers
        </label>

        <label className="flex items-center gap-1.5 text-xs text-[var(--neutral-600)]">
          <input
            type="checkbox"
            checked={data.readOnly ?? false}
            onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, readOnly: e.target.checked } }))}
            className="h-4 w-4 accent-[var(--pulse-red)]"
          />
          Read-only
        </label>
      </div>

      <div className="pulse-editor-code-block">
        <div className="pulse-editor-code-header">
          <Terminal className="h-3.5 w-3.5 text-[var(--pulse-red)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
            {data.language}
          </span>
        </div>
        <textarea
          value={data.code}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, code: e.target.value } }))}
          rows={Math.max(4, data.code.split('\\n').length)}
          className="pulse-editor-code-textarea"
          placeholder="Type your code here..."
          spellCheck={false}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={runCode}
          disabled={!isRunnable}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            isRunnable
              ? 'bg-[var(--pulse-red)] text-white hover:bg-[var(--pulse-red-dark)]'
              : 'bg-[var(--neutral-200)] text-[var(--neutral-400)] cursor-not-allowed'
          }`}
        >
          <Play className="h-3 w-3" />
          Test Run
        </button>
        {!isRunnable && (
          <span className="text-xs text-[var(--neutral-500)]">
            Execution not available for {data.language} in browser sandbox
          </span>
        )}
      </div>

      {hasRun && isRunnable && (
        <iframe
          ref={iframeRef}
          title="Code sandbox output"
          sandbox="allow-scripts allow-same-origin"
          style={{ width: '100%', minHeight: '160px', border: 'none', display: 'block', background: '#1e1e2e' }}
        />
      )}
    </div>
  );
}

// ─── Link Modal ───"""

old = "}\n\n\n// ─── Link Modal ───"
if old in content:
    content = content.replace(old, insert_text)
    with open('StudioBlockEditors.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Inserted EditableCodeSandbox')
else:
    print('Pattern not found')
    sys.exit(1)
