'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Link as LinkItem } from '@/lib/api/links';
import { LinkActions } from './LinkActions';

interface LinksTableRowProps {
  link: LinkItem;
  baseUrl: string;
  onCopy: (link: LinkItem) => void;
  onViewAnalytics: (link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
  onDisable: (link: LinkItem) => void;
  onDelete: (link: LinkItem) => void;
}

export function LinksTableRow({
  link,
  baseUrl,
  onCopy,
  onViewAnalytics,
  onEdit,
  onDisable,
  onDelete,
}: LinksTableRowProps) {
  const [copied, setCopied] = useState(false);

  const fullShortUrl = `${baseUrl}/${link.shortCode.replace(/^\//, '')}`;

  const handleCopyClick = () => {
    onCopy(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const status = link.status || 'active';

  // Format date cleanly
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(link.createdAt);
      if (isNaN(d.getTime())) return link.createdAt;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return link.createdAt;
    }
  }, [link.createdAt]);

  return (
    <tr className="hover:bg-[#F4F5F3]/60 transition-colors group">
      {/* Short Link + Quick Action Buttons */}
      <td className="py-3 px-4 font-semibold text-[#1A2621]">
        <div className="flex items-center gap-2">
          <span
            onClick={() => onViewAnalytics(link)}
            className="text-[#236B56] hover:text-[#1C5745] hover:underline cursor-pointer font-bold text-sm tracking-tight"
            title="View link analytics"
          >
            {fullShortUrl.replace(/^https?:\/\//, '')}
          </span>
          <div className="flex items-center gap-1">
            {/* Copy Button (Fitts's Law comfortable touch target) */}
            <button
              type="button"
              onClick={handleCopyClick}
              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-stone-400 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors cursor-pointer"
              title="Copy short link"
              aria-label={`Copy short URL for ${link.shortCode}`}
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#236B56]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Quick Analytics Button */}
            <button
              type="button"
              onClick={() => onViewAnalytics(link)}
              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-stone-400 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors cursor-pointer"
              title="View analytics for this link"
              aria-label={`View analytics for ${link.shortCode}`}
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </td>

      {/* Destination URL */}
      <td className="py-3 px-4 text-stone-600 max-w-[260px]">
        <div className="flex items-center gap-1.5 truncate" title={link.originalUrl}>
          <a
            href={link.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate hover:text-[#1A2621] hover:underline inline-flex items-center gap-1 text-xs"
          >
            <span className="truncate">{link.originalUrl}</span>
            <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
          </a>
        </div>
      </td>

      {/* Clicks Metric */}
      <td className="py-3 px-4 text-right font-bold text-[#1A2621]">
        <span className="inline-block px-2 py-0.5 rounded-md bg-[#F4F5F3] text-xs">
          {(link.clickCount ?? 0).toLocaleString()}
        </span>
      </td>

      {/* Created Date */}
      <td className="py-3 px-4 text-stone-500 text-xs whitespace-nowrap">
        {formattedDate}
      </td>

      {/* Status Badge */}
      <td className="py-3 px-4 text-center">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize',
            status === 'active' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
            status === 'disabled' && 'bg-amber-50 text-amber-700 border border-amber-200/50',
            status === 'expired' && 'bg-rose-50 text-rose-700 border border-rose-200/50'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              status === 'active' && 'bg-emerald-600',
              status === 'disabled' && 'bg-amber-600',
              status === 'expired' && 'bg-rose-600'
            )}
          />
          {status}
        </span>
      </td>

      {/* Actions Dropdown */}
      <td className="py-3 px-4 text-right">
        <LinkActions
          link={link}
          onViewAnalytics={onViewAnalytics}
          onCopy={onCopy}
          onEdit={onEdit}
          onDisable={onDisable}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
