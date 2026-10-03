'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Monitor, Tablet } from 'lucide-react';
import { getRecentClicks } from '@/lib/api/analytics';
import type { RecentClickItem } from '@/lib/api/analytics';

/** Convert ISO timestamp to a short relative-time label. */
function relativeTime(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return '—';
  }
}

function DeviceIcon({ device }: { device: string | null }) {
  const d = device?.toLowerCase() ?? '';
  if (d.includes('mobile')) return <Smartphone className="w-4 h-4" />;
  if (d.includes('tablet')) return <Tablet className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
}

export function RecentActivity() {
  const [items, setItems] = useState<RecentClickItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRecentClicks(20)
      .then((data) => { if (!cancelled) { setItems(data); setIsLoading(false); } })
      .catch(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/60 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#1A2621]">Recent Activity</h3>
            <p className="text-xs text-[#61726A] mt-0.5">Incoming click stream</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF5F1] text-[#236B56] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#236B56] animate-pulse" />
            Live
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {isLoading ? (
            // Skeleton rows
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-3 flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-stone-100 shrink-0" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="h-3 bg-stone-100 rounded w-2/3" />
                  <div className="h-2.5 bg-stone-100 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-stone-400">
              No clicks yet — share your links to see live activity here.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F4F5F3] flex items-center justify-center text-[#236B56] shrink-0 mt-0.5">
                    <DeviceIcon device={item.device} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-[#1A2621]">
                        {item.country ?? 'Unknown'}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 rounded bg-stone-100 text-stone-600">
                        {item.device ?? '?'}
                      </span>
                    </div>
                    <p className="text-xs text-[#61726A] mt-0.5">
                      {item.browser ?? 'Unknown browser'} · /{item.linkShortCode}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-[#8E9F97] whitespace-nowrap shrink-0 mt-0.5">
                  {relativeTime(item.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 text-center">
        <span className="text-xs text-[#8E9F97]">
          {items.length > 0 ? `Last ${items.length} clicks` : 'No activity yet'}
        </span>
      </div>
    </div>
  );
}
