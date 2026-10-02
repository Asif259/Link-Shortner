'use client';

import React, { useState } from 'react';
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
import { mockDashboardData } from '@/lib/mock-dashboard-data';
import { Menu, X } from 'lucide-react';

export default function DashboardPage() {
  const [currentTab, setCurrentTab] = useState('Analytics');
  const [selectedRange, setSelectedRange] = useState('Last 30 days');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          {/* Mobile Top Navbar with hamburger */}
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

          {/* Desktop & Tablet Header */}
          <Header
            onOpenCreateDialog={() => setIsCreateOpen(true)}
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />

          {/* Scrollable Dashboard Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Overview Heading */}
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

            {/* 1. Four Stat Summary Cards */}
            <section aria-label="Key Performance Indicators">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockDashboardData.stats.map((stat, idx) => (
                  <StatCard key={stat.title} stat={stat} index={idx} />
                ))}
              </div>
            </section>

            {/* 2. Main Analytics Chart (Left) + Live Activity Stream (Right) */}
            <section aria-label="Click Trend and Real-Time Activity">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ClicksChart />
                </div>
                <div className="lg:col-span-1">
                  <RecentActivity />
                </div>
              </div>
            </section>

            {/* 3. Devices Breakdown (Left) + Top Performing Links (Right) */}
            <section aria-label="Devices and Top Links">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                  <DeviceChart />
                </div>
                <div className="lg:col-span-3">
                  <TopLinks />
                </div>
              </div>
            </section>

            {/* 4. Geography (Countries) + Browser Split */}
            <section aria-label="Audience Geography and Browsers">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CountryStats />
                <BrowserStats />
              </div>
            </section>

            {/* 5. Recent Shortened Links Table */}
            <section aria-label="Recent Links Management">
              <RecentLinks
                onSelectLinkForAnalytics={(linkId) => {
                  console.log('Selected link for drill-down analytics:', linkId);
                }}
              />
            </section>
          </main>
        </div>

      {/* Create Short Link Modal Dialog */}
      <CreateLinkDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onLinkCreated={(newLink) => {
          // Add to local state or refetch links
          console.log('New link created:', newLink);
        }}
      />
    </div>
  );
}
