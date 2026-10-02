'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Edit, Link2 } from 'lucide-react';
import { updateLink } from '@/lib/api/links';
import type { Link as LinkItem } from '@/lib/api/links';

interface EditLinkDialogProps {
  link: LinkItem | null;
  isOpen: boolean;
  onClose: () => void;
  onLinkUpdated?: (updatedLink: LinkItem) => void;
}

export function EditLinkDialog({ link, isOpen, onClose, onLinkUpdated }: EditLinkDialogProps) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Sync form when link changes
  useEffect(() => {
    if (link) {
      setOriginalUrl(link.originalUrl);
      setShortCode(link.shortCode);
      setError(null);
    }
  }, [link]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;
    setError(null);

    try {
      setIsSubmitting(true);
      const updated = await updateLink(link.id, {
        originalUrl: originalUrl.trim() || undefined,
        shortCode: shortCode.trim() !== link.shortCode ? shortCode.trim() : undefined,
      });

      onLinkUpdated?.(updated);
      toast('Link updated successfully', 'success');
      handleClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update link';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Link"
      description="Update the destination URL or short code"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Destination URL */}
        <div className="space-y-1.5">
          <label htmlFor="edit-destination" className="text-xs font-semibold text-[#1A2621] block">
            Destination URL
          </label>
          <div className="relative">
            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              id="edit-destination"
              type="url"
              required
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Short Code */}
        <div className="space-y-1.5">
          <label htmlFor="edit-shortcode" className="text-xs font-semibold text-[#1A2621] block">
            Short code
          </label>
          <div className="flex items-center">
            <span className="h-10 px-3.5 flex items-center bg-[#F4F5F3] border border-r-0 border-stone-200 rounded-l-full text-xs font-semibold text-stone-500">
              link.ly/
            </span>
            <Input
              id="edit-shortcode"
              type="text"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              className="rounded-l-none"
            />
          </div>
        </div>

        {/* Actions */}
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
            disabled={isSubmitting}
            className="text-xs font-semibold gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
