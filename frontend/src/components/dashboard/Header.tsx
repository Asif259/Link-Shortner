'use client';

import React, { useState } from 'react';
import { Search, Bell, Plus, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth.store';
import { DateRangeSelector } from './DateRangeSelector';
import { downloadAnalyticsCsv } from '@/lib/api/analytics';
import type { DateRangeFilter } from '@/lib/api/analytics';
import { useToast } from '@/components/ui/toast';

interface HeaderProps {
  onOpenCreateDialog: () => void;
  dateFilter?: DateRangeFilter;
  onDateFilterChange?: (filter: DateRangeFilter) => void;
  selectedRange?: string;
  onRangeChange?: (range: string) => void;
}

export function Header({
  onOpenCreateDialog,
  dateFilter,
  onDateFilterChange,
  selectedRange = 'Last 30 days',
  onRangeChange,
}: HeaderProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.slice(0, 2).toUpperCase() ?? '??');
  const displayName = user?.name?.split(' ')[0] ?? (user?.email?.split('@')[0] ?? 'User');

  const [searchQuery, setSearchQuery] = useState('');

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await downloadAnalyticsCsv(dateFilter);
      toast('Analytics CSV exported successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to export CSV', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-6 md:px-8 border-b border-stone-200/50 bg-[#F4F5F3]">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search links..."
          className="w-full h-10 pl-10 pr-4 rounded-full bg-white border border-stone-200/70 text-sm text-[#1A2621] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#236B56] shadow-2xs transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
        {/* Date Range Selector Pill */}
        {dateFilter && onDateFilterChange ? (
          <DateRangeSelector value={dateFilter} onChange={onDateFilterChange} />
        ) : (
          <DateRangeSelector
            value={{ range: '30d' }}
            onChange={(filter) => {
              onRangeChange?.(filter.range);
              onDateFilterChange?.(filter);
            }}
          />
        )}

        {/* Export CSV Button */}
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isExporting}
          className="flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-white border border-stone-200/70 text-xs font-semibold text-[#1A2621] hover:text-[#236B56] hover:bg-stone-50 shadow-2xs transition-colors disabled:opacity-50"
          title="Export analytics as CSV"
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#236B56]" />
          ) : (
            <Download className="w-3.5 h-3.5 text-[#236B56]" />
          )}
          <span>Export CSV</span>
        </button>

        {/* Create Short Link CTA */}
        <Button
          onClick={onOpenCreateDialog}
          variant="primary"
          size="md"
          className="gap-1.5 font-semibold text-xs shadow-sm bg-[#236B56] hover:bg-[#1C5745]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Short Link</span>
        </Button>

        {/* Notifications Icon Pill */}
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-white border border-stone-200/70 flex items-center justify-center text-stone-600 hover:text-[#236B56] hover:bg-stone-50 shadow-2xs transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#236B56]" />
        </button>

        {/* User Pill / Avatar */}
        <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white border border-stone-200/70 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-[#236B56] text-white flex items-center justify-center text-xs font-bold tracking-wider">
            {initials}
          </div>
          <span className="text-xs font-semibold text-[#1A2621] max-w-[120px] truncate" title={user?.email || displayName}>
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
}
