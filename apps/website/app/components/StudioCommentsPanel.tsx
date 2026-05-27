'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, CheckCircle2, XCircle, Send, CornerDownRight,
  MoreHorizontal, Trash2, RotateCcw, Filter, Pencil,
} from 'lucide-react';
import { CommentSystem, type Comment, type CommentStatus } from '@pulse/core';
import { useAuth } from '../../lib/use-api';
import type { Block, BlockData } from '@pulse/core';

/* ─── Types ─── */
interface StudioCommentsPanelProps {
  commentSystem: CommentSystem;
  entryId: string;
  activeBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  blocks?: Block<BlockData>[];
}

type FilterMode = 'all' | 'active' | 'resolved';

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
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ─── Avatar ─── */
function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const color = hashColor(name);
  return (
    <div
      className="flex items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
      style={{ width: size, height: size, backgroundColor: color }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: CommentStatus }) {
  const styles: Record<CommentStatus, string> = {
    active: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    deleted: 'bg-neutral-100 text-neutral-400 border-neutral-200',
  };
  const icons = {
    active: <MessageSquare className="h-2.5 w-2.5" />,
    resolved: <CheckCircle2 className="h-2.5 w-2.5" />,
    rejected: <XCircle className="h-2.5 w-2.5" />,
    deleted: <Trash2 className="h-2.5 w-2.5" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
}

/* ─── Composer ─── */
function Composer({
  placeholder,
  onSubmit,
  compact = false,
}: {
  placeholder: string;
  onSubmit: (text: string) => void;
  compact?: boolean;
}) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  }, [text, onSubmit]);

  return (
    <div className={`rounded-xl border border-[var(--neutral-200)] bg-white transition-shadow focus-within:border-[var(--pulse-red)]/40 focus-within:shadow-sm focus-within:ring-1 focus-within:ring-[var(--pulse-red)]/10 ${compact ? 'p-2' : 'p-3'}`}>
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        className="w-full resize-none bg-transparent text-xs text-[var(--pulse-black)] outline-none placeholder:text-[var(--neutral-400)]"
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[9px] text-[var(--neutral-400)]">
          {text.length > 0 ? `Ctrl+Enter to send · ${text.length} chars` : 'Ctrl+Enter to send'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-[var(--pulse-black)] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[var(--pulse-red)] disabled:opacity-40 disabled:hover:bg-[var(--pulse-black)]"
        >
          <Send className="h-3 w-3" />
          Send
        </button>
      </div>
    </div>
  );
}

/* ─── Block reference lookup ─── */
const BLOCK_TYPE_LABELS: Record<string, string> = {
  text: 'Paragraph', heading: 'Heading', list: 'List', code: 'Code',
  blockquote: 'Quote', callout: 'Callout', image: 'Image', video: 'Video',
  audio: 'Audio', embed: 'Embed', file: 'File', table: 'Table',
  quiz: 'Quiz', poll: 'Poll', survey: 'Survey', accordion: 'Accordion',
  tabs: 'Tabs', toggle: 'Toggle', spoiler: 'Spoiler', chart: 'Chart',
  map: 'Map', 'math-equation': 'Equation', diagram: 'Diagram',
  'manga-panel': 'Manga Panel', 'speech-bubble': 'Speech Bubble',
  card: 'Card', gallery: 'Gallery', carousel: 'Carousel',
  flashcard: 'Flashcard', timeline: 'Timeline', comparison: 'Comparison',
  'before-after': 'Before / After', 'hero-section': 'Hero Section',
  'annotated-image': 'Annotated Image', link: 'Link', 'horizontal-rule': 'Divider',
  alert: 'Alert',
};

