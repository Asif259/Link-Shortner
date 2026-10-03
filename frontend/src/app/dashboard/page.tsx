'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ClicksChart } from '@/components/dashboard/ClicksChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { DeviceChart } from '@/components/dashboard/DeviceChart';
import { TopLinks } from '@/components/dashboard/TopLinks';
import { CountryStats } from '@/components/dashboard/CountryStats';
import { BrowserStats } from '@/components/dashboard/BrowserStats';
import { RecentLinks } from '@/components/dashboard/RecentLinks';
import { CreateLinkDialog } from '@/components/dashboard/CreateLinkDialog';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { Menu, X, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('Analytics');
  const [selectedRange, setSelectedRange] = useState('Last 30 days');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data, isLoading, error } = useDashboardData();

  const totalClicks = data?.stats[0]
    ? parseInt(data.stats[0].value.replace(/,/g, ''), 10) || 0
    : 0;

  return (
    <div className="w-full max-w-[1520px] h-[100vh] min-h-[720px] bg-white flex overflow-hidden relative">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        className="hidden lg:flex"
      />

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar
            currentTab={currentTab}
            onTabChange={(tab) => {
              setCurrentTab(tab);
              setMobileMenuOpen(false);
            }}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#F4F5F3] overflow-hidden">
        {/* Mobile Top Navbar */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[#236B56] text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg hover:bg-white/10"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-base">Linkly</span>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-3 py-1 bg-white text-[#236B56] rounded-full text-xs font-semibold shadow-xs"
          >
            + Create
          </button>
        </div>

        {/* Desktop Header */}
        <Header
          onOpenCreateDialog={() => setIsCreateOpen(true)}
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1A2621]">
                Analytics Overview
              </h1>
              <p className="text-xs text-[#61726A] mt-0.5">
                Track link performance, engagement metrics, and visitor demographics
              </p>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Stat Cards */}
          <section aria-label="Key Performance Indicators">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-5 border border-stone-200/60 h-28 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(data?.stats ?? []).map((stat, idx) => (
                  <StatCard key={stat.title} stat={stat} index={idx} />
                ))}
              </div>
            )}
          </section>

          {/* 2. Clicks Chart + Recent Activity */}
          <section aria-label="Click Trend and Real-Time Activity">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {isLoading ? (
                  <div className="bg-white rounded-2xl border border-stone-200/60 h-80 animate-pulse" />
                ) : (
                  <ClicksChart allData={data?.timeline ?? []} />
                )}
              </div>
              <div className="lg:col-span-1">
                <RecentActivity />
              </div>
            </div>
          </section>

          {/* 3. Devices + Top Links */}
          <section aria-label="Devices and Top Links">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                {isLoading ? (
                  <div className="bg-white rounded-2xl border border-stone-200/60 h-64 animate-pulse" />
                ) : (
                  <DeviceChart
                    devices={data?.devices ?? []}
                    totalClicks={totalClicks}
                  />
                )}
              </div>
              <div className="lg:col-span-3">
                {isLoading ? (
                  <div className="bg-white rounded-2xl border border-stone-200/60 h-64 animate-pulse" />
                ) : (
                  <TopLinks topLinks={data?.topLinks ?? []} />
                )}
              </div>
            </div>
          </section>

          {/* 4. Countries + Browsers */}
          <section aria-label="Audience Geography and Browsers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                <>
                  <div className="bg-white rounded-2xl border border-stone-200/60 h-64 animate-pulse" />
                  <div className="bg-white rounded-2xl border border-stone-200/60 h-64 animate-pulse" />
                </>
              ) : (
                <>
                  <CountryStats countries={data?.countries ?? []} />
                  <BrowserStats browsers={data?.browsers ?? []} />
                </>
              )}
            </div>
          </section>

          {/* 5. Recent Links */}
          <section aria-label="Recent Links Management">
            {isLoading ? (
              <div className="bg-white rounded-2xl border border-stone-200/60 p-6">
                <TableSkeleton rows={5} />
              </div>
            ) : (
              <RecentLinks
                links={data?.recentLinks ?? []}
                totalLinks={data?.totalLinks ?? 0}
                onSelectLinkForAnalytics={(linkId) => {
                  router.push(`/dashboard/links/${linkId}`);
                }}
              />
            )}
          </section>
        </main>
      </div>

      {/* Create Link Modal */}
      <CreateLinkDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onLinkCreated={(newLink) => {
          console.log('New link created:', newLink);
        }}
      />
    </div>
  );
}
