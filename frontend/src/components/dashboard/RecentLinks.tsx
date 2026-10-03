'use client';

import React, { useState } from 'react';
import { Copy, Check, BarChart2, ExternalLink } from 'lucide-react';
import type { RecentLinkItem } from '@/lib/hooks/useDashboardData';
import { useToast } from '@/components/ui/toast';

interface RecentLinksProps {
  links: RecentLinkItem[];
  totalLinks: number;
  onSelectLinkForAnalytics?: (linkId: string) => void;
}

export function RecentLinks({ links, totalLinks, onSelectLinkForAnalytics }: RecentLinksProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (link: RecentLinkItem) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(link.fullShortUrl);
      setCopiedId(link.id);
      toast(`Copied ${link.fullShortUrl} to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/60 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#1A2621]">Recent Links</h3>
          <p className="text-xs text-[#61726A] mt-0.5">
            Recently shortened destinations and live metrics
          </p>
        </div>
        <span className="text-xs text-[#8E9F97]">
          Showing {links.length} of {totalLinks} total links
        </span>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-10 text-sm text-stone-400">
          No links yet. Create your first short link above!
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200/70 text-[#8E9F97] font-semibold">
                <th className="py-3 px-3">Short Link</th>
                <th className="py-3 px-3">Destination</th>
                <th className="py-3 px-3 text-right">Clicks</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-[#F4F5F3]/50 transition-colors group">
                  <td className="py-3.5 px-3 font-semibold text-[#1A2621]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#236B56] hover:underline cursor-pointer">
                        {link.shortUrl}
                      </span>
                      <span className="text-[10px] text-[#8E9F97] font-normal hidden md:inline">
                        ({link.createdAt})
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-stone-600 max-w-[200px] truncate">
                    <a
                      href={link.destination}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#1A2621] hover:underline inline-flex items-center gap-1"
                    >
                      <span className="truncate">{link.destination}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-[#1A2621]">
                    {link.clicks.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        link.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          link.status === 'Active' ? 'bg-emerald-600' : 'bg-amber-600'
                        }`}
                      />
                      {link.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(link)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors"
                        title="Copy short link"
                        aria-label={`Copy ${link.shortUrl}`}
                      >
                        {copiedId === link.id ? (
                          <Check className="w-3.5 h-3.5 text-[#236B56]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectLinkForAnalytics?.(link.id)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors"
                        title="View analytics"
                        aria-label={`Analytics for ${link.shortUrl}`}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
