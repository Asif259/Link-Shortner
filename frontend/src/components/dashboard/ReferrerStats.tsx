'use client';

import React from 'react';
import { Share2 } from 'lucide-react';
import type { ShareItem } from '@/lib/hooks/useDashboardData';

interface ReferrerStatsProps {
  referrers: ShareItem[];
}

export function ReferrerStats({ referrers }: ReferrerStatsProps) {
  const topSource = referrers[0];

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/60 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#1A2621]">Top Referrers</h3>
            <p className="text-xs text-[#61726A] mt-0.5">Traffic sources & referring websites</p>
          </div>
          <div className="w-7 h-7 rounded-xl bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
        </div>

        {referrers.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-6">
            No referrer data yet — direct visits and referrals will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {referrers.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1A2621] truncate max-w-[180px]" title={item.name}>
                    {item.name}
                  </span>
                  <span className="font-bold text-[#1A2621]">
                    {item.percentage}%{' '}
                    <span className="font-normal text-[#8E9F97]">
                      ({item.count.toLocaleString()})
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color || '#236B56',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#61726A]">
        <span>Top Source</span>
        <span className="font-semibold text-[#1A2621]">
          {topSource ? `${topSource.name} (${topSource.percentage}%)` : '—'}
        </span>
      </div>
    </div>
  );
}
