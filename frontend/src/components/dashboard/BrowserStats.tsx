'use client';

import React from 'react';
import { Compass } from 'lucide-react';
import type { ShareItem } from '@/lib/hooks/useDashboardData';

interface BrowserStatsProps {
  browsers: ShareItem[];
}

export function BrowserStats({ browsers }: BrowserStatsProps) {
  // Compute top two browsers for the footer summary
  const top2 = browsers.slice(0, 2);
  const top2Pct = top2.reduce((s, b) => s + b.percentage, 0);
  const top2Label = top2.map((b) => b.name).join(' / ');

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/60 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#1A2621]">Browsers</h3>
            <p className="text-xs text-[#61726A] mt-0.5">Traffic split by web browser</p>
          </div>
          <div className="w-7 h-7 rounded-xl bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
        </div>

        {browsers.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-6">
            Browser data will appear once clicks are recorded.
          </p>
        ) : (
          <div className="space-y-3">
            {browsers.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1A2621]">{item.name}</span>
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
        <span>Primary Engines</span>
        <span className="font-semibold text-[#1A2621]">
          {top2Label ? `${top2Label} (${top2Pct}%)` : '—'}
        </span>
      </div>
    </div>
  );
}
