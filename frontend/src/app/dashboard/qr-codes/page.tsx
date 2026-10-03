'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { CreateLinkDialog } from '@/components/dashboard/CreateLinkDialog';
import { useToast } from '@/components/ui/toast';
import { getLinks } from '@/lib/api/links';
import type { Link as LinkItem } from '@/lib/api/links';
import { getShortBaseUrl, formatShortUrl } from '@/lib/utils/url';
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Search,
  Filter,
  BarChart2,
  Plus,
  Loader2,
  Menu,
  X,
  Sparkles,
  Link2,
  MousePointerClick,
} from 'lucide-react';

interface QRItemProps {
  link: LinkItem;
  baseUrl: string;
}

function QRCard({ link, baseUrl }: QRItemProps) {
  const { toast } = useToast();
  const [svgString, setSvgString] = useState<string>('');
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [hasCopied, setHasCopied] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [isDownloadingSvg, setIsDownloadingSvg] = useState(false);

  const fullShortUrl = `${baseUrl}/${link.shortCode.replace(/^\//, '')}`;

  useEffect(() => {
    let ignore = false;
    setIsGenerating(true);

    const qrOptions = {
      margin: 1.5,
      errorCorrectionLevel: 'M' as const,
      color: {
        dark: '#1A2621',
        light: '#FFFFFF',
      },
    };

    Promise.all([
      QRCode.toString(fullShortUrl, { ...qrOptions, type: 'svg' }),
      QRCode.toDataURL(fullShortUrl, { ...qrOptions, width: 1024 }),
    ])
      .then(([svg, png]) => {
        if (!ignore) {
          setSvgString(svg);
          setPngDataUrl(png);
          setIsGenerating(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setIsGenerating(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [fullShortUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShortUrl);
    setHasCopied(true);
    toast('Short URL copied to clipboard', 'success');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    if (!pngDataUrl) return;
    setIsDownloadingPng(true);
    try {
      const a = document.createElement('a');
      a.href = pngDataUrl;
      a.download = `qr-${link.shortCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast('PNG downloaded (1024x1024)', 'success');
    } catch {
      toast('Failed to download PNG', 'error');
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    setIsDownloadingSvg(true);
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `qr-${link.shortCode}.svg`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast('Vector SVG downloaded', 'success');
    } catch {
      toast('Failed to download SVG', 'error');
    } finally {
      setIsDownloadingSvg(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E5EAE7] hover:border-[#88D4BE] transition-all shadow-xs flex flex-col justify-between">
      <div>
        {/* Top: Short URL + Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-sm text-[#1A2621] truncate">
              /{link.shortCode}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 text-stone-400 hover:text-[#236B56] transition-colors cursor-pointer shrink-0"
              title="Copy Short URL"
            >
              {hasCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              link.status === 'active' || link.status === undefined
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-stone-100 text-stone-500'
            }`}
          >
            {link.status === 'disabled' ? 'Disabled' : 'Active'}
          </span>
        </div>

        {/* Destination preview */}
        <p className="text-xs text-[#61726A] truncate mb-4" title={link.originalUrl}>
          Destination: {link.originalUrl}
        </p>

        {/* QR Code Container */}
        <div className="w-full aspect-square bg-[#F4F5F3] rounded-xl border border-[#E5EAE7] flex items-center justify-center p-4 relative overflow-hidden group">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center text-xs text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#236B56] mb-2" />
              <span>Generating QR...</span>
            </div>
          ) : svgString ? (
            <div
              className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-[200px] [&>svg]:max-h-[200px] transition-transform duration-200 group-hover:scale-105"
              dangerouslySetInnerHTML={{ __html: svgString }}
            />
          ) : (
            <div className="text-xs text-stone-400 text-center">
              <QrCode className="w-8 h-8 mx-auto mb-1 text-stone-300" />
              Failed to generate
            </div>
          )}
        </div>

        {/* Metrics Row */}
        <div className="flex items-center justify-between text-xs text-[#61726A] mt-3">
          <span className="flex items-center gap-1 font-medium">
            <MousePointerClick className="w-3.5 h-3.5 text-[#236B56]" />
            <span>{link.clickCount ?? 0} clicks</span>
          </span>
          <a
            href={link.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1A2621] inline-flex items-center gap-1 text-[11px]"
          >
            <span>Visit Link</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 mt-4 border-t border-[#E5EAE7]/70 flex items-center gap-2">
        <button
          onClick={handleDownloadPng}
          disabled={!pngDataUrl || isDownloadingPng}
          className="flex-1 inline-flex items-center justify-center gap-1 h-8 px-2.5 bg-[#236B56] hover:bg-[#1C5745] text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {isDownloadingPng ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>PNG</span>
        </button>

        <button
          onClick={handleDownloadSvg}
          disabled={!svgString || isDownloadingSvg}
          className="inline-flex items-center justify-center gap-1 h-8 px-3 bg-white hover:bg-[#EBF5F1] text-[#236B56] border border-[#236B56]/30 rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          title="Download vector SVG"
        >
          <span>SVG</span>
        </button>

        <Link
          href={`/dashboard/links/${link.id}`}
          className="p-1.5 text-stone-500 hover:text-[#236B56] hover:bg-[#EBF5F1] rounded-lg transition-colors"
          title="View Link Analytics"
        >
          <BarChart2 className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function QrCodesPage() {
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState(() => getShortBaseUrl());

  useEffect(() => {
    setBaseUrl(getShortBaseUrl());
  }, []);

  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getLinks({ limit: 100 });
      setLinks(res.items);
    } catch (err) {
      toast('Failed to load links for QR generation', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const filteredLinks = links.filter((l) => {
    const matchesSearch =
      l.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      l.originalUrl.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && l.status !== 'disabled') ||
      (statusFilter === 'disabled' && l.status === 'disabled');
    return matchesSearch && matchesStatus;
  });

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
        {/* Header */}
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
                  QR Codes
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF5F1] text-[#236B56] border border-[#88D4BE]/30">
                  {links.length} {links.length === 1 ? 'Link' : 'Links'}
                </span>
              </div>
              <p className="text-xs text-[#61726A] mt-0.5">
                Instant high-resolution QR codes for all your shortened URLs with PNG and vector SVG export
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-end">
            <div className="relative flex-1 md:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search short code or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-xs rounded-full border border-[#E5EAE7] bg-white text-[#1A2621] placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#236B56]/20 transition-all shadow-xs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 text-xs px-3 rounded-full border border-[#E5EAE7] bg-white text-[#1A2621] font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#236B56]/20 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-[#236B56] hover:bg-[#1C5745] active:bg-[#154637] text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Link</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-5 border border-[#E5EAE7] animate-pulse h-80" />
              ))}
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-[#E5EAE7] text-center flex flex-col items-center justify-center max-w-lg mx-auto mt-8 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF5F1] text-[#236B56] flex items-center justify-center mb-4">
                <QrCode className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-[#1A2621]">
                {search || statusFilter !== 'all' ? 'No matching links found' : 'No short links available'}
              </h2>
              <p className="text-xs text-[#61726A] mt-1.5 max-w-sm">
                {search || statusFilter !== 'all'
                  ? 'Try changing your search terms or status filter.'
                  : 'Create a short link first to generate high-resolution QR codes ready for print and digital media.'}
              </p>
              {!search && statusFilter === 'all' && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-5 inline-flex items-center gap-1.5 h-9 px-5 bg-[#236B56] hover:bg-[#1C5745] text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Link</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredLinks.map((link) => (
                <QRCard key={link.id} link={link} baseUrl={baseUrl} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateLinkDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchLinks}
      />
    </div>
  );
}
