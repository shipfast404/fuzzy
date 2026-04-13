'use client';

import { useState, useRef, useEffect } from 'react';
import type { CatalogItem } from '@/lib/types';

interface SearchDropdownProps {
  items: CatalogItem[];
  onSelect: (item: CatalogItem) => void;
  onClose: () => void;
}

export function SearchDropdown({ items, onSelect, onClose }: SearchDropdownProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filtered = query.trim()
    ? items.filter((item) =>
        item.designation.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 50)
    : items.slice(0, 50);

  return (
    <div ref={containerRef} className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 flex flex-col">
      <div className="p-2 border-b border-slate-100">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher..."
          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700"
        />
      </div>
      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-slate-400">Aucun résultat</div>
        ) : (
          filtered.map((item) => (
            <button
              key={item.rowIndex}
              onClick={() => onSelect(item)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex justify-between items-center border-b border-slate-50"
            >
              <span className="truncate flex-1 text-slate-700">{item.designation}</span>
              <span className="text-xs text-slate-400 ml-2 flex-shrink-0 font-mono">{item.code}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
