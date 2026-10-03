'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { LinksPageHeader } from '@/components/dashboard/links/LinksPageHeader';
import { LinkSearch } from '@/components/dashboard/links/LinkSearch';
import { LinkFilters, SortOption } from '@/components/dashboard/links/LinkFilters';
import { LinksTableRow } from '@/components/dashboard/links/LinksTableRow';
import { CreateLinkDialog } from '@/components/dashboard/CreateLinkDialog';
import { EditLinkDialog } from '@/components/dashboard/EditLinkDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useToast } from '@/components/ui/toast';
import { getLinks, deleteLink, updateLink } from '@/lib/api/links';
import type { Link as LinkItem } from '@/lib/api/links';
import { Loader2, Menu, X, LinkIcon, Sparkles, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_SHORT_URL || 'http://localhost:3000';

export default function LinksPage() {
  const router = useRouter();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editLink, setEditLink] = useState<LinkItem | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<LinkItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { toast } = useToast();

  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getLinks({ search, status: statusFilter, sort: sortBy });
      setLinks(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load links';
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, sortBy, toast]);

  useEffect(() => {
    const t = setTimeout(fetchLinks, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchLinks, search]);

  const handleCopy = (link: LinkItem) => {
    const url = `${BASE_URL}/${link.shortCode.replace(/^\//, '')}`;
    navigator.clipboard.writeText(url).then(() => {
      toast('Copied to clipboard!', 'success');
    });
  };

  const handleConfirmDelete = async () => {
    if (!linkToDelete) return;
    try {
      setIsDeleting(true);
      await deleteLink(linkToDelete.id);
      setLinks((prev) => prev.filter((l) => l.id !== linkToDelete.id));
      toast(`Link /${linkToDelete.shortCode} deleted`, 'success');
      setLinkToDelete(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDisable = async (link: LinkItem) => {
    const newStatus = link.status === 'disabled' ? 'active' : 'disabled';
    try {
      const updated = await updateLink(link.id, { status: newStatus });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
      toast(`Link is now ${newStatus}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  const handleLinkCreated = (newLink: LinkItem) => {
    setLinks((prev) => [newLink, ...prev]);
  };

  const handleLinkUpdated = (updated: LinkItem) => {
    setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const filteredLinks =
    statusFilter === 'all'
      ? links
      : links.filter((l) => (l.status || 'active') === statusFilter);

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
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#F4F5F3] overflow-hidden">
        {/* Mobile Top Header */}
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
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-1.5 bg-white text-[#236B56] rounded-full text-xs font-semibold shadow-xs"
          >
            + Create Link
          </button>
        </div>

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <LinksPageHeader
            onOpenCreate={() => setIsCreateOpen(true)}
            totalCount={filteredLinks.length}
          />

          {/* Search + Filters (Grouped per Miller's Law) */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <LinkSearch value={search} onChange={setSearch} />
            <LinkFilters
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          {/* Table Container Card */}
          <div className="bg-white rounded-2xl border border-stone-200/70 shadow-xs overflow-hidden">
            {isLoading ? (
              /* Principle 6: Skeleton loading instead of generic spinner */
              <div>
                <div className="border-b border-stone-100 bg-[#F4F5F3]/70 py-3 px-4 flex justify-between text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  <span>Loading short links…</span>
                </div>
                <TableSkeleton rows={6} />
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3.5 text-stone-400">
                <div className="w-14 h-14 rounded-2xl bg-[#EBF5F1] text-[#236B56] flex items-center justify-center shadow-xs">
                  <LinkIcon className="w-7 h-7" />
                </div>
                <div className="text-center max-w-sm">
                  <p className="text-sm font-semibold text-[#1A2621]">
                    {search ? 'No matching links found' : 'No short links yet'}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    {search
                      ? 'Try adjusting your search terms or filters'
                      : 'Shorten your first destination URL to start collecting clicks and analytics.'}
                  </p>
                </div>
                {!search && (
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="mt-1 px-4 py-2 bg-[#236B56] text-white rounded-full text-xs font-semibold hover:bg-[#1C5745] transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create Your First Link</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="My Short Links">
                  <thead>
                    <tr className="border-b border-stone-100 bg-[#F4F5F3]/70">
                      <th className="py-3 px-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                        Short Link
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                        Destination
                      </th>
                      <th className="py-3 px-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wide">
                        Clicks
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                        Created
                      </th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-stone-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="py-3 px-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredLinks.map((link) => (
                      <LinksTableRow
                        key={link.id}
                        link={link}
                        baseUrl={BASE_URL}
                        onCopy={handleCopy}
                        onViewAnalytics={() => {
                          router.push('/dashboard');
                        }}
                        onEdit={(l) => setEditLink(l)}
                        onDisable={handleDisable}
                        onDelete={(l) => setLinkToDelete(l)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Thumb-reach Primary CTA (Principle 18) */}
      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#236B56] text-white rounded-full shadow-lg hover:bg-[#1C5745] active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-[#236B56]/30"
        aria-label="Create short link"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Create Link Dialog */}
      <CreateLinkDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onLinkCreated={handleLinkCreated}
      />

      {/* Edit Link Dialog */}
      <EditLinkDialog
        link={editLink}
        isOpen={editLink !== null}
        onClose={() => setEditLink(null)}
        onLinkUpdated={handleLinkUpdated}
      />

      {/* Delete Confirmation Modal (Error Prevention & Jakob's Law) */}
      <ConfirmDialog
        isOpen={linkToDelete !== null}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Short Link"
        description={`Are you sure you want to delete /${linkToDelete?.shortCode}? All click tracking history and redirect analytics will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete Link"
        cancelLabel="Keep Link"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
