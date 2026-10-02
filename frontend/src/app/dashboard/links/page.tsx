'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { LinksPageHeader } from '@/components/dashboard/links/LinksPageHeader';
import { LinkSearch } from '@/components/dashboard/links/LinkSearch';
import { LinkFilters, SortOption } from '@/components/dashboard/links/LinkFilters';
import { LinksTableRow } from '@/components/dashboard/links/LinksTableRow';
import { CreateLinkDialog } from '@/components/dashboard/CreateLinkDialog';
import { EditLinkDialog } from '@/components/dashboard/EditLinkDialog';
import { useToast } from '@/components/ui/toast';
import { getLinks, deleteLink, updateLink } from '@/lib/api/links';
import type { Link as LinkItem } from '@/lib/api/links';
import { Loader2, Menu, X, LinkIcon } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_SHORT_URL || 'http://localhost:3000';

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editLink, setEditLink] = useState<LinkItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
    const url = `${BASE_URL}/${link.shortCode}`;
    navigator.clipboard.writeText(url).then(() => {
      toast('Copied to clipboard!', 'success');
    });
  };

  const handleDelete = async (link: LinkItem) => {
    if (deleteConfirm !== link.id) {
      setDeleteConfirm(link.id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      toast('Click delete again to confirm', 'error');
      return;
    }
    try {
      await deleteLink(link.id);
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
      toast('Link deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDisable = async (link: LinkItem) => {
    const newStatus = link.status === 'disabled' ? 'active' : 'disabled';
    try {
      const updated = await updateLink(link.id, { status: newStatus });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
      toast(`Link ${newStatus === 'disabled' ? 'disabled' : 'enabled'}`, 'success');
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

  // Client-side status filter (status isn't persisted to DB yet, so filter locally)
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
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#F4F5F3] overflow-hidden">
        {/* Mobile Top Bar */}
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

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <LinksPageHeader
            onOpenCreate={() => setIsCreateOpen(true)}
            totalCount={filteredLinks.length}
          />

          {/* Search + Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <LinkSearch value={search} onChange={setSearch} />
            <LinkFilters
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-24 text-stone-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm font-medium">Loading links…</span>
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-stone-400">
                <LinkIcon className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">
                  {search ? 'No links match your search' : 'No links yet — create your first one!'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="My Links">
                  <thead>
                    <tr className="border-b border-stone-100 bg-[#F4F5F3]/60">
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
                          // TODO: navigate to analytics detail for this link
                        }}
                        onEdit={(l) => setEditLink(l)}
                        onDisable={handleDisable}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Dialog */}
      <CreateLinkDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onLinkCreated={handleLinkCreated}
      />

      {/* Edit Dialog */}
      <EditLinkDialog
        link={editLink}
        isOpen={editLink !== null}
        onClose={() => setEditLink(null)}
        onLinkUpdated={handleLinkUpdated}
      />
    </div>
  );
}
