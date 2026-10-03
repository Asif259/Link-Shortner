'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MoreVertical,
  BarChart2,
  Copy,
  Edit,
  PowerOff,
  Power,
  Trash2,
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
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculateCoords = useCallback(() => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 192; // 12rem / w-48
    const menuHeight = menuRef.current ? menuRef.current.offsetHeight : 210;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight && rect.top >= menuHeight;

    const top = openUpward ? rect.top - menuHeight - 6 : rect.bottom + 6;
    const left = Math.min(
      window.innerWidth - menuWidth - 12,
      Math.max(12, rect.right - menuWidth)
    );

    return { top, left };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      const initial = calculateCoords();
      if (initial) setCoords(initial);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Refine position accurately once menu element is measured in DOM
    const next = calculateCoords();
    if (next) setCoords(next);

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (e: Event) => {
      if (e.target && menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, calculateCoords]);

  const isDisabled = link.status === 'disabled';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          'p-1.5 rounded-lg transition-colors cursor-pointer',
          isOpen
            ? 'text-[#236B56] bg-[#EBF5F1] ring-2 ring-[#236B56]/20'
            : 'text-stone-500 hover:text-[#236B56] hover:bg-[#EBF5F1]'
        )}
        aria-label="Open link options"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 9999,
            }}
            className="w-48 rounded-2xl bg-white border border-stone-200/90 shadow-2xl py-1.5 animate-in fade-in zoom-in-95 text-xs font-medium select-none"
            role="menu"
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onViewAnalytics(link);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors text-left cursor-pointer"
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
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors text-left cursor-pointer"
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
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors text-left cursor-pointer"
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
                'w-full flex items-center gap-2.5 px-3.5 py-2 transition-colors text-left cursor-pointer',
                isDisabled
                  ? 'text-emerald-700 hover:bg-emerald-50'
                  : 'text-amber-700 hover:bg-amber-50'
              )}
              role="menuitem"
            >
              {isDisabled ? (
                <>
                  <Power className="w-4 h-4 text-emerald-600" />
                  <span>Enable Link</span>
                </>
              ) : (
                <>
                  <PowerOff className="w-4 h-4 text-amber-600" />
                  <span>Disable Link</span>
                </>
              )}
            </button>

            <div className="my-1 border-t border-stone-100" />

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDelete(link);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              role="menuitem"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete Link</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
