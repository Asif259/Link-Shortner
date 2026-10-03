'use client';

import { useState, useEffect } from 'react';
import { getLinks } from '@/lib/api/links';
import type { Link } from '@/lib/api/links';
import {
  getLinkTimeline,
  getLinkDevices,
  getLinkBrowsers,
  getLinkCountries,
} from '@/lib/api/analytics';
import type { TimelineResponseItem, GroupedResponseItem } from '@/lib/api/analytics';

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

/** Merge multiple grouped arrays summing clicks by name. */
export function mergeGrouped(arrays: GroupedResponseItem[][]): GroupedResponseItem[] {
  const totals = new Map<string, number>();
  for (const arr of arrays) {
    for (const { name, clicks } of arr) {
      totals.set(name, (totals.get(name) ?? 0) + clicks);
    }
  }
  return Array.from(totals.entries())
    .map(([name, clicks]) => ({ name, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
}

/** Merge multiple timeline arrays summing clicks by ISO date. */
export function mergeTimeline(arrays: TimelineResponseItem[][]): ChartPoint[] {
  const totals = new Map<string, number>();
  for (const arr of arrays) {
    for (const { date, clicks } of arr) {
      totals.set(date, (totals.get(date) ?? 0) + clicks);
    }
  }
  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, clicks]) => ({ date: formatChartDate(date), clicks }));
}

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

const BASE_URL = process.env.NEXT_PUBLIC_SHORT_URL || 'http://localhost:3000';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch all user links (sorted newest first, high limit to get all)
        const links = await getLinks({ sort: 'newest', limit: 200 });
        if (cancelled) return;

        // 2. Fan out analytics for up to 10 most-clicked links
        //    (avoids N+1 explosion for users with hundreds of links)
        const sortedByClicks = [...links].sort(
          (a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0),
        );
        const topN = sortedByClicks.slice(0, 10);

        const [timelineResults, deviceResults, browserResults, countryResults] = await Promise.all([
          Promise.allSettled(topN.map((l) => getLinkTimeline(l.id))),
          Promise.allSettled(topN.map((l) => getLinkDevices(l.id))),
          Promise.allSettled(topN.map((l) => getLinkBrowsers(l.id))),
          Promise.allSettled(topN.map((l) => getLinkCountries(l.id))),
        ]);

        if (cancelled) return;

        // Extract fulfilled values only — partial failure is acceptable
        const timelines = timelineResults
          .filter((r): r is PromiseFulfilledResult<TimelineResponseItem[]> => r.status === 'fulfilled')
          .map((r) => r.value);
        const devicesArr = deviceResults
          .filter((r): r is PromiseFulfilledResult<GroupedResponseItem[]> => r.status === 'fulfilled')
          .map((r) => r.value);
        const browsersArr = browserResults
          .filter((r): r is PromiseFulfilledResult<GroupedResponseItem[]> => r.status === 'fulfilled')
          .map((r) => r.value);
        const countriesArr = countryResults
          .filter((r): r is PromiseFulfilledResult<GroupedResponseItem[]> => r.status === 'fulfilled')
          .map((r) => r.value);

        // 3. Aggregate
        const totalClicks = links.reduce((s, l) => s + (l.clickCount ?? 0), 0);
        const activeLinks = links.filter((l) => (l.status ?? 'active') === 'active').length;
        const mergedTimeline = mergeTimeline(timelines);

        // Clicks today: last entry in timeline that matches today's date
        const todayIso = new Date().toISOString().slice(0, 10);
        const clicksToday = timelines.flat().filter((t) => t.date === todayIso).reduce((s, t) => s + t.clicks, 0);

        // Sparklines: last 7 daily totals
        const sparkline7 = mergedTimeline.slice(-7).map((p) => p.clicks);
        const spark = sparkline7.length > 0 ? sparkline7 : [0];

        // 4. Build stat cards
        const stats: DashboardStat[] = [
          {
            title: 'Total Clicks',
            value: totalClicks.toLocaleString(),
            change: 'All time',
            period: 'across all links',
            isPositive: true,
            sparkline: spark,
          },
          {
            title: 'Active Links',
            value: activeLinks.toLocaleString(),
            change: `${links.length} total`,
            period: 'links created',
            isPositive: true,
            sparkline: Array.from({ length: 7 }, (_, i) => Math.max(1, activeLinks - (6 - i))),
          },
          {
            title: 'Clicks Today',
            value: clicksToday.toLocaleString(),
            change: clicksToday > 0 ? 'Live' : 'None yet',
            period: 'today so far',
            isPositive: clicksToday > 0,
            sparkline: spark,
          },
          {
            title: 'Links This Month',
            value: links
              .filter((l) => {
                const d = new Date(l.createdAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              })
              .length.toLocaleString(),
            change: 'This month',
            period: 'new short links',
            isPositive: true,
            sparkline: spark,
          },
        ];

        // 5. Top links (by click count)
        const topLinks: TopLinkItem[] = sortedByClicks.slice(0, 5).map((l, idx) => ({
          id: l.id,
          shortCode: `/${l.shortCode}`,
          destination: l.originalUrl.replace(/^https?:\/\//, '').split('/')[0] ?? l.originalUrl,
          clicks: l.clickCount ?? 0,
          rank: idx + 1,
        }));

        // 6. Recent links (5 most recent)
        const recentLinks: RecentLinkItem[] = links.slice(0, 5).map((l) => ({
          id: l.id,
          shortUrl: `/${l.shortCode}`,
          fullShortUrl: `${BASE_URL}/${l.shortCode}`,
          destination: l.originalUrl,
          clicks: l.clickCount ?? 0,
          status: (l.status === 'disabled' ? 'Paused' : 'Active') as 'Active' | 'Paused',
          createdAt: relativeDate(l.createdAt),
        }));

        setData({
          stats,
          timeline: mergedTimeline,
          devices: toDeviceItems(mergeGrouped(devicesArr)),
          browsers: toShareItems(mergeGrouped(browsersArr)),
          countries: toShareItems(mergeGrouped(countriesArr)),
          topLinks,
          recentLinks,
          totalLinks: links.length,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
