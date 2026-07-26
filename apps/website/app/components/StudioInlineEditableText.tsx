'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';

/**
 * Click-to-edit inline text used by the outline panel and the collapsible
 * block header. Commits on Enter/blur, reverts on Escape. An empty commit
 * clears the override so the computed default comes back.
 */
export function InlineEditableText({
  value,
  placeholder = 'Add…',
  onCommit,
  className = '',
  inputClassName = '',
  ariaLabel,
  maxLength = 120,
}: {
  value: string;
  placeholder?: string;
  onCommit: (next: string) => void;
  className?: string;
  inputClassName?: string;
  ariaLabel: string;
  maxLength?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onCommit(trimmed);
  };
  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        maxLength={maxLength}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className={`w-full min-w-0 rounded-md border border-[var(--pulse-red)]/40 bg-white px-1.5 py-0.5 outline-none ring-1 ring-[var(--pulse-red)]/10 ${inputClassName}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setDraft(value);
        setEditing(true);
      }}
      aria-label={`${ariaLabel} — click to edit`}
      title="Click to edit"
      className={`group/inline inline-flex max-w-full items-center gap-1 rounded px-0.5 -mx-0.5 text-left transition-colors hover:bg-[var(--neutral-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pulse-red)]/40 ${className}`}
    >
      {value ? (
        <span className="truncate">{value}</span>
      ) : (
        <span className="truncate italic text-[var(--neutral-400)]">{placeholder}</span>
      )}
      <Pencil className="h-2.5 w-2.5 shrink-0 text-[var(--neutral-400)] opacity-0 transition-opacity group-hover/inline:opacity-100" />
    </button>
  );
}
