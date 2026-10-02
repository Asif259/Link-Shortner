'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface LinkSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function LinkSearch({ value, onChange, placeholder = 'Search by short code or destination...' }: LinkSearchProps) {
  return (
    <div className="relative flex-1 min-w-[240px] max-w-md">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-9 rounded-full bg-white border border-stone-200/80 text-xs font-medium text-[#1A2621] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#236B56] shadow-2xs transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 rounded-full"
          aria-label="Clear search"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
