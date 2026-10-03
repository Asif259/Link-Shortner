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

export async function getLinkAnalytics(linkId: string): Promise<AnalyticsSummaryResponse> {
  return apiClient<AnalyticsSummaryResponse>(`/links/${linkId}/analytics`);
}

export async function getLinkTimeline(linkId: string): Promise<TimelineResponseItem[]> {
  return apiClient<TimelineResponseItem[]>(`/links/${linkId}/analytics/timeline`);
}

export async function getLinkDevices(linkId: string): Promise<GroupedResponseItem[]> {
  return apiClient<GroupedResponseItem[]>(`/links/${linkId}/analytics/devices`);
}

export async function getLinkBrowsers(linkId: string): Promise<GroupedResponseItem[]> {
  return apiClient<GroupedResponseItem[]>(`/links/${linkId}/analytics/browsers`);
}

export async function getLinkReferrers(linkId: string): Promise<GroupedResponseItem[]> {
  return apiClient<GroupedResponseItem[]>(`/links/${linkId}/analytics/referrers`);
}

export async function getLinkCountries(linkId: string): Promise<GroupedResponseItem[]> {
  return apiClient<GroupedResponseItem[]>(`/links/${linkId}/analytics/countries`);
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
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverviewResponse> {
  return apiClient<AnalyticsOverviewResponse>('/analytics/overview');
}
