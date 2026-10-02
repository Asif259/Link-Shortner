'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { mockDashboardData, type ChartDataPoint } from '@/lib/mock-dashboard-data';

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
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#236B56]" />
            <span className="text-stone-600">Clicks:</span>
            <span className="font-bold text-[#1A2621]">{payload[0]?.value.toLocaleString()}</span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#88D4BE]" />
              <span className="text-stone-600">Unique:</span>
              <span className="font-bold text-[#1A2621]">{payload[1]?.value.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export function ClicksChart() {
  const [timeframe, setTimeframe] = useState<'7 Days' | '30 Days' | '3 Months'>('30 Days');
  const data: ChartDataPoint[] = mockDashboardData.chartData[timeframe] || [];

  const timeframes: Array<'7 Days' | '30 Days' | '3 Months'> = ['7 Days', '30 Days', '3 Months'];

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/60 shadow-2xs flex flex-col">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-[#1A2621]">Clicks Over Time</h3>
          <p className="text-xs text-[#61726A] mt-0.5">
            Daily click volume and unique visitors breakdown
          </p>
        </div>

        {/* Timeframe Controls */}
        <div className="flex items-center bg-[#F4F5F3] p-1 rounded-full border border-stone-200/60 self-start sm:self-auto">
          {timeframes.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-all',
                timeframe === tf
                  ? 'bg-[#236B56] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-[#1A2621]'
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#236B56" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#236B56" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="uniqueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#88D4BE" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#88D4BE" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2EF" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#8E9F97', fontSize: 11 }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#8E9F97', fontSize: 11 }}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Visual dashed benchmark line similar to the yellow/orange guideline in screenshot */}
            <ReferenceLine
              y={550}
              stroke="#EAB308"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#236B56"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#clickGradient)"
            />
            <Area
              type="monotone"
              dataKey="unique"
              stroke="#88D4BE"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#uniqueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Target status */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-[#61726A]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#236B56]" />
            <span className="font-medium text-[#1A2621]">Total Clicks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#88D4BE]" />
            <span className="font-medium text-[#1A2621]">Unique Visitors</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Goal Benchmark: 550 / day</span>
        </div>
      </div>
    </div>
  );
}
