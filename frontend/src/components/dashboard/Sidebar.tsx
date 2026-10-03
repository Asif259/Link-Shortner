'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Link as LinkIcon,
  BarChart3,
  Folder,
  QrCode,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth.store';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface SidebarProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export function Sidebar({ currentTab, onTabChange, className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Links', href: '/dashboard/links', icon: LinkIcon },
    { name: 'Analytics', href: '/dashboard', icon: BarChart3 },
    { name: 'Groups', href: '#', icon: Folder },
    { name: 'QR Codes', href: '#', icon: QrCode },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'w-60 bg-[#236B56] text-white flex flex-col justify-between p-6 shrink-0 transition-all select-none',
        className
      )}
    >
      {/* Brand / Logo */}
      <div>
        <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3 mb-8 group">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white block">Linkly</span>
            <span className="text-[11px] text-emerald-200/70 font-medium block -mt-0.5">
              URL & Analytics
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrentPath = item.href !== '#' && (pathname === item.href || (item.name === 'Dashboard' && pathname === '/'));
            const isActive = currentTab ? (item.name === currentTab) : isCurrentPath;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onTabChange?.(item.name)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-inner'
                    : 'text-emerald-100/75 hover:text-white hover:bg-white/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-4 h-4 transition-transform group-hover:scale-105', isActive ? 'text-white' : 'text-emerald-200/70')} />
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-white shadow-xs" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="pt-6 border-t border-emerald-700/40">
        <button
          type="button"
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-[#236B56] hover:bg-emerald-50 active:bg-emerald-100 rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
