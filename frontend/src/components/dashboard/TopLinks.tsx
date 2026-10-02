'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { mockDashboardData, type TopLink } from '@/lib/mock-dashboard-data';
import { useToast } from '@/components/ui/toast';

export function TopLinks() {
  const topLinks: TopLink[] = mockDashboardData.topLinks;
  const { toast } = useToast();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const maxClicks = topLinks[0]?.clicks || 1;

  const handleCopy = (link: TopLink) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`https://link.ly${link.shortCode}`);
      setCopiedId(link.id);
      toast(`Copied https://link.ly${link.shortCode} to clipboard!`);
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
            Top 5
          </span>
        </div>

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
                    <span className="font-bold text-[#1A2621] group-hover:text-[#236B56] transition-colors">
                      {link.shortCode}
                    </span>
                    <span className="text-[#8E9F97] hidden sm:inline truncate max-w-[140px]">
                      &rarr; {link.destination}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#1A2621]">
                      {link.clicks.toLocaleString()} <span className="font-normal text-[#8E9F97]">clicks</span>
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
                  </div>
                </div>

                {/* Progress bar */}
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
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-[#61726A]">
        <span>Aggregated top 5 volume</span>
        <span className="font-semibold text-[#1A2621]">13,969 clicks (56.1%)</span>
      </div>
    </div>
  );
}
