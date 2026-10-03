'use client';

import React, { useState } from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOption = 'newest' | 'oldest' | 'most_clicks' | 'least_clicks';

interface LinkFiltersProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function LinkFilters({
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
}: LinkFiltersProps) {
  const [sortOpen, setSortOpen] = useState(false);

  const statusChips = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Disabled', value: 'disabled' },
  ];

  const sortOptions: Array<{ label: string; value: SortOption }> = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Most Clicks', value: 'most_clicks' },
    { label: 'Least Clicks', value: 'least_clicks' },
  ];

  const currentSortLabel =
    sortOptions.find((o) => o.value === sortBy)?.label || 'Sort';

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Principle 3 & 10: Toggle Chips for Instant 1-Click Status Filtering */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-stone-200/80 rounded-full shadow-2xs">
        {statusChips.map((chip) => {
          const isSelected = statusFilter === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onStatusChange(chip.value)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                isSelected
                  ? 'bg-[#236B56] text-white shadow-xs'
                  : 'text-stone-600 hover:text-[#1A2621] hover:bg-stone-100'
              )}
              aria-pressed={isSelected}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setSortOpen(!sortOpen)}
          className="flex items-center gap-2 h-10 px-4 rounded-full bg-white border border-stone-200/80 text-xs font-semibold text-[#1A2621] hover:bg-stone-50 shadow-2xs transition-colors"
          aria-expanded={sortOpen}
          aria-haspopup="true"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-[#236B56]" />
          <span>{currentSortLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
        </button>

        {sortOpen && (
          <div
            className="absolute right-0 mt-2 w-44 rounded-2xl bg-white border border-stone-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95"
            role="menu"
          >
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSortChange(opt.value);
                  setSortOpen(false);
                }}
                className={cn(
                  'w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-[#EBF5F1] hover:text-[#236B56]',
                  sortBy === opt.value
                    ? 'text-[#236B56] font-semibold bg-[#EBF5F1]/60'
                    : 'text-stone-700'
                )}
                role="menuitem"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
