'use client';

import React from 'react';
import Link from 'next/link';
import { Copy, Check, BarChart2 } from 'lucide-react';
import type { TopLinkItem } from '@/lib/hooks/useDashboardData';
import { useToast } from '@/components/ui/toast';

const BASE_URL = process.env.NEXT_PUBLIC_SHORT_URL || 'http://localhost:3000';

interface TopLinksProps {
  topLinks: TopLinkItem[];
}

export function TopLinks({ topLinks }: TopLinksProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const maxClicks = topLinks[0]?.clicks || 1;

  const handleCopy = (link: TopLinkItem) => {
    if (typeof navigator !== 'undefined') {
      const url = `${BASE_URL}${link.shortCode}`;
      navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      toast(`Copied ${url} to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/60 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#1A2621]">Top Performing Links</h3>
            <p className="text-xs text-[#61726A] mt-0.5">Ranked by total click volume</p>
          </div>
          <span className="text-xs font-semibold text-[#236B56] bg-[#EBF5F1] px-2.5 py-1 rounded-full">
            Top {topLinks.length}
          </span>
        </div>

        {topLinks.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-6">
            Create and share links to see top performers here.
          </p>
        ) : (
          <div className="space-y-3.5">
            {topLinks.map((link) => {
              const widthPercent = Math.round((link.clicks / maxClicks) * 100);
              return (
                <div key={link.id} className="group">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#F4F5F3] text-stone-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {link.rank}
                      </span>
                      <Link
                        href={`/dashboard/links/${link.id}`}
                        className="font-bold text-[#1A2621] hover:text-[#236B56] hover:underline transition-colors"
                        title="View analytics for this link"
                      >
                        {link.shortCode}
                      </Link>
                      <span className="text-[#8E9F97] hidden sm:inline truncate max-w-[140px]">
                        &rarr; {link.destination}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1A2621] mr-1">
                        {link.clicks.toLocaleString()}{' '}
                        <span className="font-normal text-[#8E9F97]">clicks</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(link)}
                        className="p-1 rounded-md text-stone-400 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors"
                        title="Copy link"
                        aria-label={`Copy ${link.shortCode}`}
                      >
                        {copiedId === link.id ? (
                          <Check className="w-3.5 h-3.5 text-[#236B56]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <Link
                        href={`/dashboard/links/${link.id}`}
                        className="p-1 rounded-md text-stone-400 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors flex items-center justify-center"
                        title="View link analytics"
                        aria-label={`Analytics for ${link.shortCode}`}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#236B56] transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {topLinks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-[#61726A]">
          <span>Aggregated top {topLinks.length} volume</span>
          <span className="font-semibold text-[#1A2621]">
            {topLinks.reduce((s, l) => s + l.clicks, 0).toLocaleString()} clicks
          </span>
        </div>
      )}
    </div>
  );
}
