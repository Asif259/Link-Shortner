'use client';

import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { mockDashboardData, type ActivityItem } from '@/lib/mock-dashboard-data';

export function RecentActivity() {
  const activities: ActivityItem[] = mockDashboardData.recentActivity;

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/60 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#1A2621]">Recent Activity</h3>
            <p className="text-xs text-[#61726A] mt-0.5">Real-time incoming click stream</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF5F1] text-[#236B56] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#236B56] animate-pulse" />
            Live
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {activities.map((item) => {
            const isMobile = item.device.toLowerCase().includes('mobile');
            return (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F4F5F3] flex items-center justify-center text-[#236B56] shrink-0 mt-0.5">
                    {isMobile ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Monitor className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[#1A2621]">
                        {item.country}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                        {item.countryCode}
                      </span>
                    </div>
                    <p className="text-xs text-[#61726A] mt-0.5">
                      {item.device} · {item.browser}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-[#8E9F97] whitespace-nowrap shrink-0 mt-0.5">
                  {item.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 text-center">
        <button
          type="button"
          className="text-xs font-semibold text-[#236B56] hover:text-[#1C5745] transition-colors"
        >
          View live stream &rarr;
        </button>
      </div>
    </div>
  );
}
