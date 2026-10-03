'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector';
import { CreateLinkDialog } from '@/components/dashboard/CreateLinkDialog';
import { useToast } from '@/components/ui/toast';
import {
  getAnalyticsOverview,
  getLinkAnalytics,
  getLinkTimeline,
  getLinkDevices,
  getLinkBrowsers,
  getLinkCountries,
  getLinkReferrers,
  downloadAnalyticsCsv,
} from '@/lib/api/analytics';
import type {
  AnalyticsOverviewResponse,
  DateRangeFilter,
  GroupedResponseItem,
  TimelineResponseItem,
} from '@/lib/api/analytics';
import { getLinks } from '@/lib/api/links';
import type { Link as LinkItem } from '@/lib/api/links';
import { formatShortUrl } from '@/lib/utils/url';
import {
  BarChart3,
  Download,
  Filter,
  Globe2,
  Laptop,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Link2,
  RefreshCw,
  Loader2,
  Menu,
  X,
  ExternalLink,
  Copy,
  Check,
  MousePointerClick,
  Users,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filters state
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({ range: '30d' });
  const [selectedLinkId, setSelectedLinkId] = useState<string>('all');
  const [userLinks, setUserLinks] = useState<LinkItem[]>([]);

  // Analytics data state
  const [overviewData, setOverviewData] = useState<AnalyticsOverviewResponse | null>(null);
  const [linkTimeline, setLinkTimeline] = useState<TimelineResponseItem[]>([]);
  const [linkDevices, setLinkDevices] = useState<GroupedResponseItem[]>([]);
  const [linkBrowsers, setLinkBrowsers] = useState<GroupedResponseItem[]>([]);
  const [linkCountries, setLinkCountries] = useState<GroupedResponseItem[]>([]);
  const [linkReferrers, setLinkReferrers] = useState<GroupedResponseItem[]>([]);
  const [linkSummary, setLinkSummary] = useState<{ totalClicks: number; clicksToday: number } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load available links for the selector
  useEffect(() => {
    let mounted = true;
    getLinks({ limit: 100 })
      .then((res) => {
        if (mounted) setUserLinks(res.items);
      })
      .catch(() => {
        // silent fallback
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch analytics data according to selected filters
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (selectedLinkId === 'all') {
        const data = await getAnalyticsOverview(dateFilter);
        setOverviewData(data);
      } else {
        const [sum, time, dev, brw, cnt, ref] = await Promise.all([
          getLinkAnalytics(selectedLinkId, dateFilter),
          getLinkTimeline(selectedLinkId, dateFilter),
          getLinkDevices(selectedLinkId, dateFilter),
          getLinkBrowsers(selectedLinkId, dateFilter),
          getLinkCountries(selectedLinkId, dateFilter),
          getLinkReferrers(selectedLinkId, dateFilter),
        ]);
        setLinkSummary(sum);
        setLinkTimeline(time);
        setLinkDevices(dev);
        setLinkBrowsers(brw);
        setLinkCountries(cnt);
        setLinkReferrers(ref);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load analytics data';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, selectedLinkId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await downloadAnalyticsCsv(
        dateFilter,
        selectedLinkId !== 'all' ? selectedLinkId : undefined,
      );
      toast('Analytics CSV downloaded successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to export CSV', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(formatShortUrl(code));
    setCopiedCode(code);
    toast('Short URL copied to clipboard', 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleResetFilters = () => {
    setDateFilter({ range: '30d' });
    setSelectedLinkId('all');
  };

  // Derive consolidated views
  const isSingleLink = selectedLinkId !== 'all';
  const totalClicks = isSingleLink
    ? linkSummary?.totalClicks ?? 0
    : overviewData?.totalClicks ?? 0;
  const clicksToday = isSingleLink
    ? linkSummary?.clicksToday ?? 0
    : overviewData?.clicksToday ?? 0;
  const totalLinks = overviewData?.totalLinks ?? 1;
  const activeLinks = overviewData?.activeLinks ?? 1;
  const avgClicksPerLink = totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : '0';

  const timelineData = isSingleLink ? linkTimeline : overviewData?.timeline ?? [];
  const devicesData = isSingleLink ? linkDevices : overviewData?.devices ?? [];
  const browsersData = isSingleLink ? linkBrowsers : overviewData?.browsers ?? [];
  const countriesData = isSingleLink ? linkCountries : overviewData?.countries ?? [];
  const referrersData = isSingleLink ? linkReferrers : overviewData?.referrers ?? [];

  const selectedLinkObj = userLinks.find((l) => l.id === selectedLinkId);

  return (
    <div className="w-full max-w-[1520px] h-[100vh] min-h-[720px] bg-white flex overflow-hidden relative">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar className="relative z-10 w-64 h-full" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-3 text-white self-start ml-2 mt-4 z-20 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F4F5F3] overflow-y-auto">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-5 px-6 md:px-8 border-b border-[#E5EAE7] bg-[#F4F5F3] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-stone-600 hover:text-stone-900 lg:hidden cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold text-[#1A2621] tracking-tight">
                  Analytics
                </h1>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBF5F1] text-[#236B56] border border-[#88D4BE]/30">
                  {dateFilter.range === 'all' ? 'All Time' : dateFilter.range.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#61726A] mt-0.5">
                Deep performance metrics, visitor audience, and conversion breakdown
              </p>
            </div>
          </div>

          {/* Action controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-end">
            {/* Link Selector */}
            <div className="relative">
              <select
                value={selectedLinkId}
                onChange={(e) => setSelectedLinkId(e.target.value)}
                className="h-9 text-xs pl-3 pr-8 rounded-full border border-[#E5EAE7] bg-white text-[#1A2621] font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#236B56]/20 cursor-pointer appearance-none"
              >
                <option value="all">All Short Links</option>
                {userLinks.map((l) => (
                  <option key={l.id} value={l.id}>
                    /{l.shortCode} — {l.originalUrl.replace(/^https?:\/\//, '').slice(0, 30)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Date Range Selector */}
            <DateRangeSelector
              value={dateFilter}
              onChange={setDateFilter}
            />

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white text-[#1A2621] hover:bg-[#EBF5F1] hover:text-[#236B56] border border-[#E5EAE7] rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#236B56]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#236B56]" />
              )}
              <span>Export CSV</span>
            </button>

            {/* Reset Filters */}
            {(selectedLinkId !== 'all' || dateFilter.range !== '30d') && (
              <button
                onClick={handleResetFilters}
                className="h-9 px-3 text-xs text-[#61726A] hover:text-[#1A2621] font-medium transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </header>

        {/* Selected Link Context Banner (when single link selected) */}
        {isSingleLink && selectedLinkObj && (
          <div className="mx-6 md:mx-8 mt-5 p-3.5 rounded-2xl bg-white border border-[#E5EAE7] flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#EBF5F1] text-[#236B56] flex items-center justify-center font-bold text-xs shrink-0">
                <Link2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#1A2621]">
                    {formatShortUrl(selectedLinkObj.shortCode)}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedLinkObj.shortCode)}
                    className="p-1 text-stone-400 hover:text-[#236B56] transition-colors cursor-pointer"
                    title="Copy short link"
                  >
                    {copiedCode === selectedLinkObj.shortCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#61726A] truncate max-w-md">
                  Destination: {selectedLinkObj.originalUrl}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/links/${selectedLinkObj.id}`}
                className="text-xs font-semibold text-[#236B56] hover:underline flex items-center gap-1"
              >
                <span>Full Link Manager</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Body Container */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchData}
                className="font-semibold underline hover:no-underline cursor-pointer ml-3"
              >
                Retry
              </button>
            </div>
          )}

          {/* 1. KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between text-[#61726A] text-xs font-medium">
                <span>Total Clicks</span>
                <div className="w-7 h-7 rounded-lg bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                  <MousePointerClick className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1A2621] mt-2">
                {isLoading ? '...' : totalClicks.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#61726A] mt-1 flex items-center gap-1">
                <span className="font-semibold text-emerald-700">+{clicksToday}</span>
                <span>today</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between text-[#61726A] text-xs font-medium">
                <span>Active Scope</span>
                <div className="w-7 h-7 rounded-lg bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1A2621] mt-2">
                {isLoading ? '...' : isSingleLink ? '1 Link' : `${activeLinks} / ${totalLinks}`}
              </div>
              <div className="text-[11px] text-[#61726A] mt-1">
                {isSingleLink ? 'Single link analytics' : 'Active / Total links'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between text-[#61726A] text-xs font-medium">
                <span>Avg. Clicks / Link</span>
                <div className="w-7 h-7 rounded-lg bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1A2621] mt-2">
                {isLoading ? '...' : isSingleLink ? totalClicks.toLocaleString() : avgClicksPerLink}
              </div>
              <div className="text-[11px] text-[#61726A] mt-1">
                {isSingleLink ? 'Across selected range' : 'Account-wide link average'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between text-[#61726A] text-xs font-medium">
                <span>Traffic Channels</span>
                <div className="w-7 h-7 rounded-lg bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1A2621] mt-2">
                {isLoading ? '...' : referrersData.length}
              </div>
              <div className="text-[11px] text-[#61726A] mt-1">
                Distinct referrer sources
              </div>
            </div>
          </div>

          {/* 2. Interactive Click Timeline Chart */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5EAE7] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-[#1A2621] tracking-tight">
                  Clicks Over Time
                </h2>
                <p className="text-xs text-[#61726A] mt-0.5">
                  Daily click volume across the active date range
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#61726A]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#236B56]" />
                  <span>Click Volume</span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-xs text-stone-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#236B56]" />
                <span>Loading timeline...</span>
              </div>
            ) : timelineData.length === 0 || totalClicks === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#F4F5F3] rounded-xl border border-dashed border-[#E5EAE7]">
                <BarChart3 className="w-8 h-8 text-stone-300 mb-2" />
                <p className="text-sm font-semibold text-[#1A2621]">No clicks in this period</p>
                <p className="text-xs text-[#61726A] mt-1 max-w-sm">
                  Share your short links on social media, messaging, or emails to begin tracking daily trends.
                </p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsTealGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#236B56" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#88D4BE" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAE7" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#8E9F97', fontSize: 11 }}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return isNaN(d.getTime()) ? val : `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#8E9F97', fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-xl shadow-lg border border-[#E5EAE7] text-xs">
                              <p className="font-semibold text-[#1A2621] mb-1">{label}</p>
                              <p className="text-[#236B56] font-bold">
                                {payload[0].value} {Number(payload[0].value) === 1 ? 'click' : 'clicks'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#236B56"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#analyticsTealGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 3. Deep Breakdowns Grid: Geographic, Devices, Browsers, Referrers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Geographic Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                    <Globe2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A2621]">Geographic Locations</h3>
                    <p className="text-[11px] text-[#61726A]">Top visitor countries</p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="h-44 flex items-center justify-center text-xs text-stone-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#236B56]" />
                  <span>Loading countries...</span>
                </div>
              ) : countriesData.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">No location data captured yet</p>
              ) : (
                <div className="space-y-3">
                  {countriesData.slice(0, 6).map((item) => {
                    const pct = totalClicks > 0 ? ((item.clicks / totalClicks) * 100).toFixed(0) : '0';
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#1A2621]">{item.name}</span>
                          <span className="text-[#61726A] font-medium">
                            {item.clicks} clicks ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#EBF5F1] overflow-hidden">
                          <div
                            className="h-full bg-[#236B56] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Device Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A2621]">Device Types</h3>
                    <p className="text-[11px] text-[#61726A]">Desktop, mobile, and tablet usage</p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="h-44 flex items-center justify-center text-xs text-stone-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#236B56]" />
                  <span>Loading devices...</span>
                </div>
              ) : devicesData.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">No device data captured yet</p>
              ) : (
                <div className="space-y-3">
                  {devicesData.map((item) => {
                    const pct = totalClicks > 0 ? ((item.clicks / totalClicks) * 100).toFixed(0) : '0';
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#1A2621]">{item.name}</span>
                          <span className="text-[#61726A] font-medium">
                            {item.clicks} clicks ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#EBF5F1] overflow-hidden">
                          <div
                            className="h-full bg-[#3BA385] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Browser Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A2621]">Browsers</h3>
                    <p className="text-[11px] text-[#61726A]">Client web browsers detected</p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="h-44 flex items-center justify-center text-xs text-stone-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#236B56]" />
                  <span>Loading browsers...</span>
                </div>
              ) : browsersData.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">No browser data captured yet</p>
              ) : (
                <div className="space-y-3">
                  {browsersData.slice(0, 6).map((item) => {
                    const pct = totalClicks > 0 ? ((item.clicks / totalClicks) * 100).toFixed(0) : '0';
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#1A2621]">{item.name}</span>
                          <span className="text-[#61726A] font-medium">
                            {item.clicks} clicks ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#EBF5F1] overflow-hidden">
                          <div
                            className="h-full bg-[#236B56] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Referrers Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A2621]">Referrers</h3>
                    <p className="text-[11px] text-[#61726A]">Traffic sources and referrers</p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="h-44 flex items-center justify-center text-xs text-stone-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#236B56]" />
                  <span>Loading referrers...</span>
                </div>
              ) : referrersData.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">No referrer data recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {referrersData.slice(0, 6).map((item) => {
                    const pct = totalClicks > 0 ? ((item.clicks / totalClicks) * 100).toFixed(0) : '0';
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#1A2621] truncate max-w-[200px]" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[#61726A] font-medium">
                            {item.clicks} clicks ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#EBF5F1] overflow-hidden">
                          <div
                            className="h-full bg-[#88D4BE] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. Top Performing Links (When viewing all links) */}
          {!isSingleLink && overviewData && overviewData.topLinks && overviewData.topLinks.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-[#1A2621]">Top Performing Links</h3>
                  <p className="text-xs text-[#61726A] mt-0.5">
                    Your highest engagement links in this date range
                  </p>
                </div>
                <Link
                  href="/dashboard/links"
                  className="text-xs font-semibold text-[#236B56] hover:underline flex items-center gap-1"
                >
                  <span>View All Links</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5EAE7] text-[#61726A]">
                      <th className="pb-3 font-semibold">Short Link</th>
                      <th className="pb-3 font-semibold">Destination URL</th>
                      <th className="pb-3 font-semibold text-right">Clicks</th>
                      <th className="pb-3 font-semibold text-right">Share</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EAE7]/60">
                    {overviewData.topLinks.map((link, idx) => {
                      const share = totalClicks > 0 ? ((link.clickCount / totalClicks) * 100).toFixed(1) : '0';
                      return (
                        <tr key={link.id} className="hover:bg-[#F4F5F3]/50 transition-colors">
                          <td className="py-3 font-semibold text-[#1A2621]">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#EBF5F1] text-[#236B56] font-bold text-[10px] flex items-center justify-center shrink-0">
                                #{idx + 1}
                              </span>
                              <span>/{link.shortCode}</span>
                              <button
                                onClick={() => handleCopy(link.shortCode)}
                                className="p-1 text-stone-400 hover:text-[#236B56] transition-colors cursor-pointer"
                                title="Copy"
                              >
                                {copiedCode === link.shortCode ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-[#61726A] max-w-xs truncate" title={link.originalUrl}>
                            {link.originalUrl}
                          </td>
                          <td className="py-3 text-right font-bold text-[#1A2621]">
                            {link.clickCount.toLocaleString()}
                          </td>
                          <td className="py-3 text-right">
                            <span className="px-2 py-0.5 rounded-full bg-[#EBF5F1] text-[#236B56] font-semibold text-[11px]">
                              {share}%
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              href={`/dashboard/links/${link.id}`}
                              className="text-xs font-semibold text-[#236B56] hover:underline"
                            >
                              Analytics →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateLinkDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
