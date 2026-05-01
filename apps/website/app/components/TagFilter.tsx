'use client';

import { Tag, X } from 'lucide-react';

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
}

export default function TagFilter({ tags, selectedTags, onTagToggle, onClearAll }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-[var(--pulse-jasmine)]" />
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
            Filter by tag
          </span>
        </div>
        {selectedTags.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-medium text-[var(--pulse-jasmine)] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? 'border-[var(--pulse-red)] bg-[var(--pulse-red)] text-white shadow-lg shadow-[var(--pulse-red)]/20'
                  : 'border-white/20 bg-white/10 text-white/90 backdrop-blur-sm hover:border-[var(--pulse-red)]/60 hover:bg-[var(--pulse-red)]/20'
              }`}
            >
              {tag}
              {isSelected && <X className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
