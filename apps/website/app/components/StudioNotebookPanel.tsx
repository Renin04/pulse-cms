'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Pin, PinOff, Trash2, Send, Search, Clock,
  StickyNote, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../lib/use-api';

/* ─── Types ─── */
interface NotebookEntry {
  id: string;
  author: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StudioNotebookPanelProps {
  entryId: string;
  onSelectBlock?: (blockId: string) => void;
}

/* ─── Helpers ─── */
function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function hashColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue} 65% 45%)`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function generateId() {
  return `note-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/* ─── Storage ─── */
const STORAGE_KEY = (entryId: string) => `pulse-notebook-${entryId}`;

function loadNotes(entryId: string): NotebookEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(entryId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n: unknown): n is NotebookEntry =>
        typeof n === 'object' &&
        n !== null &&
        typeof (n as NotebookEntry).id === 'string' &&
        typeof (n as NotebookEntry).content === 'string' &&
        typeof (n as NotebookEntry).author === 'string'
    );
  } catch { return []; }
}

function saveNotes(entryId: string, notes: NotebookEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY(entryId), JSON.stringify(notes));
}

/* ─── Avatar ─── */
function Avatar({ name, size = 26 }: { name: string; size?: number }) {
  const color = hashColor(name);
  return (
    <div
      className="flex items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0 ring-2 ring-white shadow-sm"
      style={{ width: size, height: size, backgroundColor: color }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

/* ─── Note Card ─── */
function NoteCard({
  note,
  currentAdmin,
  onTogglePin,
  onDelete,
  onEdit,
}: {
  note: NotebookEntry;
  currentAdmin: string;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.content);
  const isLong = note.content.length > 200;
  const isAuthor = note.author === currentAdmin;

  const handleSaveEdit = useCallback(() => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== note.content) {
      onEdit(note.id, trimmed);
    }
    setIsEditing(false);
  }, [editText, note.id, note.content, onEdit]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`group relative rounded-xl border p-3 transition-shadow hover:shadow-md ${
        note.pinned
          ? 'border-[var(--pulse-jasmine)] bg-[var(--pulse-jasmine-light)]/40 shadow-sm'
          : 'border-[var(--neutral-200)] bg-white'
      }`}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <div className="absolute -top-1.5 -right-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--pulse-red)] shadow-sm">
            <Pin className="h-2.5 w-2.5 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar name={note.author} />
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold text-[var(--pulse-black)]">{note.author}</span>
          <div className="flex items-center gap-1 text-[9px] text-[var(--neutral-400)]">
            <Clock className="h-2.5 w-2.5" />
            <span title={formatDate(note.createdAt)}>{timeAgo(note.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSaveEdit();
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditText(note.content);
              }
            }}
            rows={3}
            className="w-full resize-none rounded-lg border border-[var(--neutral-200)] bg-white p-2 text-xs text-[var(--pulse-black)] outline-none focus:border-[var(--pulse-red)]/40"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              className="rounded-md bg-[var(--pulse-black)] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[var(--pulse-red)] transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditText(note.content); }}
              className="rounded-md border border-[var(--neutral-200)] px-2.5 py-1 text-[10px] font-bold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <p
              className={`text-xs leading-relaxed text-[var(--neutral-700)] whitespace-pre-wrap ${
                !expanded && isLong ? 'line-clamp-4' : ''
              }`}
            >
              {note.content}
            </p>
            {isLong && !expanded && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent" />
            )}
          </div>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-[10px] font-semibold text-[var(--pulse-red)] hover:text-[var(--pulse-red-dark)] transition-colors"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </>
      )}

      {/* Actions — only for author */}
      {isAuthor && !isEditing && (
        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onTogglePin(note.id)}
            className={`rounded p-1 text-[10px] font-semibold transition-colors ${
              note.pinned
                ? 'text-[var(--pulse-red)] hover:bg-[var(--pulse-red)]/10'
                : 'text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]'
            }`}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            {note.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
          </button>
          <button
            onClick={() => { setEditText(note.content); setIsEditing(true); }}
            className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] transition-colors"
            title="Edit"
          >
            <Send className="h-3 w-3 rotate-[-45deg]" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="rounded p-1 text-[var(--neutral-400)] hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Composer ─── */
function NoteComposer({
  onSubmit,
  currentAdmin: _currentAdmin,
}: {
  onSubmit: (text: string, pinned: boolean) => void;
  currentAdmin: string;
}) {
  const [text, setText] = useState('');
  const [pinned, setPinned] = useState(false);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed, pinned);
    setText('');
    setPinned(false);
  }, [text, pinned, onSubmit]);

  return (
    <div className="rounded-xl border border-[var(--neutral-200)] bg-white p-3 transition-shadow focus-within:border-[var(--pulse-red)]/40 focus-within:shadow-sm focus-within:ring-1 focus-within:ring-[var(--pulse-red)]/10">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Jot down a thought, idea, or reminder..."
        rows={3}
        className="w-full resize-none bg-transparent text-xs text-[var(--pulse-black)] outline-none placeholder:text-[var(--neutral-400)]"
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPinned((p) => !p)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors ${
              pinned
                ? 'border-[var(--pulse-red)]/30 bg-[var(--pulse-red)]/10 text-[var(--pulse-red)]'
                : 'border-[var(--neutral-200)] text-[var(--neutral-500)] hover:bg-[var(--neutral-100)]'
            }`}
          >
            <Pin className="h-3 w-3" />
            {pinned ? 'Pinned' : 'Pin'}
          </button>
          <span className="text-[9px] text-[var(--neutral-400)]">
            Ctrl+Enter to save
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-[var(--pulse-black)] px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-[var(--pulse-red)] disabled:opacity-40"
        >
          <Send className="h-3 w-3" />
          Save Note
        </button>
      </div>
    </div>
  );
}

/* ─── Main Panel ─── */
export default function StudioNotebookPanel({ entryId }: StudioNotebookPanelProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NotebookEntry[]>(() => loadNotes(entryId));
  const currentAdmin = user?.displayName || user?.email || 'Anonymous';
  const [searchQuery, setSearchQuery] = useState('');

  const persist = useCallback((next: NotebookEntry[]) => {
    setNotes(next);
    try {
      saveNotes(entryId, next);
    } catch (err) {
      console.error('Failed to persist notebook:', err);
    }
  }, [entryId]);

  const handleAdd = useCallback((text: string, pinned: boolean) => {
    const now = new Date().toISOString();
    const newNote: NotebookEntry = {
      id: generateId(),
      author: currentAdmin,
      content: text,
      pinned,
      createdAt: now,
      updatedAt: now,
    };
    persist([newNote, ...notes]);
  }, [currentAdmin, notes, persist]);

  const handleTogglePin = useCallback((id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note && note.author !== currentAdmin) {
      console.warn('Cannot pin: not the author');
      return;
    }
    persist(
      notes.map((n) =>
        n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n
      )
    );
  }, [notes, persist, currentAdmin]);

  const handleDelete = useCallback((id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note && note.author !== currentAdmin) {
      console.warn('Cannot delete: not the author');
      return;
    }
    persist(notes.filter((n) => n.id !== id));
  }, [notes, persist, currentAdmin]);

  const handleEdit = useCallback((id: string, content: string) => {
    const note = notes.find((n) => n.id === id);
    if (note && note.author !== currentAdmin) {
      console.warn('Cannot edit: not the author');
      return;
    }
    persist(
      notes.map((n) =>
        n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n
      )
    );
  }, [notes, persist, currentAdmin]);

  const filteredNotes = useMemo(() => {
    let result = [...notes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((n) =>
        n.content.toLowerCase().includes(q) || n.author.toLowerCase().includes(q)
      );
    }
    // Pinned first, then by date
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [notes, searchQuery]);

  const pinnedCount = notes.filter((n) => n.pinned).length;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[var(--neutral-200)] bg-white px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--pulse-jasmine-light)]">
              <BookOpen className="h-4 w-4 text-[var(--pulse-black)]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-black)]">Notebook</span>
              <p className="text-[9px] text-[var(--neutral-500)]">Personal notes & ideas</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded border border-[var(--neutral-200)] bg-white px-2 py-0.5">
            <Avatar name={currentAdmin} size={16} />
            <span className="text-[10px] font-semibold text-[var(--pulse-black)]">{currentAdmin}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--neutral-400)]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full rounded-lg border border-[var(--neutral-200)] bg-white py-1.5 pl-7 pr-3 text-xs outline-none focus:border-[var(--pulse-red)]/40 focus:ring-1 focus:ring-[var(--pulse-red)]/10"
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-1.5">
        <div className="flex items-center gap-1 text-[10px] text-[var(--neutral-500)]">
          <StickyNote className="h-3 w-3" />
          <span className="font-semibold">{notes.length}</span> notes
        </div>
        {pinnedCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-[var(--pulse-red)]">
            <Pin className="h-3 w-3" fill="currentColor" />
            <span className="font-semibold">{pinnedCount}</span> pinned
          </div>
        )}
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-14 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--neutral-100)]">
                <Sparkles className="h-6 w-6 text-[var(--neutral-400)]" />
              </div>
              <p className="mt-3 text-xs font-semibold text-[var(--neutral-600)]">Your notebook is empty</p>
              <p className="mt-1 text-[10px] text-[var(--neutral-400)] max-w-[180px]">
                Capture ideas, reminders, and research notes for this article.
              </p>
            </motion.div>
          ) : (
            filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                currentAdmin={currentAdmin}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="border-t border-[var(--neutral-200)] bg-white p-3">
        <NoteComposer onSubmit={handleAdd} currentAdmin={currentAdmin} />
      </div>
    </div>
  );
}
