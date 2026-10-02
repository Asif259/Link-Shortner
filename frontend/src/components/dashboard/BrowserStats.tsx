'use client';

import React from 'react';
import { Compass } from 'lucide-react';
import { mockDashboardData, type ShareItem } from '@/lib/mock-dashboard-data';

export function BrowserStats() {
  const browsers: ShareItem[] = mockDashboardData.browsers;

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
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#61726A]">
        <span>Primary Engine</span>
        <span className="font-semibold text-[#1A2621]">Chromium / WebKit (88%)</span>
      </div>
    </div>
  );
}
