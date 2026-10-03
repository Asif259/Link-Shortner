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
