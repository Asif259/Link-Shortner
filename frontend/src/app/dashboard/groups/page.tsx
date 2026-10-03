'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from '@/lib/api/groups';
import type { GroupListItem } from '@/lib/api/groups';
import {
  Folder,
  FolderPlus,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  Link as LinkIcon,
  MousePointerClick,
  Calendar,
  Loader2,
  Menu,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function GroupsPage() {
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editingGroup, setEditingGroup] = useState<GroupListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [deletingGroup, setDeletingGroup] = useState<GroupListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load groups';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast('Group name cannot be empty', 'error');
      return;
    }
    setIsCreating(true);
    try {
      await createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || undefined,
      });
      toast('Group created successfully', 'success');
      setNewGroupName('');
      setNewGroupDesc('');
      setIsCreateOpen(false);
      fetchGroups();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create group', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (g: GroupListItem) => {
    setEditingGroup(g);
    setEditName(g.name);
    setEditDesc(g.description || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    if (!editName.trim()) {
      toast('Group name cannot be empty', 'error');
      return;
    }
    setIsUpdating(true);
    try {
      await updateGroup(editingGroup.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      toast('Group updated successfully', 'success');
      setEditingGroup(null);
      fetchGroups();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update group', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    setIsDeleting(true);
    try {
      await deleteGroup(deletingGroup.id);
      toast('Group deleted successfully. Associated links were preserved.', 'success');
      setDeletingGroup(null);
      fetchGroups();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete group', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const term = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(term) ||
      (g.description && g.description.toLowerCase().includes(term))
    );
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
                  Link Groups
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF5F1] text-[#236B56] border border-[#88D4BE]/30">
                  {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
                </span>
              </div>
              <p className="text-xs text-[#61726A] mt-0.5">
                Organize your short links into categorized folders, campaigns, and clients
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-xs rounded-full border border-[#E5EAE7] bg-white text-[#1A2621] placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#236B56]/20 transition-all shadow-xs"
              />
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-[#236B56] hover:bg-[#1C5745] active:bg-[#154637] text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Group</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchGroups}
                className="font-semibold underline hover:no-underline cursor-pointer ml-3"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-6 border border-[#E5EAE7] animate-pulse h-48" />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-[#E5EAE7] text-center flex flex-col items-center justify-center max-w-lg mx-auto mt-8 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF5F1] text-[#236B56] flex items-center justify-center mb-4">
                <FolderPlus className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-[#1A2621]">
                {search ? 'No matching groups found' : 'No groups yet'}
              </h2>
              <p className="text-xs text-[#61726A] mt-1.5 max-w-sm">
                {search
                  ? `No groups matched "${search}". Try searching for another keyword.`
                  : 'Organize your links by creating your first group to track campaign performance collaboratively.'}
              </p>
              {!search && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-5 inline-flex items-center gap-1.5 h-9 px-5 bg-[#236B56] hover:bg-[#1C5745] text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Group</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl p-5 border border-[#E5EAE7] hover:border-[#88D4BE] transition-all shadow-xs flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top: Icon & Action buttons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EBF5F1] text-[#236B56] flex items-center justify-center shrink-0">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(group)}
                          className="p-1.5 text-stone-400 hover:text-[#236B56] hover:bg-[#EBF5F1] rounded-lg transition-colors cursor-pointer"
                          title="Edit Group"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingGroup(group)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Group"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Group Title & Description */}
                    <div className="mt-3">
                      <Link
                        href={`/dashboard/groups/${group.id}`}
                        className="font-bold text-base text-[#1A2621] hover:text-[#236B56] transition-colors block tracking-tight line-clamp-1"
                      >
                        {group.name}
                      </Link>
                      <p className="text-xs text-[#61726A] mt-1 line-clamp-2 min-h-[32px]">
                        {group.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Stats Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EBF5F1] text-[#236B56] text-[11px] font-semibold">
                        <LinkIcon className="w-3 h-3" />
                        <span>{group.linkCount} {group.linkCount === 1 ? 'link' : 'links'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] font-semibold">
                        <MousePointerClick className="w-3 h-3" />
                        <span>{group.totalClicks.toLocaleString()} clicks</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Date & Navigate button */}
                  <div className="pt-4 mt-4 border-t border-[#E5EAE7]/70 flex items-center justify-between text-xs text-[#61726A]">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                    </div>

                    <Link
                      href={`/dashboard/groups/${group.id}`}
                      className="font-semibold text-xs text-[#236B56] hover:text-[#1C5745] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Manage Group</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Link Group"
        description="Organize your links by marketing campaign, client, or topic."
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#1A2621] mb-1.5">
              Group Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Social Media Campaign 2026"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
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
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-[#E5EAE7] bg-white text-[#1A2621] placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#236B56]/20 transition-all resize-none"
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5EAE7]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="text-xs h-9 rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !newGroupName.trim()}
              className="bg-[#236B56] hover:bg-[#1C5745] text-white text-xs h-9 rounded-full px-5 font-semibold"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Create Group
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog
        isOpen={Boolean(editingGroup)}
        onClose={() => setEditingGroup(null)}
        title="Edit Group"
        description="Update your group's name and description."
      >
        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
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
              onClick={() => setEditingGroup(null)}
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

      {/* Delete Group Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingGroup)}
        title="Delete Group"
        description={`Are you sure you want to delete "${deletingGroup?.name}"? The links inside this group will NOT be deleted; they will simply become ungrouped.`}
        confirmLabel="Delete Group"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeletingGroup(null)}
      />
    </div>
  );
}
