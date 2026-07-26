'use client';

import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ListTree, Search, X, RotateCcw, ChevronRight, ChevronDown,
  UnfoldVertical, FoldVertical, FileText, SearchX,
} from 'lucide-react';
import type { Block, BlockData } from '@pulse/core';
import {
  resolveOutlineEntry,
  setAllCollapsed,
  setBlockMeta,
  countCollapsed,
  type OutlineStore,
  type OutlineDisplayMaps,
  type ResolvedOutlineEntry,
} from '../../lib/studio-outline';
import {
  blockTypeToIcon,
  blockTypeToLabel,
  blockTypeToDescription,
} from './StudioBlockCanvas';
import { InlineEditableText } from './StudioInlineEditableText';
import { StudioTooltip } from './StudioTooltip';

/* ─── Types ─── */
interface StudioOutlinePanelProps {
  blocks: Block<BlockData>[];
  store: OutlineStore;
  onStoreChange: (next: OutlineStore) => void;
  onSelectBlock: (blockId: string) => void;
}

const DISPLAY_MAPS: OutlineDisplayMaps = {
  labels: blockTypeToLabel,
  descriptions: blockTypeToDescription,
};

/* ─── Outline row ─── */
function OutlineRow({
  block,
  index,
  depth,
  entry,
  collapsibleMode,
  reduceMotion,
  onSelect,
  onRename,
  onDescribe,
  onReset,
  onToggleCollapsed,
}: {
  block: Block<BlockData>;
  index: number;
  depth: number;
  entry: ResolvedOutlineEntry;
  collapsibleMode: boolean;
  reduceMotion: boolean | null;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDescribe: (description: string) => void;
  onReset: () => void;
  onToggleCollapsed: () => void;
}) {
  const Icon = blockTypeToIcon[block.type] || FileText;
  const isHeading = block.type === 'heading';
  const hasCustom = entry.hasCustomName || entry.hasCustomDescription;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: reduceMotion ? 0 : Math.min(index * 0.015, 0.12), ease: 'easeOut' }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target === e.currentTarget) {
            e.preventDefault();
            onSelect();
          }
        }}
        style={{ marginLeft: depth * 14 }}
        className={`group relative flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 pl-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pulse-red)]/40 ${
          isHeading
            ? 'border-[var(--neutral-200)] bg-white shadow-sm hover:border-[var(--pulse-red)]/30'
            : 'border-transparent bg-white/60 hover:border-[var(--neutral-200)] hover:bg-white hover:shadow-sm'
        }`}
      >
        {/* Active accent bar */}
        <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-[var(--pulse-red)] opacity-0 transition-opacity duration-150 group-hover:opacity-100" />

        {/* Number */}
        <span className="mt-1 w-5 shrink-0 text-right font-mono text-[9px] font-semibold tabular-nums text-[var(--neutral-400)]">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Type icon */}
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors duration-150 ${
            isHeading
              ? 'border-[var(--pulse-red)]/20 bg-[var(--pulse-red)]/5 text-[var(--pulse-red)]'
              : 'border-[var(--neutral-200)] bg-[var(--neutral-50)] text-[var(--neutral-500)] group-hover:border-[var(--pulse-red)]/20 group-hover:bg-[var(--pulse-red)]/5 group-hover:text-[var(--pulse-red)]'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>

        {/* Name + description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <InlineEditableText
              value={entry.name}
              placeholder={blockTypeToLabel[block.type] || block.type}
              onCommit={onRename}
              ariaLabel={`Name of block ${index + 1}`}
              maxLength={80}
              className={`min-w-0 flex-1 text-xs ${
                isHeading ? 'font-bold text-[var(--pulse-black)]' : 'font-semibold text-[var(--neutral-700)]'
              }`}
              inputClassName="text-xs font-semibold text-[var(--pulse-black)]"
            />
            {entry.collapsed && collapsibleMode && (
              <span className="shrink-0 rounded bg-[var(--neutral-100)] px-1 py-px text-[8px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
                closed
              </span>
            )}
          </div>
          <InlineEditableText
            value={entry.description}
            placeholder="Add a short description…"
            onCommit={onDescribe}
            ariaLabel={`Description of block ${index + 1}`}
            maxLength={140}
            className="mt-0.5 w-full text-[10.5px] leading-snug text-[var(--neutral-500)]"
            inputClassName="text-[10.5px] text-[var(--neutral-700)]"
          />
        </div>

        {/* Row actions */}
        <div className="mt-0.5 flex shrink-0 items-center gap-0.5">
          {hasCustom && (
            <StudioTooltip text="Reset name & description to auto" side="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                aria-label={`Reset block ${index + 1} to automatic name and description`}
                className="rounded p-1 text-[var(--neutral-400)] opacity-0 transition-opacity hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-red)] focus-visible:opacity-100 group-hover:opacity-100"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </StudioTooltip>
          )}
          {collapsibleMode && (
            <StudioTooltip text={entry.collapsed ? 'Expand block' : 'Collapse block'} side="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapsed();
                }}
                aria-label={entry.collapsed ? `Expand block ${index + 1}` : `Collapse block ${index + 1}`}
                aria-expanded={!entry.collapsed}
                className="rounded p-1 text-[var(--neutral-400)] opacity-0 transition-opacity hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] focus-visible:opacity-100 group-hover:opacity-100"
              >
                {entry.collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </StudioTooltip>
          )}
          <ChevronRight className="h-3.5 w-3.5 -translate-x-1 text-[var(--neutral-300)] opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-[var(--pulse-red)]" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Panel ─── */
