'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  Link2,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { createLink } from '@/lib/api/links';
import type { Link as LinkItem } from '@/lib/api/links';
import { getShortBaseUrl } from '@/lib/utils/url';

interface CreateLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkCreated?: (newLink: LinkItem) => void;
}

export function CreateLinkDialog({ isOpen, onClose, onLinkCreated }: CreateLinkDialogProps) {
  const [baseUrl, setBaseUrl] = useState(() => getShortBaseUrl());

  useEffect(() => {
    setBaseUrl(getShortBaseUrl());
  }, []);

  const [destination, setDestination] = useState('');
  const [alias, setAlias] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<LinkItem | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const { toast } = useToast();

  const handleClose = () => {
    setDestination('');
    setAlias('');
    setError(null);
    setCreatedLink(null);
    setHasCopied(false);
    onClose();
  };

  // Helper to normalize input URL automatically (Error Prevention)
  const normalizeUrl = (rawUrl: string): string => {
    let trimmed = rawUrl.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleDestinationBlur = () => {
    if (destination.trim() && !/^https?:\/\//i.test(destination.trim())) {
      setDestination(`https://${destination.trim()}`);
    }
  };

  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize alias: lowercase, allow alphanumerics, hyphens, and underscores
    const val = e.target.value.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
    setAlias(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validUrl = normalizeUrl(destination);
    if (!validUrl) {
      setError('Please enter a destination URL');
      return;
    }

    try {
      setIsSubmitting(true);
      const newLink = await createLink({
        originalUrl: validUrl,
        shortCode: alias.trim() ? alias.trim().replace(/^\//, '') : undefined,
      });

      setCreatedLink(newLink);
      onLinkCreated?.(newLink);
      toast('Short link generated successfully!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create short link';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fullShortUrl = createdLink
    ? `${baseUrl}/${createdLink.shortCode.replace(/^\//, '')}`
    : '';

  const handleCopy = () => {
    if (!fullShortUrl) return;
    navigator.clipboard.writeText(fullShortUrl).then(() => {
      setHasCopied(true);
      toast('Copied to clipboard!', 'success');
      setTimeout(() => setHasCopied(false), 2500);
    });
  };

  const handleCreateAnother = () => {
    setDestination('');
    setAlias('');
    setError(null);
    setCreatedLink(null);
    setHasCopied(false);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={createdLink ? 'Link Created!' : 'Create Short Link'}
      description={
        createdLink
          ? 'Your link is ready to share and tracking clicks'
          : 'Transform long URLs into clean, trackable links'
      }
    >
      {/* ─── Peak-End Rule: Satisfying Success Screen ─── */}
      {createdLink ? (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Success Banner */}
          <div className="p-4 rounded-2xl bg-[#EBF5F1] border border-emerald-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#236B56] text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1A2621]">Your short link is active</p>
              <p className="text-[11px] text-[#61726A] truncate max-w-[260px]">
                Redirects to: {createdLink.originalUrl}
              </p>
            </div>
          </div>

          {/* Generated URL Card with 1-Click Copy */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
            <label className="text-[11px] font-semibold text-[#61726A] uppercase tracking-wider block">
              Generated Short Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullShortUrl}
                className="flex-1 bg-[#F4F5F3] px-3.5 py-2 rounded-xl text-sm font-bold text-[#236B56] border border-stone-200/60 select-all focus:outline-none"
              />
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleCopy}
                className="gap-1.5 px-4 font-semibold text-xs shrink-0"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Actions (Test & Done) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-100">
            <a
              href={fullShortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#236B56] hover:text-[#1C5745] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Test redirect in new tab</span>
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleCreateAnother}
                className="text-xs gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-stone-500" />
                <span>Create Another</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleClose}
                className="text-xs px-5 font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Form Creation Screen ─── */
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium"
            >
              {error}
            </div>
          )}

          {/* Destination URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="create-destination" className="text-xs font-semibold text-[#1A2621]">
                Destination URL <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-stone-400">e.g. google.com or https://...</span>
            </div>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                id="create-destination"
                type="text"
                required
                placeholder="https://example.com/very-long-url-path"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onBlur={handleDestinationBlur}
                className="pl-10"
                error={Boolean(error && !destination.trim())}
              />
            </div>
          </div>

          {/* Custom Alias with Live Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="create-alias" className="text-xs font-semibold text-[#1A2621]">
                Custom alias <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <span className="text-[11px] text-stone-400">Letters, numbers, hyphens</span>
            </div>
            <div className="flex items-center">
              <span className="h-10 px-3.5 flex items-center bg-[#F4F5F3] border border-r-0 border-stone-200 rounded-l-full text-xs font-semibold text-stone-500 select-none">
                link.ly/
              </span>
              <Input
                id="create-alias"
                type="text"
                placeholder="promo-2026"
                value={alias}
                onChange={handleAliasChange}
                maxLength={40}
                className="rounded-l-none"
              />
            </div>
            {alias.trim() && (
              <p className="text-[11px] text-[#236B56] font-medium flex items-center gap-1 pl-1">
                <span>Preview:</span>
                <span className="font-bold underline">link.ly/{alias.trim()}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || !destination.trim()}
              className="text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Shortening…' : 'Create Short Link'}</span>
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
