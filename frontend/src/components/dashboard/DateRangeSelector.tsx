'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRangeFilter, DateRangePreset } from '@/lib/api/analytics';

export interface DateRangeSelectorProps {
  value: DateRangeFilter;
  onChange: (filter: DateRangeFilter) => void;
  className?: string;
  align?: 'left' | 'right';
}

interface PresetOption {
  key: DateRangePreset;
  label: string;
}

const PRESETS: PresetOption[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom range' },
];

export function DateRangeSelector({
  value,
  onChange,
  className,
  align = 'right',
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomInputs, setShowCustomInputs] = useState(value.range === 'custom');

  // Local state for custom range inputs
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultStartStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [customStart, setCustomStart] = useState(value.startDate || defaultStartStr);
  const [customEnd, setCustomEnd] = useState(value.endDate || todayStr);
  const [customError, setCustomError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click & escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCustomInputs(value.range === 'custom');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowCustomInputs(value.range === 'custom');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, value.range]);

  const handleSelectPreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustomInputs(true);
      return;
    }

    setShowCustomInputs(false);
    setIsOpen(false);
    onChange({
      range: preset,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    if (!customStart || !customEnd) {
      setCustomError('Please choose both start and end dates');
      return;
    }

    if (customStart > customEnd) {
      setCustomError('Start date must be before or equal to end date');
      return;
    }

    setIsOpen(false);
    onChange({
      range: 'custom',
      startDate: customStart,
      endDate: customEnd,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  // Compute trigger button label
  const displayLabel = React.useMemo(() => {
    if (value.range === 'custom' && value.startDate && value.endDate) {
      return `${value.startDate} – ${value.endDate}`;
    }
    const found = PRESETS.find((p) => p.key === value.range);
    return found ? found.label : 'Last 30 days';
  }, [value]);

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 h-10 px-4 rounded-full bg-white border text-xs font-semibold text-[#1A2621] shadow-2xs transition-all cursor-pointer',
          isOpen
            ? 'border-[#236B56] ring-2 ring-[#236B56]/15'
            : 'border-stone-200/70 hover:bg-stone-50 hover:border-stone-300'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select analytics date range"
      >
        <Calendar className="w-3.5 h-3.5 text-[#236B56]" />
        <span>{displayLabel}</span>
        <ChevronDown
          className={cn('w-3.5 h-3.5 text-stone-400 transition-transform duration-150', isOpen && 'rotate-180')}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute mt-2 rounded-2xl bg-white border border-stone-200/90 shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 select-none',
            showCustomInputs ? 'w-72 p-3' : 'w-48 py-1.5',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          role="menu"
        >
          {!showCustomInputs ? (
            <div className="space-y-0.5">
              <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Select Timeframe
              </div>

              {PRESETS.map((p) => {
                const isSelected = value.range === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleSelectPreset(p.key)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer text-left',
                      isSelected
                        ? 'bg-[#EBF5F1] text-[#236B56] font-semibold'
                        : 'text-stone-700 hover:bg-[#F4F5F3] hover:text-[#1A2621]'
                    )}
                    role="menuitem"
                  >
                    <span>{p.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#236B56]" />}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Custom Date Range Picker */
            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="text-xs font-bold text-[#1A2621]">Custom Date Range</span>
                <button
                  type="button"
                  onClick={() => setShowCustomInputs(false)}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                  aria-label="Back to presets"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {customError && (
                <div className="p-2 rounded-lg bg-rose-50 text-[11px] text-rose-700 font-medium">
                  {customError}
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <label htmlFor="custom-start-date" className="block text-[11px] font-semibold text-stone-500 mb-1">
                    Start Date
                  </label>
                  <input
                    id="custom-start-date"
                    type="date"
                    value={customStart}
                    max={customEnd || todayStr}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-200 bg-[#F4F5F3] text-[#1A2621] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#236B56]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="custom-end-date" className="block text-[11px] font-semibold text-stone-500 mb-1">
                    End Date
                  </label>
                  <input
                    id="custom-end-date"
                    type="date"
                    value={customEnd}
                    min={customStart}
                    max={todayStr}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-200 bg-[#F4F5F3] text-[#1A2621] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#236B56]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInputs(false);
                    setCustomError(null);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#236B56] hover:bg-[#1C5745] rounded-xl shadow-xs transition-colors flex items-center gap-1"
                >
                  <span>Apply</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
