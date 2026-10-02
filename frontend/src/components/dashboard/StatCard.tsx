'use client';

import React from 'react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StatMetric } from '@/lib/mock-dashboard-data';

interface StatCardProps {
  stat: StatMetric;
  index: number;
}

export function StatCard({ stat }: StatCardProps) {
  // Generate mini SVG sparkline path
  const min = Math.min(...stat.sparkline);
  const max = Math.max(...stat.sparkline);
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const points = stat.sparkline
    .map((val, idx) => {
      const x = (idx / (stat.sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#61726A] uppercase tracking-wider">
          {stat.title}
        </span>
        <div className="w-6 h-6 rounded-full bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="my-3 flex items-baseline justify-between">
        <span className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A2621]">
          {stat.value}
        </span>

        {/* Mini SVG Sparkline */}
        <div className="hidden sm:block">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              fill="none"
              stroke="#236B56"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold',
            stat.isPositive
              ? 'bg-[#EBF5F1] text-[#236B56]'
              : 'bg-rose-50 text-rose-600'
          )}
        >
          <ArrowUpRight className="w-3 h-3" />
          {stat.change}
        </span>
        <span className="text-[#8E9F97]">{stat.period}</span>
      </div>
    </div>
  );
}
