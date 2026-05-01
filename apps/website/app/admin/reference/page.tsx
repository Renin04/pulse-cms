'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search, Keyboard, Command, Trash2, Plus, Zap,
  Monitor, MessageSquare, Terminal, Type, Save, Download, Upload,
} from 'lucide-react';
import {
  DEFAULT_SHORTCUT_BINDINGS,
  ALIGNMENT_SHORTCUT_BINDINGS,
  FIND_REPLACE_SHORTCUT_BINDINGS,
  DOCUMENT_STATS_SHORTCUT_BINDINGS,
  IMAGE_METADATA_SHORTCUT_BINDINGS,
  COMMAND_REFERENCE_SHORTCUT_BINDINGS,
  EXTENDED_BLOCK_SHORTCUT_BINDINGS,
  INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS,
  PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS,
} from '@pulse/editor';

/* ─── Types ─── */
type CustomCommand = {
  id: string;
  title: string;
  slashTrigger?: string;
  combo?: string;
  actionType: 'alert' | 'console-log' | 'insert-text';
  actionData: string;
};

/* ─── Static Data ─── */
const SHORTCUT_CATEGORIES = [
  { name: 'Studio', icon: Monitor, bindings: DEFAULT_SHORTCUT_BINDINGS },
  { name: 'Formatting', icon: Type, bindings: ALIGNMENT_SHORTCUT_BINDINGS },
  { name: 'Find & Replace', icon: Search, bindings: FIND_REPLACE_SHORTCUT_BINDINGS },
  { name: 'Document Stats', icon: Terminal, bindings: DOCUMENT_STATS_SHORTCUT_BINDINGS },
  { name: 'Image Metadata', icon: MessageSquare, bindings: IMAGE_METADATA_SHORTCUT_BINDINGS },
  { name: 'Command Reference', icon: Command, bindings: COMMAND_REFERENCE_SHORTCUT_BINDINGS },
  { name: 'Extended Blocks', icon: Zap, bindings: EXTENDED_BLOCK_SHORTCUT_BINDINGS },
  { name: 'Interactive', icon: MessageSquare, bindings: INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS },
  { name: 'Phase 2 Blocks', icon: Zap, bindings: PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS },
];

const SLASH_COMMANDS = [
  { trigger: 'bold', title: 'Bold', category: 'Formatting', desc: 'Toggle bold mark' },
  { trigger: 'italic', title: 'Italic', category: 'Formatting', desc: 'Toggle italic mark' },
  { trigger: 'link', title: 'Link', category: 'Formatting', desc: 'Insert a link block' },
  { trigger: 'code', title: 'Code', category: 'Formatting', desc: 'Toggle code mark' },
  { trigger: 'heading', title: 'Heading', category: 'Insert', desc: 'Convert to heading' },
  { trigger: 'save', title: 'Save', category: 'Document', desc: 'Save document' },
  { trigger: 'video', title: 'Video', category: 'Media', desc: 'Insert video block' },
  { trigger: 'audio', title: 'Audio', category: 'Media', desc: 'Insert audio block' },
  { trigger: 'file', title: 'File', category: 'Media', desc: 'Insert file block' },
  { trigger: 'table', title: 'Table', category: 'Insert', desc: 'Insert table block' },
  { trigger: 'embed', title: 'Embed', category: 'Insert', desc: 'Insert embed block' },
  { trigger: 'callout', title: 'Callout', category: 'Insert', desc: 'Insert callout block' },
  { trigger: 'alert', title: 'Alert', category: 'Insert', desc: 'Insert alert block' },
  { trigger: 'image', title: 'Image', category: 'Media', desc: 'Insert image block' },
  { trigger: 'quote', title: 'Quote', category: 'Insert', desc: 'Insert quote block' },
  { trigger: 'divider', title: 'Divider', category: 'Insert', desc: 'Insert divider' },
  { trigger: 'quiz', title: 'Quiz', category: 'Interactive', desc: 'Insert quiz block' },
  { trigger: 'poll', title: 'Poll', category: 'Interactive', desc: 'Insert poll block' },
  { trigger: 'gallery', title: 'Gallery', category: 'Interactive', desc: 'Insert gallery block' },
  { trigger: 'carousel', title: 'Carousel', category: 'Interactive', desc: 'Insert carousel block' },
  { trigger: 'card', title: 'Card', category: 'Interactive', desc: 'Insert card block' },
  { trigger: 'accordion', title: 'Accordion', category: 'Interactive', desc: 'Insert accordion block' },
  { trigger: 'chart', title: 'Chart', category: 'Interactive', desc: 'Insert chart block' },
  { trigger: 'timeline', title: 'Timeline', category: 'Interactive', desc: 'Insert timeline block' },
];

