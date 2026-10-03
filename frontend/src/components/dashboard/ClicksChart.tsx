'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartPoint } from '@/lib/hooks/useDashboardData';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-stone-200 shadow-md text-xs">
        <p className="font-semibold text-[#1A2621] mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#236B56]" />
          <span className="text-stone-600">Clicks:</span>
          <span className="font-bold text-[#1A2621]">{payload[0]?.value.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
}

interface ClicksChartProps {
  allData: ChartPoint[];
  title?: string;
  subtitle?: string;
  note?: string;
  badgeLabel?: string;
}

export function ClicksChart({
  allData,
  title = 'Clicks Over Time',
  subtitle = 'Daily click volume across all your short links',
  note = 'Aggregated across all links',
  badgeLabel,
}: ClicksChartProps) {
  const data = allData;
  const countLabel = badgeLabel || (data.length > 0 ? `${data.length} ${data.length === 1 ? 'day' : 'days'}` : undefined);

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/60 shadow-2xs flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-[#1A2621]">{title}</h3>
          <p className="text-xs text-[#61726A] mt-0.5">{subtitle}</p>
        </div>

        {countLabel && (
          <div className="flex items-center px-3 py-1 rounded-full bg-[#EBF5F1] text-[#236B56] border border-[#236B56]/20 self-start sm:self-auto text-xs font-semibold shadow-2xs">
            {countLabel}
          </div>
        )}
      </div>

      <div className="w-full h-64 sm:h-72">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-stone-400">
            No click data yet — share your links to start tracking.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#236B56" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#236B56" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2EF" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#8E9F97', fontSize: 11 }}
                dy={8}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#8E9F97', fontSize: 11 }}
                dx={-4}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="#236B56"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#clickGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-4 text-xs text-[#61726A]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#236B56]" />
          <span className="font-medium text-[#1A2621]">Total Clicks</span>
        </div>
        <span className="text-stone-400">{note}</span>
      </div>
    </div>
  );
}
