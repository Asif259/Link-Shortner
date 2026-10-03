'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Edit,
  Trash2,
  Power,
  PowerOff,
  AlertCircle,
  Menu,
  X,
  Share2,
  Calendar,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StatCard } from '@/components/dashboard/StatCard';
import { ClicksChart } from '@/components/dashboard/ClicksChart';
import { DeviceChart } from '@/components/dashboard/DeviceChart';
import { BrowserStats } from '@/components/dashboard/BrowserStats';
import { CountryStats } from '@/components/dashboard/CountryStats';
import { ReferrerStats } from '@/components/dashboard/ReferrerStats';
import { EditLinkDialog } from '@/components/dashboard/EditLinkDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { getLink, deleteLink, disableLink, enableLink } from '@/lib/api/links';
import type { Link as LinkItem } from '@/lib/api/links';
import {
  getLinkAnalytics,
  getLinkTimeline,
  getLinkDevices,
  getLinkBrowsers,
  getLinkCountries,
  getLinkReferrers,
} from '@/lib/api/analytics';
import type {
  AnalyticsSummaryResponse,
  TimelineResponseItem,
  GroupedResponseItem,
} from '@/lib/api/analytics';
import {
  DashboardStat,
  ChartPoint,
  DeviceItem,
  ShareItem,
  toShareItems,
  toDeviceItems,
  formatChartDate,
} from '@/lib/hooks/useDashboardData';
import { cn } from '@/lib/utils';
import { getShortBaseUrl } from '@/lib/utils/url';