/* ─── Helpers ─── */
function formatCombo(combo: string, isMac: boolean): string {
  const map: Record<string, string> = isMac
    ? { mod: '⌘', alt: '⌥', shift: '⇧', ctrl: '⌃', enter: '↵', escape: 'Esc', backspace: '⌫', delete: 'Del', tab: '⇥', space: 'Space' }
    : { mod: 'Ctrl', alt: 'Alt', shift: 'Shift', ctrl: 'Ctrl', enter: 'Enter', escape: 'Esc', backspace: 'Backspace', delete: 'Del', tab: 'Tab', space: 'Space' };
  return combo
    .split('+')
    .map(k => map[k.toLowerCase()] || k.toUpperCase())
    .join(isMac ? '' : '+');
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/* ─── Key Capture Component ─── */
function KeyCaptureInput({ value, onChange }: { value: string; onChange: (combo: string) => void }) {
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState('');
  const isMac = useMemo(() => typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac'), []);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!capturing) return;
    const keys = new Set<string>();

    const onDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const parts: string[] = [];
      if (e.ctrlKey) parts.push('ctrl');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey) parts.push('shift');
      if (e.metaKey) parts.push('mod');

      const key = e.key.toLowerCase();
      if (!['control', 'alt', 'shift', 'meta', 'capslock'].includes(key)) {
        parts.push(key);
      }

      const combo = parts.join('+');
      setPreview(combo);
      keys.add(key);
    };

    const onUp = (e: KeyboardEvent) => {
      e.preventDefault();
      keys.delete(e.key.toLowerCase());
      if (keys.size === 0 && preview) {
        onChange(preview);
        setCapturing(false);
        setPreview('');
      }
    };

    window.addEventListener('keydown', onDown, true);
    window.addEventListener('keyup', onUp, true);
    return () => {
      window.removeEventListener('keydown', onDown, true);
      window.removeEventListener('keyup', onUp, true);
    };
  }, [capturing, preview, onChange]);

  return (
    <div
      ref={ref}
      onClick={() => setCapturing(true)}
      tabIndex={0}
      className={cx(
        'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs outline-none transition-colors',
        capturing
          ? 'border-[var(--pulse-red)] bg-[var(--pulse-red)]/5 text-[var(--pulse-red)] ring-2 ring-[var(--pulse-red)]/20'
          : 'border-[var(--neutral-200)] bg-white text-[var(--neutral-600)] hover:border-[var(--neutral-300)]'
      )}
    >
      <Keyboard className="h-3.5 w-3.5" />
      <span className="font-mono font-semibold">
        {capturing
          ? preview
            ? `Recording: ${formatCombo(preview, isMac)}`
            : 'Press key combo...'
          : value
            ? formatCombo(value, isMac)
            : 'Click to record shortcut'}
      </span>
      {capturing && (
        <button
          onClick={(e) => { e.stopPropagation(); setCapturing(false); setPreview(''); }}
          className="ml-auto text-[10px] text-[var(--neutral-400)] hover:text-[var(--pulse-black)]"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function ReferencePage() {
  const isMac = useMemo(() => typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac'), []);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'slash' | 'custom'>('shortcuts');

  /* Custom commands persisted in localStorage */
  const [customCommands, setCustomCommands] = useState<CustomCommand[]>([]);
  const [newCmdTitle, setNewCmdTitle] = useState('');
  const [newCmdSlash, setNewCmdSlash] = useState('');
  const [newCmdCombo, setNewCmdCombo] = useState('');
  const [newCmdActionType, setNewCmdActionType] = useState<CustomCommand['actionType']>('alert');
  const [newCmdActionData, setNewCmdActionData] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pulse_custom_commands');
      if (raw) setCustomCommands(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((cmds: CustomCommand[]) => {
    setCustomCommands(cmds);
    localStorage.setItem('pulse_custom_commands', JSON.stringify(cmds));
  }, []);

  const addCustom = useCallback(() => {
    if (!newCmdTitle.trim()) return;
    const cmd: CustomCommand = {
      id: `user.${Date.now()}`,
      title: newCmdTitle.trim(),
      slashTrigger: newCmdSlash.trim() || undefined,
      combo: newCmdCombo.trim() || undefined,
      actionType: newCmdActionType,
      actionData: newCmdActionData,
    };
    persist([...customCommands, cmd]);
    setNewCmdTitle('');
    setNewCmdSlash('');
    setNewCmdCombo('');
    setNewCmdActionData('');
  }, [newCmdTitle, newCmdSlash, newCmdCombo, newCmdActionType, newCmdActionData, customCommands, persist]);

  const removeCustom = useCallback((id: string) => {
    persist(customCommands.filter(c => c.id !== id));
  }, [customCommands, persist]);

  const runCustom = useCallback((cmd: CustomCommand) => {
    switch (cmd.actionType) {
      case 'alert':
        alert(cmd.actionData || `Command: ${cmd.title}`);
        break;
      case 'console-log':
        console.log(`[Custom Command] ${cmd.title}:`, cmd.actionData);
        break;
      case 'insert-text':
        navigator.clipboard.writeText(cmd.actionData).then(() => {
          alert(`Copied to clipboard: ${cmd.actionData}`);
        }).catch(() => {
          alert(`Text to insert: ${cmd.actionData}`);
        });
        break;
    }
  }, []);

  const exportCommands = useCallback(() => {
    const blob = new Blob([JSON.stringify(customCommands, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pulse-custom-commands.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [customCommands]);

  const importCommands = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data)) {
          persist(data);
        }
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [persist]);

  /* Filtering */
  const q = query.toLowerCase().trim();

  const filteredCategories = useMemo(() => {
    if (!q) return SHORTCUT_CATEGORIES;
    return SHORTCUT_CATEGORIES.map(cat => ({
      ...cat,
      bindings: Object.fromEntries(
        Object.entries(cat.bindings).filter(([, b]: [string, any]) =>
          (b.description || b.combo || b.commandId || '').toLowerCase().includes(q)
        )
      ),
    })).filter(cat => Object.keys(cat.bindings).length > 0);
  }, [q]);

  const filteredSlash = useMemo(() => {
    if (!q) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter(c =>
      c.trigger.includes(q) || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [q]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pulse-black)]">Reference</h1>
        <p className="mt-1 text-sm text-[var(--neutral-600)]">
          Keyboard shortcuts, slash commands, and custom command authoring
        </p>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--neutral-400)]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search shortcuts or commands..."
            className="w-full rounded-xl border border-[var(--neutral-200)] bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] bg-white p-0.5">
          {([
            { key: 'shortcuts', label: 'Shortcuts' },
            { key: 'slash', label: 'Slash Commands' },
            { key: 'custom', label: 'Custom' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cx(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                activeTab === tab.key
                  ? 'bg-[var(--pulse-black)] text-white'
                  : 'text-[var(--neutral-500)] hover:text-[var(--pulse-black)]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Shortcuts Tab ─── */}
      {activeTab === 'shortcuts' && (
        <div className="space-y-6">
          {filteredCategories.map(cat => {
            const Icon = cat.icon;
            const entries = Object.entries(cat.bindings);
            if (entries.length === 0) return null;
            return (
              <div key={cat.name} className="rounded-xl border border-[var(--neutral-200)] bg-white p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--pulse-black)]">
                  <Icon className="h-4 w-4 text-[var(--pulse-red)]" />
                  {cat.name}
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map(([key, binding]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-[var(--neutral-200)] px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[var(--neutral-700)]">{binding.description || binding.commandId}</p>
                        <p className="truncate text-[10px] text-[var(--neutral-400)]">{binding.commandId}</p>
                      </div>
                      <kbd className="ml-2 shrink-0 rounded bg-[var(--neutral-100)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--neutral-600)]">
                        {formatCombo(binding.combo, isMac)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Slash Commands Tab ─── */}
      {activeTab === 'slash' && (
        <div className="rounded-xl border border-[var(--neutral-200)] bg-white p-4">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-[var(--pulse-black)]">
            <Command className="h-4 w-4 text-[var(--pulse-red)]" />
            Slash Commands
          </h2>
          <p className="mb-4 text-xs text-[var(--neutral-500)]">
            Type <kbd className="rounded bg-[var(--neutral-100)] px-1 py-0.5 font-mono text-[10px]">/</kbd> in the editor to open the command palette
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSlash.map(cmd => (
              <div key={cmd.trigger} className="flex items-start gap-3 rounded-lg border border-[var(--neutral-200)] px-3 py-2">
                <span className="mt-0.5 rounded bg-[var(--pulse-black)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                  /{cmd.trigger}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--neutral-700)]">{cmd.title}</p>
                  <p className="text-[10px] text-[var(--neutral-400)]">{cmd.desc}</p>
                </div>
                <span className="ml-auto shrink-0 text-[10px] text-[var(--neutral-400)]">{cmd.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Custom Commands Tab ─── */}
      {activeTab === 'custom' && (
        <div className="space-y-6">
          {/* Creation form */}
          <div className="rounded-xl border border-[var(--neutral-200)] bg-white p-4">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--pulse-black)]">
              <Plus className="h-4 w-4 text-[var(--pulse-red)]" />
              Create Custom Command
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
                  Command Name
                </label>
                <input
                  value={newCmdTitle}
                  onChange={e => setNewCmdTitle(e.target.value)}
                  placeholder="e.g. Insert Signature"
                  className="w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-xs outline-none focus:border-[var(--pulse-red)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
                  Slash Trigger (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--neutral-400)]">/</span>
                  <input
                    value={newCmdSlash}
                    onChange={e => setNewCmdSlash(e.target.value.replace(/\s+/g, ''))}
                    placeholder="signature"
                    className="w-full rounded-lg border border-[var(--neutral-200)] bg-white py-2 pl-6 pr-3 text-xs outline-none focus:border-[var(--pulse-red)]"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
                  Keyboard Shortcut
                </label>
                <KeyCaptureInput value={newCmdCombo} onChange={setNewCmdCombo} />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
                  Action Type
                </label>
                <select
                  value={newCmdActionType}
                  onChange={e => setNewCmdActionType(e.target.value as CustomCommand['actionType'])}
                  className="w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-xs outline-none focus:border-[var(--pulse-red)]"
                >
                  <option value="alert">Show Alert</option>
                  <option value="console-log">Console Log</option>
                  <option value="insert-text">Copy Text to Clipboard</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
                  Action Data
                </label>
                <input
                  value={newCmdActionData}
                  onChange={e => setNewCmdActionData(e.target.value)}
                  placeholder={
                    newCmdActionType === 'alert' ? 'Message to show...'
                    : newCmdActionType === 'console-log' ? 'Text to log...'
                    : 'Text to copy...'
                  }
                  className="w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-xs outline-none focus:border-[var(--pulse-red)]"
                />
              </div>
            </div>
            <button
              onClick={addCustom}
              disabled={!newCmdTitle.trim()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--pulse-black)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--pulse-red)] disabled:opacity-40 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              Save Command
            </button>
          </div>

          {/* List */}
          {customCommands.length > 0 && (
            <div className="rounded-xl border border-[var(--neutral-200)] bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--pulse-black)]">Your Commands ({customCommands.length})</h2>
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--neutral-200)] px-2 py-1 text-[10px] font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] transition-colors">
                    <Upload className="h-3 w-3" />
                    Import
                    <input type="file" accept=".json" className="sr-only" onChange={importCommands} />
                  </label>
                  <button
                    onClick={exportCommands}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] px-2 py-1 text-[10px] font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {customCommands.map(cmd => (
                  <div key={cmd.id} className="flex items-center gap-3 rounded-lg border border-[var(--neutral-200)] px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--pulse-black)]">{cmd.title}</span>
                        {cmd.slashTrigger && (
                          <span className="rounded bg-[var(--pulse-black)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                            /{cmd.slashTrigger}
                          </span>
                        )}
                        {cmd.combo && (
                          <kbd className="rounded bg-[var(--neutral-100)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[var(--neutral-600)]">
                            {formatCombo(cmd.combo, isMac)}
                          </kbd>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] text-[var(--neutral-400)]">
                        Action: {cmd.actionType} — {cmd.actionData}
                      </p>
                    </div>
                    <button
                      onClick={() => runCustom(cmd)}
                      className="rounded-lg p-1.5 text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] transition-colors"
                      title="Run command"
                    >
                      <Zap className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeCustom(cmd.id)}
                      className="rounded-lg p-1.5 text-[var(--neutral-400)] hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
