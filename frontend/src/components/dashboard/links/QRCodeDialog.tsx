'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  FileCode,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import QRCode from 'qrcode';
import { getShortBaseUrl } from '@/lib/utils/url';
import type { Link as LinkItem } from '@/lib/api/links';

export interface QRCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  link?: LinkItem | null;
  /** Direct URL fallback if using the dialog without a full LinkItem object */
  url?: string;
  /** Optional display title / slug fallback */
  title?: string;
  /** Optional base URL override (defaults to getShortBaseUrl()) */
  baseUrl?: string;
}

export function QRCodeDialog({
  isOpen,
  onClose,
  link,
  url: directUrl,
  title: customTitle,
  baseUrl: propBaseUrl,
}: QRCodeDialogProps) {
  const { toast } = useToast();

  const [svgString, setSvgString] = useState<string>('');
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [isDownloadingSvg, setIsDownloadingSvg] = useState(false);

  // Compute public short URL
  const resolvedBaseUrl = useMemo(() => {
    return propBaseUrl || getShortBaseUrl();
  }, [propBaseUrl]);

  const targetUrl = useMemo(() => {
    if (directUrl) return directUrl;
    if (link) {
      const cleanCode = link.shortCode.replace(/^\//, '');
      return `${resolvedBaseUrl}/${cleanCode}`;
    }
    return '';
  }, [directUrl, link, resolvedBaseUrl]);

  const slug = useMemo(() => {
    if (customTitle) return customTitle;
    if (link?.shortCode) return link.shortCode.replace(/^\//, '');
    try {
      if (targetUrl) {
        const parsed = new URL(targetUrl);
        return parsed.pathname.replace(/^\//, '') || 'shortlink';
      }
    } catch {
      // fallback
    }
    return 'shortlink';
  }, [customTitle, link, targetUrl]);

  // Derived loading state without cascading setState in effect
  const isGenerating = isOpen && Boolean(targetUrl) && !svgString && !error;

  // Generate QR code representations whenever target URL changes or user clicks retry
  useEffect(() => {
    let ignore = false;
    if (!isOpen || !targetUrl) {
      return;
    }

    const qrOptions = {
      margin: 2,
      errorCorrectionLevel: 'M' as const,
      color: {
        dark: '#1A2621',
        light: '#FFFFFF',
      },
    };

    Promise.all([
      QRCode.toString(targetUrl, {
        ...qrOptions,
        type: 'svg',
      }),
      QRCode.toDataURL(targetUrl, {
        ...qrOptions,
        width: 1024,
      }),
    ])
      .then(([svg, png]) => {
        if (!ignore) {
          setSvgString(svg);
          setPngDataUrl(png);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const message = err instanceof Error ? err.message : 'Failed to generate QR Code';
          setError(message);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, targetUrl, retryCount]);

  const handleRetry = () => {
    setSvgString('');
    setPngDataUrl('');
    setError(null);
    setRetryCount((c) => c + 1);
  };

  // Download handler for PNG
  const handleDownloadPng = () => {
    if (!pngDataUrl) return;
    try {
      setIsDownloadingPng(true);
      const linkEl = document.createElement('a');
      linkEl.href = pngDataUrl;
      linkEl.download = `qr-${slug || 'link'}.png`;
      document.body.appendChild(linkEl);
      linkEl.click();
      document.body.removeChild(linkEl);
      toast('PNG downloaded successfully!', 'success');
    } catch {
      toast('Could not download PNG', 'error');
    } finally {
      setTimeout(() => setIsDownloadingPng(false), 500);
    }
  };

  // Download handler for SVG
  const handleDownloadSvg = () => {
    if (!svgString) return;
    try {
      setIsDownloadingSvg(true);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const objectUrl = URL.createObjectURL(blob);
      const linkEl = document.createElement('a');
      linkEl.href = objectUrl;
      linkEl.download = `qr-${slug || 'link'}.svg`;
      document.body.appendChild(linkEl);
      linkEl.click();
      document.body.removeChild(linkEl);
      URL.revokeObjectURL(objectUrl);
      toast('SVG vector downloaded successfully!', 'success');
    } catch {
      toast('Could not download SVG', 'error');
    } finally {
      setTimeout(() => setIsDownloadingSvg(false), 500);
    }
  };

  // Copy Short URL to Clipboard
  const handleCopyUrl = () => {
    if (!targetUrl) return;
    navigator.clipboard.writeText(targetUrl).then(
      () => {
        setCopiedUrl(true);
        toast('Copied short link to clipboard!', 'success');
        setTimeout(() => setCopiedUrl(false), 2000);
      },
      () => {
        toast('Failed to copy to clipboard', 'error');
      }
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="QR Code"
      description={`Scan to instantly open /${slug}`}
    >
      <div className="space-y-4">
        {/* QR Code Graphic Card */}
        <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-[#F4F5F3] border border-[#E5EAE7] text-center">
          {isGenerating ? (
            <div className="w-56 h-56 flex flex-col items-center justify-center gap-3 bg-white rounded-xl shadow-xs border border-stone-200/60">
              <RefreshCw className="w-6 h-6 text-[#236B56] animate-spin" />
              <span className="text-xs font-medium text-stone-500">Generating QR code…</span>
            </div>
          ) : error ? (
            <div className="w-56 h-56 flex flex-col items-center justify-center gap-2.5 p-4 bg-white rounded-xl border border-rose-200 text-rose-700 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p className="text-xs font-semibold">Unable to create QR</p>
              <p className="text-[11px] text-stone-500 leading-tight">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="mt-1 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          ) : (
            <div className="relative group/preview">
              <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-stone-200/80 transition-transform duration-200 group-hover/preview:scale-[1.01]">
                {/* Render SVG directly for razor-sharp vector fidelity */}
                {svgString ? (
                  <div
                    className="w-52 h-52 sm:w-56 sm:h-56 [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                    dangerouslySetInnerHTML={{ __html: svgString }}
                    role="img"
                    aria-label={`QR Code for ${targetUrl}`}
                  />
                ) : pngDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pngDataUrl}
                    alt={`QR Code for ${targetUrl}`}
                    className="w-52 h-52 sm:w-56 sm:h-56 object-contain block"
                  />
                ) : null}
              </div>

              {/* Little scan indicator pill */}
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#61726A]">
                <QrCode className="w-3.5 h-3.5 text-[#236B56]" />
                <span>High-resolution scannable code</span>
              </div>
            </div>
          )}
        </div>

        {/* Public Short Link Preview & Quick Copy */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#1A2621]">Public Short Link</span>
            {link?.originalUrl && (
              <a
                href={link.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-[#236B56] hover:underline flex items-center gap-1 truncate max-w-[190px]"
                title={link.originalUrl}
              >
                <span>{link.originalUrl.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-white border border-stone-200">
            <LinkIcon className="w-3.5 h-3.5 text-[#236B56] shrink-0" />
            <span className="text-xs font-semibold text-[#1A2621] truncate flex-1 select-all">
              {targetUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1.5 rounded-lg text-stone-500 hover:text-[#236B56] hover:bg-[#EBF5F1] transition-colors cursor-pointer shrink-0"
              title="Copy short link"
              aria-label="Copy short link"
            >
              {copiedUrl ? (
                <Check className="w-3.5 h-3.5 text-[#236B56]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Download Actions (PNG + SVG) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 border-t border-stone-100">
          {/* PNG Download Button */}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleDownloadPng}
            disabled={!pngDataUrl || isGenerating || isDownloadingPng}
            className="w-full sm:flex-1 text-xs font-semibold gap-1.5"
            aria-label="Download QR code as PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingPng ? 'Downloading…' : 'Download PNG'}</span>
            <span className="text-[10px] opacity-75 font-normal ml-0.5">(Raster)</span>
          </Button>

          {/* SVG Download Button */}
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleDownloadSvg}
            disabled={!svgString || isGenerating || isDownloadingSvg}
            className="w-full sm:flex-1 text-xs font-semibold gap-1.5 hover:bg-[#EBF5F1] hover:text-[#236B56] hover:border-[#236B56]/40"
            aria-label="Download QR code as SVG"
          >
            <FileCode className="w-3.5 h-3.5 text-[#236B56]" />
            <span>{isDownloadingSvg ? 'Downloading…' : 'Download SVG'}</span>
            <span className="text-[10px] text-stone-400 font-normal ml-0.5">(Vector)</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