export default function StudioOutlinePanel({
  blocks,
  store,
  onStoreChange,
  onSelectBlock,
}: StudioOutlinePanelProps) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const entries = useMemo(
    () => blocks.map((block) => resolveOutlineEntry(store, block, DISPLAY_MAPS)),
    [blocks, store]
  );

  const depths = useMemo(() => {
    const result: number[] = [];
    let current = 0;
    for (const block of blocks) {
      if (block.type === 'heading') {
        const raw = (block.data as { level?: number }).level;
        const level = Math.min(6, Math.max(1, typeof raw === 'number' ? raw : 1));
        result.push(Math.min(level - 1, 3));
        current = Math.min(level, 3);
      } else {
        result.push(current);
      }
    }
    return result;
  }, [blocks]);

  const typeChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const block of blocks) counts.set(block.type, (counts.get(block.type) ?? 0) + 1);
    return Array.from(counts.entries()).map(([type, count]) => ({
      type,
      count,
      label: blockTypeToLabel[type] || type,
    }));
  }, [blocks]);

  const filtering = query.trim().length > 0 || typeFilter !== null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blocks
      .map((block, index) => ({ block, index, entry: entries[index] }))
      .filter(({ block, entry }) => {
        if (typeFilter && block.type !== typeFilter) return false;
        if (!q) return true;
        const label = (blockTypeToLabel[block.type] || block.type).toLowerCase();
        return (
          entry.name.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q) ||
          label.includes(q)
        );
      });
  }, [blocks, entries, query, typeFilter]);

  const collapsedCount = countCollapsed(store);
  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  const updateBlock = (blockId: string, patch: Parameters<typeof setBlockMeta>[2]) => {
    onStoreChange(setBlockMeta(store, blockId, patch));
  };

  return (
    <div className="flex h-full flex-col bg-[var(--neutral-50)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--neutral-200)] bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--pulse-red)]/10">
            <ListTree className="h-4 w-4 text-[var(--pulse-red)]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-black)]">Outline</span>
              {blocks.length > 0 && (
                <span className="rounded-full bg-[var(--pulse-red)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {blocks.length}
                </span>
              )}
            </div>
            <p className="text-[9px] text-[var(--neutral-500)]">Document structure</p>
          </div>
        </div>
        <kbd className="rounded bg-[var(--neutral-100)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--neutral-500)]">
          Ctrl+O
        </kbd>
      </div>

      {/* Search */}
      <div className="border-b border-[var(--neutral-200)] bg-white px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--neutral-400)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the outline…"
            aria-label="Search the outline"
            className="w-full rounded-lg border border-[var(--neutral-200)] bg-white py-1.5 pl-7 pr-7 text-xs outline-none transition-colors focus:border-[var(--pulse-red)]/40 focus:ring-1 focus:ring-[var(--pulse-red)]/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--neutral-400)] transition-colors hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Type filter chips */}
      {typeChips.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--neutral-200)] bg-white px-3 py-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              typeFilter === null
                ? 'bg-[var(--pulse-black)] text-white'
                : 'text-[var(--neutral-500)] hover:bg-[var(--neutral-100)]'
            }`}
          >
            All ({blocks.length})
          </button>
          {typeChips.map((chip) => (
            <button
              key={chip.type}
              type="button"
              onClick={() => setTypeFilter((current) => (current === chip.type ? null : chip.type))}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                typeFilter === chip.type
                  ? 'bg-[var(--pulse-black)] text-white'
                  : 'text-[var(--neutral-500)] hover:bg-[var(--neutral-100)]'
              }`}
            >
              {chip.label} ({chip.count})
            </button>
          ))}
        </div>
      )}

      {/* Outline list */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--neutral-100)]">
              <ListTree className="h-6 w-6 text-[var(--neutral-400)]" />
            </div>
            <p className="mt-3 text-xs font-semibold text-[var(--neutral-600)]">No blocks yet</p>
            <p className="mt-1 max-w-[200px] text-[10px] text-[var(--neutral-400)]">
              Add blocks to the editor and they will appear here as a live outline.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--neutral-100)]">
              <SearchX className="h-6 w-6 text-[var(--neutral-400)]" />
            </div>
            <p className="mt-3 text-xs font-semibold text-[var(--neutral-600)]">Nothing matches</p>
            <p className="mt-1 max-w-[200px] text-[10px] text-[var(--neutral-400)]">
              Try a different search or clear the type filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setTypeFilter(null);
              }}
              className="mt-3 rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-[10px] font-bold text-[var(--neutral-600)] transition-colors hover:border-[var(--pulse-red)]/40 hover:text-[var(--pulse-red)] active:scale-[0.97]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          visible.map(({ block, index, entry }) => (
            <OutlineRow
              key={block.id}
              block={block}
              index={index}
              depth={filtering ? 0 : depths[index]}
              entry={entry}
              collapsibleMode={store.collapsibleMode}
              reduceMotion={reduceMotion}
              onSelect={() => onSelectBlock(block.id)}
              onRename={(name) => updateBlock(block.id, { name })}
              onDescribe={(description) => updateBlock(block.id, { description })}
              onReset={() => updateBlock(block.id, { name: '', description: '' })}
              onToggleCollapsed={() => updateBlock(block.id, { collapsed: !entry.collapsed })}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--neutral-200)] bg-white px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-[var(--neutral-500)]">
            <span className="font-semibold text-[var(--pulse-black)]">{blocks.length}</span> blocks
            {store.collapsibleMode && collapsedCount > 0 && (
              <>
                {' · '}
                <span className="font-semibold text-[var(--pulse-black)]">{collapsedCount}</span> collapsed
              </>
            )}
          </span>
          <div className="flex items-center gap-1">
            <StudioTooltip text="Expand all blocks (Ctrl+Shift+↓)" side="top">
              <button
                type="button"
                disabled={blocks.length === 0}
                onClick={() => onStoreChange(setAllCollapsed(store, blockIds, false))}
                aria-label="Expand all blocks"
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-[10px] font-bold text-[var(--neutral-600)] transition-colors hover:border-[var(--pulse-red)]/40 hover:text-[var(--pulse-red)] active:scale-[0.97] disabled:opacity-40 disabled:hover:border-[var(--neutral-200)] disabled:hover:text-[var(--neutral-600)]"
              >
                <UnfoldVertical className="h-3 w-3" />
                Expand
              </button>
            </StudioTooltip>
            <StudioTooltip text="Collapse all blocks (Ctrl+Shift+↑)" side="top">
              <button
                type="button"
                disabled={blocks.length === 0}
                onClick={() => onStoreChange(setAllCollapsed(store, blockIds, true))}
                aria-label="Collapse all blocks"
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-[10px] font-bold text-[var(--neutral-600)] transition-colors hover:border-[var(--pulse-red)]/40 hover:text-[var(--pulse-red)] active:scale-[0.97] disabled:opacity-40 disabled:hover:border-[var(--neutral-200)] disabled:hover:text-[var(--neutral-600)]"
              >
                <FoldVertical className="h-3 w-3" />
                Collapse
              </button>
            </StudioTooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
