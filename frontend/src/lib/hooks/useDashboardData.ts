'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAnalyticsOverview } from '@/lib/api/analytics';
import type { GroupedResponseItem, DateRangeFilter } from '@/lib/api/analytics';

// ─── Shared shape types that components consume ───────────────────────────────

export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  period: string;
  isPositive: boolean;
  sparkline: number[];
}

export interface ChartPoint {
  date: string;
  clicks: number;
}

export interface DeviceItem {
  name: string;
  percentage: number;
  clicks: number;
  color: string;
}

export interface ShareItem {
  name: string;
  percentage: number;
  count: number;
  color?: string;
}

export interface TopLinkItem {
  id: string;
  shortCode: string;
  destination: string;
  clicks: number;
  rank: number;
}

export interface RecentLinkItem {
  id: string;
  shortUrl: string;
  fullShortUrl: string;
  destination: string;
  clicks: number;
  status: 'Active' | 'Paused';
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStat[];
  timeline: ChartPoint[];
  devices: DeviceItem[];
  browsers: ShareItem[];
  countries: ShareItem[];
  topLinks: TopLinkItem[];
  recentLinks: RecentLinkItem[];
  totalLinks: number;
}

// ─── Palette for grouped charts (device / browser / country) ─────────────────
export const PALETTE = ['#236B56', '#2F856D', '#3BA385', '#55BFA0', '#7DD4BE', '#A8E8D6', '#C8F0E6'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format ISO date (YYYY-MM-DD) to short label (e.g. "Sep 3"). */
export function formatChartDate(iso: string): string {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

/** Convert flat grouped result into ShareItems with % and palette colours. */
export function toShareItems(items: GroupedResponseItem[], top = 6): ShareItem[] {
  const limited = items.slice(0, top);
  const total = limited.reduce((s, i) => s + i.clicks, 0) || 1;
  return limited.map((item, idx) => ({
    name: item.name,
    percentage: Math.round((item.clicks / total) * 100),
    count: item.clicks,
    color: PALETTE[idx] ?? '#C8F0E6',
  }));
}

/** Convert to DeviceItem with colour. Includes `clicks` for chart tooltip. */
export function toDeviceItems(items: GroupedResponseItem[]): DeviceItem[] {
  const total = items.reduce((s, i) => s + i.clicks, 0) || 1;
  return items.slice(0, 3).map((item, idx) => ({
    name: item.name,
    percentage: Math.round((item.clicks / total) * 100),
    clicks: item.clicks,
    color: PALETTE[idx] ?? '#C8F0E6',
  }));
}

/** Format a short relative-time string from ISO or date string. */
function relativeDate(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week(s) ago`;
    return `${Math.floor(diffDays / 30)} month(s) ago`;
  } catch {
    return isoString;
  }
}

const BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_SHORT_URL ?? window.location.origin)
    : (process.env.NEXT_PUBLIC_SHORT_URL ?? 'http://localhost:3000');

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardData(dateFilter?: DateRangeFilter) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = dateFilter?.range ?? '30d';
  const startDate = dateFilter?.startDate;
  const endDate = dateFilter?.endDate;
  const timezone = dateFilter?.timezone;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Single request per date-range change replaces any historical N+1 requests
      const overview = await getAnalyticsOverview(dateFilter);

      // Timeline: format ISO dates to display labels for the chart
      const timeline: ChartPoint[] = overview.timeline.map((t) => ({
        date: formatChartDate(t.date),
        clicks: t.clicks,
      }));

      // Sparkline: last 7 points of the active timeline
      const sparkline7 = timeline.slice(-7).map((p) => p.clicks);
      const spark = sparkline7.length > 0 ? sparkline7 : [0];

      // Dynamic KPI descriptions based on active range
      let rangeLabel = 'Last 30 days';
      let rangePeriod = 'in selected period';
      if (range === '7d') {
        rangeLabel = 'Last 7 days';
      } else if (range === '90d') {
        rangeLabel = 'Last 90 days';
      } else if (range === 'all') {
        rangeLabel = 'All time';
        rangePeriod = 'across all links';
      } else if (range === 'custom') {
        rangeLabel = 'Custom range';
        rangePeriod = startDate && endDate ? `${startDate} to ${endDate}` : 'in selected period';
      }

      // KPI stat cards
      const stats: DashboardStat[] = [
        {
          title: 'Total Clicks',
          value: overview.totalClicks.toLocaleString(),
          change: rangeLabel,
          period: rangePeriod,
          isPositive: true,
          sparkline: spark,
        },
        {
          title: 'Active Links',
          value: overview.activeLinks.toLocaleString(),
          change: `${overview.totalLinks} total`,
          period: 'links created',
          isPositive: true,
          sparkline: Array.from({ length: 7 }, (_, i) =>
            Math.max(1, overview.activeLinks - (6 - i)),
          ),
        },
        {
          title: 'Clicks Today',
          value: overview.clicksToday.toLocaleString(),
          change: overview.clicksToday > 0 ? 'Live' : 'None yet',
          period: 'today so far',
          isPositive: overview.clicksToday > 0,
          sparkline: spark,
        },
        {
          title: 'Links This Month',
          value: overview.linksThisMonth.toLocaleString(),
          change: 'This month',
          period: 'new short links',
          isPositive: true,
          sparkline: spark,
        },
      ];

      // Top links ranked by click count (already filtered and sorted by PostgreSQL query)
      const topLinks: TopLinkItem[] = overview.topLinks.map((l, idx) => ({
        id: l.id,
        shortCode: `/${l.shortCode}`,
        destination: l.originalUrl.replace(/^https?:\/\//, '').split('/')[0] ?? l.originalUrl,
        clicks: l.clickCount,
        rank: idx + 1,
      }));

      // 5 most recent links
      const recentLinks: RecentLinkItem[] = overview.recentLinks.map((l) => ({
        id: l.id,
        shortUrl: `/${l.shortCode}`,
        fullShortUrl: `${BASE_URL}/${l.shortCode}`,
        destination: l.originalUrl,
        clicks: l.clickCount,
        status: (l.isActive ? 'Active' : 'Paused') as 'Active' | 'Paused',
        createdAt: relativeDate(l.createdAt),
      }));

      setData({
        stats,
        timeline,
        devices: toDeviceItems(overview.devices),
        browsers: toShareItems(overview.browsers),
        countries: toShareItems(overview.countries),
        topLinks,
        recentLinks,
        totalLinks: overview.totalLinks,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, range, startDate, endDate, timezone]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
}