export default function LinkAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const linkId = params?.id;
  const router = useRouter();
  const { toast } = useToast();

  const [baseUrl, setBaseUrl] = useState(() => getShortBaseUrl());

  useEffect(() => {
    setBaseUrl(getShortBaseUrl());
  }, []);

  const [link, setLink] = useState<LinkItem | null>(null);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [timeline, setTimeline] = useState<ChartPoint[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [browsers, setBrowsers] = useState<ShareItem[]>([]);
  const [countries, setCountries] = useState<ShareItem[]>([]);
  const [referrers, setReferrers] = useState<ShareItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const loadData = useCallback(async () => {
    if (!linkId) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch link details
      const linkData = await getLink(linkId);
      setLink(linkData);

      // 2. Fetch all analytics in parallel
      const [
        summaryRes,
        timelineRes,
        devicesRes,
        browsersRes,
        countriesRes,
        referrersRes,
      ] = await Promise.allSettled([
        getLinkAnalytics(linkId),
        getLinkTimeline(linkId),
        getLinkDevices(linkId),
        getLinkBrowsers(linkId),
        getLinkCountries(linkId),
        getLinkReferrers(linkId),
      ]);

      const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
      const rawTimeline = timelineRes.status === 'fulfilled' ? timelineRes.value : [];
      const rawDevices = devicesRes.status === 'fulfilled' ? devicesRes.value : [];
      const rawBrowsers = browsersRes.status === 'fulfilled' ? browsersRes.value : [];
      const rawCountries = countriesRes.status === 'fulfilled' ? countriesRes.value : [];
      const rawReferrers = referrersRes.status === 'fulfilled' ? referrersRes.value : [];

      // Format Timeline
      const formattedTimeline: ChartPoint[] = rawTimeline
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((item) => ({
          date: formatChartDate(item.date),
          clicks: item.clicks,
        }));
      setTimeline(formattedTimeline);

      // Sparkline (last 7 daily totals)
      const sparkline7 = formattedTimeline.slice(-7).map((p) => p.clicks);
      const spark = sparkline7.length > 0 ? sparkline7 : [0];

      // Format Stats
      const totalClicks = summary?.totalClicks ?? linkData.clickCount ?? 0;
      const clicksToday = summary?.clicksToday ?? 0;
      const clicksThisWeek = summary?.clicksThisWeek ?? 0;
      const clicksThisMonth = summary?.clicksThisMonth ?? 0;

      const builtStats: DashboardStat[] = [
        {
          title: 'Total Clicks',
          value: totalClicks.toLocaleString(),
          change: 'All time',
          period: 'total recorded visits',
          isPositive: true,
          sparkline: spark,
        },
        {
          title: 'Clicks Today',
          value: clicksToday.toLocaleString(),
          change: clicksToday > 0 ? 'Live' : '0 today',
          period: 'today so far',
          isPositive: clicksToday > 0,
          sparkline: spark,
        },
        {
          title: 'Clicks This Week',
          value: clicksThisWeek.toLocaleString(),
          change: 'Last 7 days',
          period: 'past 7 days',
          isPositive: clicksThisWeek > 0,
          sparkline: spark,
        },
        {
          title: 'Clicks This Month',
          value: clicksThisMonth.toLocaleString(),
          change: 'Last 30 days',
          period: 'past 30 days',
          isPositive: clicksThisMonth > 0,
          sparkline: spark,
        },
      ];
      setStats(builtStats);

      // Format distributions
      setDevices(toDeviceItems(rawDevices));
      setBrowsers(toShareItems(rawBrowsers));
      setCountries(toShareItems(rawCountries));
      setReferrers(toShareItems(rawReferrers));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load link analytics');
    } finally {
      setIsLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const fullShortUrl = link ? `${baseUrl}/${link.shortCode.replace(/^\//, '')}` : '';

  const handleCopy = () => {
    if (!fullShortUrl) return;
    navigator.clipboard.writeText(fullShortUrl).then(() => {
      setCopied(true);
      toast('Copied short link to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleToggleStatus = async () => {
    if (!link) return;
    const isCurrentlyDisabled = link.status === 'disabled';
    try {
      setIsTogglingStatus(true);
      const updated = isCurrentlyDisabled
        ? await enableLink(link.id)
        : await disableLink(link.id);
      setLink((prev) => (prev ? { ...prev, ...updated } : updated));
      toast(`Link is now ${updated.status ?? (isCurrentlyDisabled ? 'active' : 'disabled')}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Status update failed', 'error');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!link) return;
    try {
      setIsDeleting(true);
      await deleteLink(link.id);
      toast(`Link /${link.shortCode} deleted`, 'success');
      router.push('/dashboard/links');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
      setIsDeleting(false);
    }
  };

  const handleLinkUpdated = (updated: LinkItem) => {
    setLink((prev) => (prev ? { ...prev, ...updated } : updated));
    void loadData();
  };

  const totalClicksCount = stats[0]
    ? parseInt(stats[0].value.replace(/,/g, ''), 10) || 0
    : link?.clickCount || 0;

  const status = link?.status || 'active';

  return (
    <div className="w-full max-w-[1520px] h-[100vh] min-h-[720px] bg-white flex overflow-hidden relative">
      {/* Desktop Sidebar */}
      <Sidebar currentTab="Links" className="hidden lg:flex" />

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar
            currentTab="Links"
            onTabChange={() => setMobileMenuOpen(false)}
            className="relative z-10 w-64 h-full"
          />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-3 text-white self-start ml-2 mt-4 z-20"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#F4F5F3] overflow-hidden">
        {/* Mobile Navbar */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[#236B56] text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg hover:bg-white/10"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-base">Linkly</span>
          </div>
          <Link
            href="/dashboard/links"
            className="text-xs bg-white text-[#236B56] px-3 py-1 rounded-full font-semibold"
          >
            &larr; Links
          </Link>
        </div>

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Breadcrumb / Top Bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/links"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#236B56] hover:text-[#1C5745] hover:underline transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all links</span>
            </Link>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Unable to load link analytics</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadData()}
                className="px-3 py-1 bg-white border border-rose-300 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-100/50"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="bg-white rounded-2xl p-6 border border-stone-200/60 h-36" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-5 border border-stone-200/60 h-28"
                  />
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-stone-200/60 h-80" />
            </div>
          ) : !link ? (
            /* Link Not Found */
            <div className="bg-white rounded-2xl p-12 border border-stone-200/60 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <LinkIcon className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#1A2621]">Link Not Found</h2>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                This short link may have been deleted or you do not have permission to view its analytics.
              </p>
              <Link
                href="/dashboard/links"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#236B56] text-white rounded-full text-xs font-semibold hover:bg-[#1C5745]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Links</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Link Summary Hero Card */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/60 shadow-2xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Link Info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1A2621]">
                        /{link.shortCode.replace(/^\//, '')}
                      </h1>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize',
                          status === 'active' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
                          status === 'disabled' && 'bg-amber-50 text-amber-700 border border-amber-200/50',
                          status === 'expired' && 'bg-rose-50 text-rose-700 border border-rose-200/50'
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            status === 'active' && 'bg-emerald-600',
                            status === 'disabled' && 'bg-amber-600',
                            status === 'expired' && 'bg-rose-600'
                          )}
                        />
                        {status}
                      </span>
                    </div>

                    {/* Short URL & Copy Action */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#236B56]">
                        {fullShortUrl}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors cursor-pointer"
                        title="Copy short link"
                        aria-label="Copy short link"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-[#236B56]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Destination URL */}
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 truncate max-w-xl">
                      <span className="text-[#8E9F97]">Destination:</span>
                      <a
                        href={link.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1A2621] hover:text-[#236B56] hover:underline inline-flex items-center gap-1 font-medium truncate"
                      >
                        <span className="truncate">{link.originalUrl}</span>
                        <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    {/* Copy Button Pill */}
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3.5 py-2 rounded-full border border-stone-200 text-xs font-semibold text-[#1A2621] hover:bg-[#F4F5F3] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#236B56]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Enable/Disable Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      disabled={isTogglingStatus}
                      className={cn(
                        'px-3.5 py-2 rounded-full border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer',
                        status === 'disabled'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      )}
                    >
                      {status === 'disabled' ? (
                        <>
                          <Power className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Enable Link</span>
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-3.5 h-3.5 text-amber-600" />
                          <span>Disable Link</span>
                        </>
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => setIsEditOpen(true)}
                      className="px-3.5 py-2 rounded-full border border-stone-200 text-xs font-semibold text-[#1A2621] hover:bg-[#F4F5F3] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setIsDeleteOpen(true)}
                      className="px-3.5 py-2 rounded-full border border-rose-200 bg-rose-50/50 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. Stat Cards */}
              <section aria-label="Link Performance Metrics">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, idx) => (
                    <StatCard key={stat.title} stat={stat} index={idx} />
                  ))}
                </div>
              </section>

              {/* 2. Clicks Over Time */}
              <section aria-label="Link Click Trend">
                <ClicksChart
                  allData={timeline}
                  title="Click Trend"
                  subtitle={`Daily visitor clicks recorded for /${link.shortCode}`}
                  note="Filtered strictly to this short link"
                />
              </section>

              {/* 3. Demographics and Channels */}
              <section aria-label="Audience Breakdown">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <DeviceChart devices={devices} totalClicks={totalClicksCount} />
                  <BrowserStats browsers={browsers} />
                  <CountryStats countries={countries} />
                  <ReferrerStats referrers={referrers} />
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Edit Dialog */}
      <EditLinkDialog
        link={link}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onLinkUpdated={handleLinkUpdated}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Short Link"
        description={`Are you sure you want to delete /${link?.shortCode}? All recorded click history and redirection for this link will be permanently erased.`}
        confirmLabel="Delete Link"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
