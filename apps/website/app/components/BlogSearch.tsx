'use client';

import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface BlogSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function BlogSearch({ onSearch, placeholder = 'Search articles...' }: BlogSearchProps) {
  const [query, setQuery] = useState('');

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search className="h-5 w-5 text-[var(--neutral-400)]" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--neutral-200)] bg-white py-3 pl-12 pr-12 text-[var(--pulse-black)] placeholder-[var(--neutral-400)] transition-all focus:border-[var(--pulse-red)] focus:outline-none focus:ring-2 focus:ring-[var(--pulse-red)]/20"
      />
      {query && (
        <button
          onClick={clearSearch}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
