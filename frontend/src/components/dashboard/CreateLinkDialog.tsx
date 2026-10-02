'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Link2, Sparkles } from 'lucide-react';
import { createLink } from '@/lib/api/links';
import type { Link as LinkItem } from '@/lib/api/links';

interface CreateLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkCreated?: (newLink: LinkItem) => void;
}

export function CreateLinkDialog({ isOpen, onClose, onLinkCreated }: CreateLinkDialogProps) {
  const [destination, setDestination] = useState('');
  const [alias, setAlias] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const handleClose = () => {
    setDestination('');
    setAlias('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!destination.trim()) {
      setError('Please provide a destination URL');
      return;
    }

    try {
      setIsSubmitting(true);
      const newLink = await createLink({
        originalUrl: destination.trim(),
        shortCode: alias.trim() ? alias.trim().replace(/^\//, '') : undefined,
      });

      onLinkCreated?.(newLink);
      toast(`Short link created: /${newLink.shortCode}`, 'success');
      handleClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create short link';
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
      title="Create Short Link"
      description="Enter the target URL and optional custom alias"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Destination URL */}
        <div className="space-y-1.5">
          <label htmlFor="create-destination" className="text-xs font-semibold text-[#1A2621] block">
            Destination URL <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              id="create-destination"
              type="url"
              required
              placeholder="https://example.com/very-long-url-path"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Custom Alias */}
        <div className="space-y-1.5">
          <label htmlFor="create-alias" className="text-xs font-semibold text-[#1A2621] block">
            Custom alias <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <div className="flex items-center">
            <span className="h-10 px-3.5 flex items-center bg-[#F4F5F3] border border-r-0 border-stone-200 rounded-l-full text-xs font-semibold text-stone-500">
              link.ly/
            </span>
            <Input
              id="create-alias"
              type="text"
              placeholder="my-link"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
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
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Creating...' : 'Create Link'}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
