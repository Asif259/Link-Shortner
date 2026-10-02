'use client';

import React, { useState } from 'react';
import { Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LinkStatus } from '@/lib/api/links';

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const statusOptions: Array<{ label: string; value: string }> = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Disabled', value: 'disabled' },
    { label: 'Expired', value: 'expired' },
  ];

  const sortOptions: Array<{ label: string; value: SortOption }> = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Most Clicks', value: 'most_clicks' },
    { label: 'Least Clicks', value: 'least_clicks' },
  ];

  const currentStatusLabel =
    statusOptions.find((o) => o.value === statusFilter)?.label || 'Filter';
  const currentSortLabel =
    sortOptions.find((o) => o.value === sortBy)?.label || 'Sort';

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Status Filter Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setFilterOpen(!filterOpen);
            setSortOpen(false);
          }}
          className={cn(
            'flex items-center gap-2 h-10 px-4 rounded-full bg-white border border-stone-200/80 text-xs font-semibold shadow-2xs transition-colors',
            statusFilter !== 'all'
              ? 'text-[#236B56] border-[#236B56]/40 bg-[#EBF5F1]/30'
              : 'text-[#1A2621] hover:bg-stone-50'
          )}
          aria-expanded={filterOpen}
          aria-haspopup="true"
        >
          <Filter className="w-3.5 h-3.5 text-[#236B56]" />
          <span>{currentStatusLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
        </button>

        {filterOpen && (
          <div
            className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-40 rounded-2xl bg-white border border-stone-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95"
            role="menu"
          >
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onStatusChange(opt.value);
                  setFilterOpen(false);
                }}
                className={cn(
                  'w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-[#EBF5F1] hover:text-[#236B56]',
                  statusFilter === opt.value
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

      {/* Sort Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setSortOpen(!sortOpen);
            setFilterOpen(false);
          }}
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
