'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Smartphone, Monitor, Tablet } from 'lucide-react';
import type { DeviceItem } from '@/lib/hooks/useDashboardData';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DeviceItem }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-md text-xs">
        <p className="font-semibold text-[#1A2621]">{item.name}</p>
        <p className="text-stone-600 mt-0.5">
          {item.clicks.toLocaleString()} clicks ({item.percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

interface DeviceChartProps {
  devices: DeviceItem[];
  totalClicks: number;
}

export function DeviceChart({ devices, totalClicks }: DeviceChartProps) {
  const iconMap: Record<string, React.ElementType> = {
    Mobile: Smartphone,
    Desktop: Monitor,
    Tablet: Tablet,
  };

  const topDevice = devices[0];

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/60 shadow-2xs flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold text-[#1A2621]">Devices</h3>
        <p className="text-xs text-[#61726A] mt-0.5">Distribution by client platform</p>
      </div>

      <div className="my-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Donut Chart */}
        <div className="w-40 h-40 relative shrink-0">
          {devices.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
              No data
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={devices}
                    dataKey="percentage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {devices.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {topDevice && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-[#1A2621]">{topDevice.percentage}%</span>
                  <span className="text-[10px] text-[#8E9F97] uppercase tracking-wider font-semibold">
                    {topDevice.name}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5 w-full">
          {devices.map((dev) => {
            const Icon = iconMap[dev.name] || Smartphone;
            return (
              <div
                key={dev.name}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F4F5F3] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: dev.color }}
                  />
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A2621]">
                    <Icon className="w-3.5 h-3.5 text-[#61726A]" />
                    <span>{dev.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#1A2621]">{dev.percentage}%</span>
                  <span className="text-[11px] text-[#8E9F97] block">
                    {dev.clicks.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#61726A]">
        <span>Total device samples</span>
        <span className="font-semibold text-[#1A2621]">{totalClicks.toLocaleString()} clicks</span>
      </div>
    </div>
  );
}
