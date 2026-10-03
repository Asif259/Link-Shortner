'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CreateLinkDialog } from '@/components/dashboard/CreateLinkDialog';
import { QRCodeDialog } from '@/components/dashboard/links/QRCodeDialog';
import { useToast } from '@/components/ui/toast';
import {
  getGroup,
  updateGroup,
  deleteGroup,
  addLinkToGroup,
  removeLinkFromGroup,
} from '@/lib/api/groups';
import type { GroupDetailResponse, GroupDetailLink } from '@/lib/api/groups';
import { getLinks } from '@/lib/api/links';
import type { Link as LinkItem } from '@/lib/api/links';
import { formatShortUrl } from '@/lib/utils/url';
import {
  ChevronLeft,
  Folder,
  Edit2,
  Trash2,
  Plus,
  Link as LinkIcon,
  MousePointerClick,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  BarChart2,
  Loader2,
  Menu,
  X,
  AlertCircle,
  Unlink,
  Layers,
} from 'lucide-react';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const groupId = params.id as string;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [group, setGroup] = useState<GroupDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Edit group state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete group state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Link dialogs
  const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false);
  const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);
  const [allUserLinks, setAllUserLinks] = useState<LinkItem[]>([]);
  const [selectedExistingLinkId, setSelectedExistingLinkId] = useState<string>('');
  const [isAddingLink, setIsAddingLink] = useState(false);

  // QR Code dialog
  const [qrLink, setQrLink] = useState<LinkItem | null>(null);

  // Remove link confirmation
  const [linkToRemove, setLinkToRemove] = useState<GroupDetailLink | null>(null);
  const [isRemovingLink, setIsRemovingLink] = useState(false);

  const fetchGroupData = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getGroup(groupId);
      setGroup(data);
      setEditName(data.name);
      setEditDesc(data.description || '');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load group details';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, toast]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  // Load user links when opening "Add Existing Link" dialog
  const handleOpenAddExisting = async () => {
    try {
      const res = await getLinks({ limit: 100 });
      // Filter out links that are already in this group
      const existingIds = new Set(group?.links.map((l) => l.id) || []);
      const available = res.items.filter((l) => !existingIds.has(l.id));
      setAllUserLinks(available);
      if (available.length > 0) {
        setSelectedExistingLinkId(available[0].id);
      }
      setIsAddExistingOpen(true);
    } catch (err) {
      toast('Failed to load available links', 'error');
    }
  };

  const handleAddExistingLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExistingLinkId) return;
    setIsAddingLink(true);
    try {
      await addLinkToGroup(groupId, selectedExistingLinkId);
      toast('Link added to group successfully', 'success');
      setIsAddExistingOpen(false);
      fetchGroupData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add link to group', 'error');
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleRemoveLink = async () => {
    if (!linkToRemove) return;
    setIsRemovingLink(true);
    try {
      await removeLinkFromGroup(groupId, linkToRemove.id);
      toast('Link removed from group', 'success');
      setLinkToRemove(null);
      fetchGroupData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove link from group', 'error');
    } finally {
      setIsRemovingLink(false);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsUpdating(true);
    try {
      await updateGroup(groupId, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      toast('Group updated successfully', 'success');
      setIsEditOpen(false);
      fetchGroupData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update group', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    setIsDeleting(true);
    try {
      await deleteGroup(groupId);
      toast('Group deleted successfully. Associated links were preserved.', 'success');
      router.push('/dashboard/groups');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete group', 'error');
      setIsDeleting(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(formatShortUrl(code));
    setCopiedCode(code);
    toast('Short URL copied to clipboard', 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
        {/* Top Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-5 px-6 md:px-8 border-b border-[#E5EAE7] bg-[#F4F5F3] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-stone-600 hover:text-stone-900 lg:hidden cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              href="/dashboard/groups"
              className="p-2 text-stone-500 hover:text-[#236B56] hover:bg-[#EBF5F1] rounded-full transition-colors cursor-pointer mr-1"
              title="Back to Groups"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold text-[#1A2621] tracking-tight">
                  {isLoading ? 'Loading group...' : group?.name}
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF5F1] text-[#236B56] border border-[#88D4BE]/30">
                  {group?.links.length ?? 0} {group?.links.length === 1 ? 'link' : 'links'}
                </span>
              </div>
              <p className="text-xs text-[#61726A] mt-0.5">
                {group?.description || 'Campaign group collection'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-end">
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white text-[#1A2621] hover:bg-[#EBF5F1] hover:text-[#236B56] border border-[#E5EAE7] rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white text-red-600 hover:bg-red-50 border border-red-200 rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              onClick={handleOpenAddExisting}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white text-[#236B56] hover:bg-[#EBF5F1] border border-[#236B56]/30 rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Add Existing Link</span>
            </button>

            <button
              onClick={() => setIsCreateLinkOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#236B56] hover:bg-[#1C5745] text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Link</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchGroupData}
                className="font-semibold underline hover:no-underline cursor-pointer ml-3"
              >
                Retry
              </button>
            </div>
          )}

          {/* Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between text-[#61726A] text-xs font-medium">
                <span>Links in Group</span>
                <div className="w-7 h-7 rounded-lg bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                  <LinkIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1A2621] mt-2">
                {isLoading ? '...' : group?.links.length ?? 0}
              </div>
              <div className="text-[11px] text-[#61726A] mt-1">
                Active in this campaign collection
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between text-[#61726A] text-xs font-medium">
                <span>Group Total Clicks</span>
                <div className="w-7 h-7 rounded-lg bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                  <MousePointerClick className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1A2621] mt-2">
                {isLoading ? '...' : (group?.totalClicks ?? 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-[#61726A] mt-1">
                Combined click engagement
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5EAE7] shadow-xs">
              <div className="flex items-center justify-between text-[#61726A] text-xs font-medium">
                <span>Avg Clicks / Link</span>
                <div className="w-7 h-7 rounded-lg bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1A2621] mt-2">
                {isLoading
                  ? '...'
                  : group && group.links.length > 0
                  ? (group.totalClicks / group.links.length).toFixed(1)
                  : '0'}
              </div>
              <div className="text-[11px] text-[#61726A] mt-1">
                Performance per shortened URL
              </div>
            </div>
          </div>

          {/* Links Table inside this group */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5EAE7] shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-[#1A2621]">Group Links</h2>
                <p className="text-xs text-[#61726A] mt-0.5">
                  Manage links assigned to this group
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-xs text-stone-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#236B56]" />
                <span>Loading group links...</span>
              </div>
            ) : !group || group.links.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center bg-[#F4F5F3] rounded-xl border border-dashed border-[#E5EAE7]">
                <div className="w-12 h-12 rounded-xl bg-white text-[#236B56] flex items-center justify-center mb-3 shadow-xs">
                  <Folder className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#1A2621]">No links in this group yet</h3>
                <p className="text-xs text-[#61726A] mt-1 max-w-sm">
                  Add links to this group to monitor campaign metrics together or create a new short URL.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={handleOpenAddExisting}
                    className="inline-flex items-center gap-1.5 h-8 px-4 bg-white hover:bg-stone-50 border border-[#E5EAE7] text-[#1A2621] rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Add Existing Link</span>
                  </button>
                  <button
                    onClick={() => setIsCreateLinkOpen(true)}
                    className="inline-flex items-center gap-1.5 h-8 px-4 bg-[#236B56] hover:bg-[#1C5745] text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Link</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5EAE7] text-[#61726A]">
                      <th className="pb-3 font-semibold">Short URL</th>
                      <th className="pb-3 font-semibold">Destination URL</th>
                      <th className="pb-3 font-semibold text-center">Status</th>
                      <th className="pb-3 font-semibold text-right">Clicks</th>
                      <th className="pb-3 font-semibold text-right">Created</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EAE7]/60">
                    {group.links.map((link) => (
                      <tr key={link.id} className="hover:bg-[#F4F5F3]/50 transition-colors">
                        <td className="py-3 font-semibold text-[#1A2621]">
                          <div className="flex items-center gap-2">
                            <span>/{link.shortCode}</span>
                            <button
                              onClick={() => handleCopy(link.shortCode)}
                              className="p-1 text-stone-400 hover:text-[#236B56] transition-colors cursor-pointer"
                              title="Copy Short URL"
                            >
                              {copiedCode === link.shortCode ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 text-[#61726A] max-w-xs truncate" title={link.originalUrl}>
                          <a
                            href={link.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-[#1A2621] inline-flex items-center gap-1"
                          >
                            <span>{link.originalUrl}</span>
                            <ExternalLink className="w-3 h-3 text-stone-400 shrink-0" />
                          </a>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              link.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {link.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-[#1A2621]">
                          {link.clickCount.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-[#61726A]">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                setQrLink({
                                  id: link.id,
                                  shortCode: link.shortCode,
                                  originalUrl: link.originalUrl,
                                  createdAt: link.createdAt,
                                  updatedAt: link.createdAt,
                                })
                              }
                              className="p-1.5 text-stone-500 hover:text-[#236B56] hover:bg-[#EBF5F1] rounded-lg transition-colors cursor-pointer"
                              title="QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/dashboard/links/${link.id}`}
                              className="p-1.5 text-stone-500 hover:text-[#236B56] hover:bg-[#EBF5F1] rounded-lg transition-colors"
                              title="Link Analytics"
                            >
                              <BarChart2 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setLinkToRemove(link)}
                              className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove from group"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Group Dialog */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Group"
        description="Update your group's name and description."
      >
        <form onSubmit={handleUpdateGroup} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#1A2621] mb-1.5">
              Group Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Social Media Campaign 2026"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-xs h-10"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A2621] mb-1.5">
              Description <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of links belonging to this group..."
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-[#E5EAE7] bg-white text-[#1A2621] placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#236B56]/20 transition-all resize-none"
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5EAE7]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="text-xs h-9 rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || !editName.trim()}
              className="bg-[#236B56] hover:bg-[#1C5745] text-white text-xs h-9 rounded-full px-5 font-semibold"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Group Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Group"
        description={`Are you sure you want to delete "${group?.name}"? The links inside will NOT be deleted; they will simply become ungrouped.`}
        confirmLabel="Delete Group"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteGroup}
        onClose={() => setIsDeleteOpen(false)}
      />

      {/* Add Existing Link Dialog */}
      <Dialog
        isOpen={isAddExistingOpen}
        onClose={() => setIsAddExistingOpen(false)}
        title="Add Existing Link to Group"
        description="Select an existing link to assign it to this group."
      >
        <form onSubmit={handleAddExistingLink} className="space-y-4 pt-2">
          {allUserLinks.length === 0 ? (
            <p className="text-xs text-stone-500 py-3">
              All your links are already in this group, or you have not created any links yet.
            </p>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#1A2621] mb-1.5">
                Choose Link
              </label>
              <select
                value={selectedExistingLinkId}
                onChange={(e) => setSelectedExistingLinkId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5EAE7] bg-white text-[#1A2621] focus:outline-hidden focus:ring-2 focus:ring-[#236B56]/20 cursor-pointer"
              >
                {allUserLinks.map((l) => (
                  <option key={l.id} value={l.id}>
                    /{l.shortCode} — {l.originalUrl.replace(/^https?:\/\//, '').slice(0, 45)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5EAE7]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddExistingOpen(false)}
              className="text-xs h-9 rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isAddingLink || allUserLinks.length === 0}
              className="bg-[#236B56] hover:bg-[#1C5745] text-white text-xs h-9 rounded-full px-5 font-semibold"
            >
              {isAddingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Add to Group
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Create Link Dialog preassigned to this group */}
      <CreateLinkDialog
        isOpen={isCreateLinkOpen}
        onClose={() => setIsCreateLinkOpen(false)}
        onSuccess={fetchGroupData}
        defaultGroupId={groupId}
      />

      {/* QR Code Dialog */}
      <QRCodeDialog
        isOpen={Boolean(qrLink)}
        onClose={() => setQrLink(null)}
        link={qrLink}
      />

      {/* Remove Link Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(linkToRemove)}
        title="Remove Link from Group"
        description={`Are you sure you want to remove "/${linkToRemove?.shortCode}" from "${group?.name}"? The link will remain active in your account.`}
        confirmLabel="Remove Link"
        cancelLabel="Cancel"
        isDestructive={false}
        isLoading={isRemovingLink}
        onConfirm={handleRemoveLink}
        onClose={() => setLinkToRemove(null)}
      />
    </div>
  );
}