/* ─── Comment Thread ─── */
function CommentThreadItem({
  comment,
  commentSystem,
  currentAdmin,
  onSelectBlock,
  blocks,
  onMutate,
}: {
  comment: Comment;
  commentSystem: CommentSystem;
  currentAdmin: string;
  onSelectBlock?: (blockId: string) => void;
  blocks?: Block<BlockData>[];
  onMutate?: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [error, setError] = useState<string | null>(null);

  const isAuthor = comment.author.id === currentAdmin || comment.author.name === currentAdmin;

  const handleReply = useCallback(
    (text: string) => {
      try {
        setError(null);
        commentSystem.addReply(comment.id, {
          author: { id: currentAdmin, name: currentAdmin },
          content: text,
        });
        setShowReply(false);
        onMutate?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reply');
      }
    },
    [comment.id, commentSystem, currentAdmin, onMutate]
  );

  const handleResolve = useCallback(() => {
    try {
      setError(null);
      commentSystem.resolveComment(comment.id, currentAdmin);
      onMutate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve');
    }
    setShowMenu(false);
  }, [comment.id, commentSystem, currentAdmin, onMutate]);

  const handleReject = useCallback(() => {
    try {
      setError(null);
      commentSystem.rejectComment(comment.id);
      onMutate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    }
    setShowMenu(false);
  }, [comment.id, commentSystem, onMutate]);

  const handleReopen = useCallback(() => {
    try {
      setError(null);
      commentSystem.reopenComment(comment.id);
      onMutate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reopen');
    }
  }, [comment.id, commentSystem, onMutate]);

  const handleDelete = useCallback(() => {
    if (!isAuthor) {
      setError('You can only delete your own comments');
      setShowMenu(false);
      return;
    }
    try {
      setError(null);
      commentSystem.deleteComment(comment.id);
      onMutate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
    setShowMenu(false);
  }, [comment.id, commentSystem, isAuthor, onMutate]);

  const handleEdit = useCallback(() => {
    if (!isAuthor) {
      setError('You can only edit your own comments');
      return;
    }
    const trimmed = editText.trim();
    if (!trimmed || trimmed === comment.content) {
      setIsEditing(false);
      setEditText(comment.content);
      return;
    }
    try {
      setError(null);
      commentSystem.updateComment(comment.id, trimmed);
      onMutate?.();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit');
    }
  }, [comment.id, commentSystem, editText, comment.content, isAuthor, onMutate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      {/* Main comment */}
      <div className="rounded-xl border border-[var(--neutral-200)] bg-white p-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start gap-2.5">
          <Avatar name={comment.author.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[var(--pulse-black)]">{comment.author.name}</span>
              <StatusBadge status={comment.status} />
              <span className="text-[10px] text-[var(--neutral-400)]" title={formatDate(comment.createdAt)}>
                {timeAgo(comment.createdAt)}
              </span>
            </div>

            {/* Block reference */}
            {comment.range?.blockId && onSelectBlock && (
              <button
                onClick={() => onSelectBlock(comment.range!.blockId)}
                className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
              >
                <CornerDownRight className="h-2.5 w-2.5" />
                {BLOCK_TYPE_LABELS[blocks?.find(b => b.id === comment.range!.blockId)?.type || ''] || 'Block'} comment
              </button>
            )}

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleEdit();
                    }
                    if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditText(comment.content);
                    }
                  }}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[var(--neutral-200)] bg-white p-2 text-xs text-[var(--pulse-black)] outline-none focus:border-[var(--pulse-red)]/40"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEdit}
                    className="rounded-md bg-[var(--pulse-black)] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[var(--pulse-red)] transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditText(comment.content); }}
                    className="rounded-md border border-[var(--neutral-200)] px-2.5 py-1 text-[10px] font-bold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-[var(--neutral-700)] whitespace-pre-wrap">
                {comment.content}
              </p>
            )}

            {/* Error */}
            {error && (
              <p className="mt-1.5 text-[10px] font-semibold text-red-500">{error}</p>
            )}

            {/* Actions */}
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => setShowReply((s) => !s)}
                className="text-[10px] font-semibold text-[var(--neutral-500)] hover:text-[var(--pulse-red)] transition-colors"
              >
                Reply
              </button>
              {comment.status === 'active' && (
                <>
                  <button
                    onClick={handleResolve}
                    className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={handleReject}
                    className="text-[10px] font-semibold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
              {(comment.status === 'resolved' || comment.status === 'rejected') && (
                <button
                  onClick={handleReopen}
                  className="text-[10px] font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <RotateCcw className="inline h-2.5 w-2.5 mr-0.5" />
                  Reopen
                </button>
              )}

              {/* Edit — only for author */}
              {isAuthor && !isEditing && (
                <button
                  onClick={() => { setEditText(comment.content); setIsEditing(true); }}
                  className="ml-auto rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}

              {/* Menu — only show delete option for author */}
              {isAuthor && !isEditing && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu((s) => !s)}
                    className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] transition-colors"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                  <AnimatePresence>
                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-lg border border-[var(--neutral-200)] bg-white py-1 shadow-lg"
                        >
                          <button
                            onClick={() => { setIsEditing(true); setEditText(comment.content); setShowMenu(false); }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={handleDelete}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-2 ml-6 space-y-2 border-l-2 border-[var(--neutral-200)] pl-3">
          {comment.replies.map((reply) => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg bg-[var(--neutral-50)] p-2.5"
            >
              <div className="flex items-start gap-2">
                <Avatar name={reply.author.name} size={22} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[var(--pulse-black)]">{reply.author.name}</span>
                    <span className="text-[9px] text-[var(--neutral-400)]">{timeAgo(reply.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--neutral-700)] whitespace-pre-wrap">
                    {reply.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reply composer */}
      <AnimatePresence>
        {showReply && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-6 pl-3">
              <Composer
                placeholder={`Reply to ${comment.author.name}...`}
                onSubmit={handleReply}
                compact
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Panel ─── */
export default function StudioCommentsPanel({
  commentSystem,
  entryId: _entryId,
  activeBlockId,
  onSelectBlock,
  blocks,
}: StudioCommentsPanelProps) {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterMode>('all');
  const currentAdmin = user?.displayName || user?.email || 'Anonymous';
  const [, tick] = useState(0); // force re-render when commentSystem changes

  const threads = useMemo(() => {
    const all = commentSystem.getThreads();
    if (filter === 'active') return all.filter((t) => t.comment.status === 'active');
    if (filter === 'resolved') return all.filter((t) => t.comment.status === 'resolved');
    return all;
  }, [commentSystem, filter, tick]);

  const stats = useMemo(() => commentSystem.getStats(), [commentSystem, tick]);

  const handleAddComment = useCallback(
    (text: string) => {
      try {
        commentSystem.addComment({
          type: 'comment',
          author: { id: currentAdmin, name: currentAdmin },
          content: text,
          range: activeBlockId ? { blockId: activeBlockId } : undefined,
          mentions: [],
        });
        tick((n) => n + 1);
      } catch (err) {
        console.error('Failed to add comment:', err);
      }
    },
    [commentSystem, currentAdmin, activeBlockId]
  );

  const handleMutate = useCallback(() => {
    tick((n) => n + 1);
  }, []);

  return (
    <div className="flex h-full flex-col bg-[var(--neutral-50)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--neutral-200)] bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--pulse-red)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Comments</span>
          {stats.total > 0 && (
            <span className="rounded-full bg-[var(--pulse-red)] px-1.5 py-0.5 text-[9px] font-bold text-white">
              {stats.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 rounded border border-[var(--neutral-200)] bg-white px-2 py-0.5">
            <Avatar name={currentAdmin} size={16} />
            <span className="text-[10px] font-semibold text-[var(--pulse-black)]">{currentAdmin}</span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--neutral-200)] bg-white px-3 py-1.5">
        {(['all', 'active', 'resolved'] as FilterMode[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              filter === f
                ? 'bg-[var(--pulse-black)] text-white'
                : 'text-[var(--neutral-500)] hover:bg-[var(--neutral-100)]'
            }`}
          >
            {f}
            {f === 'all' && stats.total > 0 && ` (${stats.total})`}
            {f === 'active' && stats.active > 0 && ` (${stats.active})`}
            {f === 'resolved' && stats.resolved > 0 && ` (${stats.resolved})`}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 text-[10px] text-[var(--neutral-400)]">
          <Filter className="h-3 w-3" />
          <span>{threads.length}</span>
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--neutral-100)]">
              <MessageSquare className="h-5 w-5 text-[var(--neutral-400)]" />
            </div>
            <p className="mt-3 text-xs font-semibold text-[var(--neutral-500)]">No comments yet</p>
            <p className="mt-1 text-[10px] text-[var(--neutral-400)] max-w-[200px]">
              {activeBlockId
                ? 'Add a comment on this block, or switch to another block.'
                : 'Select a block and add your first comment.'}
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <CommentThreadItem
              key={thread.id}
              comment={thread.comment}
              commentSystem={commentSystem}
              currentAdmin={currentAdmin}
              onSelectBlock={onSelectBlock}
              blocks={blocks}
              onMutate={handleMutate}
            />
          ))
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-[var(--neutral-200)] bg-white p-3">
        <Composer
          placeholder={activeBlockId ? 'Comment on this block...' : 'General comment...'}
          onSubmit={handleAddComment}
        />
      </div>
    </div>
  );
}
