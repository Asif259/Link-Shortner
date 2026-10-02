'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  BarChart2,
  Copy,
  Edit,
  PowerOff,
  Trash2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Link as LinkItem } from '@/lib/api/links';

interface LinkActionsProps {
  link: LinkItem;
  onViewAnalytics: (link: LinkItem) => void;
  onCopy: (link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
  onDisable: (link: LinkItem) => void;
  onDelete: (link: LinkItem) => void;
}

export function LinkActions({
  link,
  onViewAnalytics,
  onCopy,
  onEdit,
  onDisable,
  onDelete,
}: LinkActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const isDisabled = link.status === 'disabled';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-stone-500 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors cursor-pointer"
        aria-label="Open link options"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-48 rounded-2xl bg-white border border-stone-200 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 text-xs font-medium"
          role="menu"
        >
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onViewAnalytics(link);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors text-left"
            role="menuitem"
          >
            <BarChart2 className="w-4 h-4 text-[#236B56]" />
            <span>View Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onCopy(link);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors text-left"
            role="menuitem"
          >
            <Copy className="w-4 h-4 text-stone-400" />
            <span>Copy Link</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onEdit(link);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors text-left"
            role="menuitem"
          >
            <Edit className="w-4 h-4 text-stone-400" />
            <span>Edit Link</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDisable(link);
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3.5 py-2 transition-colors text-left',
              isDisabled
                ? 'text-emerald-700 hover:bg-emerald-50'
                : 'text-amber-700 hover:bg-amber-50'
            )}
            role="menuitem"
          >
            <PowerOff className="w-4 h-4" />
            <span>{isDisabled ? 'Enable Link' : 'Disable Link'}</span>
          </button>

          <div className="my-1 border-t border-stone-100" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDelete(link);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left"
            role="menuitem"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Link</span>
          </button>
        </div>
      )}
    </div>
  );
}
