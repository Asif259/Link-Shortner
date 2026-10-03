import { apiClient } from './client';

export interface AnalyticsSummaryResponse {
  totalClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
}

export interface TimelineResponseItem {
  date: string;
  clicks: number;
}

export interface GroupedResponseItem {
  name: string;
  clicks: number;
}

export type DateRangePreset = '7d' | '30d' | '90d' | 'all' | 'custom';

export interface DateRangeFilter {
  range: DateRangePreset;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export function buildAnalyticsQueryParams(filter?: DateRangeFilter): string {
  if (!filter) return '';
  const params = new URLSearchParams();
  if (filter.range) params.set('range', filter.range);
  if (filter.startDate) params.set('startDate', filter.startDate);
  if (filter.endDate) params.set('endDate', filter.endDate);
  const tz =
    filter.timezone ||
    (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC');
  if (tz) params.set('timezone', tz);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getLinkAnalytics(
  linkId: string,
  filter?: DateRangeFilter,
): Promise<AnalyticsSummaryResponse> {
  const qs = buildAnalyticsQueryParams(filter);
  return apiClient<AnalyticsSummaryResponse>(`/links/${linkId}/analytics${qs}`);
}

export async function getLinkTimeline(
  linkId: string,
  filter?: DateRangeFilter,
): Promise<TimelineResponseItem[]> {
  const qs = buildAnalyticsQueryParams(filter);
  return apiClient<TimelineResponseItem[]>(`/links/${linkId}/analytics/timeline${qs}`);
}

export async function getLinkDevices(
  linkId: string,
  filter?: DateRangeFilter,
): Promise<GroupedResponseItem[]> {
  const qs = buildAnalyticsQueryParams(filter);
  return apiClient<GroupedResponseItem[]>(`/links/${linkId}/analytics/devices${qs}`);
}

export async function getLinkBrowsers(
  linkId: string,
  filter?: DateRangeFilter,
): Promise<GroupedResponseItem[]> {
  const qs = buildAnalyticsQueryParams(filter);
  return apiClient<GroupedResponseItem[]>(`/links/${linkId}/analytics/browsers${qs}`);
}

export async function getLinkReferrers(
  linkId: string,
  filter?: DateRangeFilter,
): Promise<GroupedResponseItem[]> {
  const qs = buildAnalyticsQueryParams(filter);
  return apiClient<GroupedResponseItem[]>(`/links/${linkId}/analytics/referrers${qs}`);
}

export async function getLinkCountries(
  linkId: string,
  filter?: DateRangeFilter,
): Promise<GroupedResponseItem[]> {
  const qs = buildAnalyticsQueryParams(filter);
  return apiClient<GroupedResponseItem[]>(`/links/${linkId}/analytics/countries${qs}`);
}

export interface RecentClickItem {
  id: string;
  linkShortCode: string;
  device: string | null;
  browser: string | null;
  country: string | null;
  referrer: string | null;
  timestamp: string;
}

export async function getRecentClicks(limit = 20): Promise<RecentClickItem[]> {
  return apiClient<RecentClickItem[]>(`/analytics/recent?limit=${limit}`);
}

// ─── Account-wide overview (single-request replacement for N+1 fanout) ────────

export interface OverviewTopLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  isActive: boolean;
}

export interface OverviewRecentLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface AnalyticsOverviewResponse {
  totalClicks: number;
  clicksToday: number;
  totalLinks: number;
  activeLinks: number;
  linksThisMonth: number;
  timeline: TimelineResponseItem[];
  devices: GroupedResponseItem[];
  browsers: GroupedResponseItem[];
  countries: GroupedResponseItem[];
  referrers: GroupedResponseItem[];
  topLinks: OverviewTopLink[];
  recentLinks: OverviewRecentLink[];
  rangeInfo?: {
    range: DateRangePreset;
    startDate: string | null;
    endDate: string | null;
    timezone: string;
  };
}

export async function getAnalyticsOverview(
  filter?: DateRangeFilter,
): Promise<AnalyticsOverviewResponse> {
  const qs = buildAnalyticsQueryParams(filter);
  return apiClient<AnalyticsOverviewResponse>(`/analytics/overview${qs}`);
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function downloadAnalyticsCsv(filter?: DateRangeFilter, linkId?: string): Promise<void> {
  const qs = buildAnalyticsQueryParams(filter);
  const endpoint = linkId ? `/links/${linkId}/analytics/export${qs}` : `/analytics/export${qs}`;

  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('linkly-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        token = parsed?.state?.accessToken ?? null;
      }
    } catch {
      // ignore storage access error
    }
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let errMsg = 'Failed to download analytics CSV';
    try {
      const errJson = await res.json();
      if (errJson?.message) errMsg = Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message;
    } catch {
      // ignore parse error
    }
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition');
  let filename = `linkly-analytics-${filter?.range ?? 'all'}-${new Date().toISOString().slice(0, 10)}.csv`;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(blobUrl);
  document.body.removeChild(a);
}

