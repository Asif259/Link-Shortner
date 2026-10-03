'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/lib/stores/auth.store';
import {
  updateProfile,
  changePassword,
  deleteAccount,
} from '@/lib/api/users';
import {
  User as UserIcon,
  Lock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Menu,
  X,
  Eye,
  EyeOff,
  ShieldAlert,
  Sliders,
  LogOut,
  Laptop,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'security' | 'preferences' | 'account';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile Form state
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preferences state
  const [defaultRange, setDefaultRange] = useState('30d');
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });
  const [savedPrefs, setSavedPrefs] = useState(false);

  // Account Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationPassword, setDeleteConfirmationPassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeletePass, setShowDeletePass] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    const storedRange = localStorage.getItem('linkly_default_range');
    if (storedRange) setDefaultRange(storedRange);
  }, []);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('linkly_default_range', defaultRange);
    setSavedPrefs(true);
    toast('Preferences saved successfully', 'success');
    setTimeout(() => setSavedPrefs(false), 2500);
  };

  // ── Profile update handler ──────────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      toast('Display name cannot be empty', 'error');
      return;
    }
    if (trimmed.length < 2) {
      toast('Display name must be at least 2 characters', 'error');
      return;
    }
    if (trimmed.length > 100) {
      toast('Display name must be at most 100 characters', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updated = await updateProfile({ name: trimmed });
      updateUser({ name: updated.name });
      toast('Profile updated successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // ── Password change handler ─────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast('Please enter your current password', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast('New password must be at least 8 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('New password and confirmation do not match', 'error');
      return;
    }
    if (currentPassword === newPassword) {
      toast('New password must be different from current password', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword({ currentPassword, newPassword });
      toast(res.message || 'Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ── Account deletion handler ────────────────────────────────────────
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteConfirmationPassword) {
      toast('Password is required to confirm account deletion', 'error');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccount({ password: deleteConfirmationPassword });
      setIsDeleteModalOpen(false);
      logout();
      toast('Account and all associated links deleted successfully', 'success');
      router.push('/login');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete account', 'error');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="w-full max-w-[1520px] h-[100vh] min-h-[720px] bg-white flex overflow-hidden relative">
      {/* Desktop Sidebar */}
      <Sidebar currentTab="Settings" className="hidden lg:flex" />

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar
            currentTab="Settings"
            onTabChange={() => setMobileMenuOpen(false)}
            className="relative z-10 w-64 h-full"
          />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-3 text-white self-start ml-2 mt-4 z-20"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#F4F5F3] overflow-hidden">
        {/* Mobile Top Navbar */}
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
        </div>

        {/* Scrollable Settings Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
          {/* Header Title */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1A2621]">
              Account Settings
            </h1>
            <p className="text-xs text-[#61726A] mt-1">
              Manage your personal profile, security credentials, preferences, and account lifecycle
            </p>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-200/60 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'profile'
                  ? 'bg-white text-[#1A2621] shadow-xs'
                  : 'text-stone-600 hover:text-[#1A2621]'
              )}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'security'
                  ? 'bg-white text-[#1A2621] shadow-xs'
                  : 'text-stone-600 hover:text-[#1A2621]'
              )}
            >
              Security
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'preferences'
                  ? 'bg-white text-[#1A2621] shadow-xs'
                  : 'text-stone-600 hover:text-[#1A2621]'
              )}
            >
              Preferences
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'account'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-stone-600 hover:text-rose-600'
              )}
            >
              Account
            </button>
          </div>

          {/* ─── Profile Tab ─── */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/60 shadow-2xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                <div className="w-9 h-9 rounded-xl bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#1A2621]">Profile Details</h2>
                  <p className="text-xs text-[#61726A]">Your identification on Linkly</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label
                    htmlFor="displayNameInput"
                    className="block text-xs font-semibold text-[#1A2621] mb-1.5"
                  >
                    Display Name
                  </label>
                  <Input
                    id="displayNameInput"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                    required
                    maxLength={100}
                    className="max-w-md"
                  />
                </div>

                <div>
                  <label
                    htmlFor="emailInput"
                    className="block text-xs font-semibold text-[#1A2621] mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 max-w-md">
                    <Input
                      id="emailInput"
                      value={user?.email ?? ''}
                      disabled
                      readOnly
                      className="bg-stone-50 text-stone-500 cursor-not-allowed border-stone-200"
                    />
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-semibold shrink-0 border border-emerald-200/60">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Primary email used for account authentication and reports
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isUpdatingProfile || displayName.trim() === (user?.name ?? '')}
                    className="gap-2 text-xs font-semibold"
                  >
                    {isUpdatingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile'}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ─── Security Tab ─── */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/60 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                  <div className="w-9 h-9 rounded-xl bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#1A2621]">Change Password</h2>
                    <p className="text-xs text-[#61726A]">
                      Update your login password regularly for account security
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label
                      htmlFor="currentPasswordInput"
                      className="block text-xs font-semibold text-[#1A2621] mb-1.5"
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        id="currentPasswordInput"
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        aria-label={showCurrentPass ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="newPasswordInput"
                      className="block text-xs font-semibold text-[#1A2621] mb-1.5"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="newPasswordInput"
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        aria-label={showNewPass ? 'Hide password' : 'Show password'}
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPasswordInput"
                      className="block text-xs font-semibold text-[#1A2621] mb-1.5"
                    >
                      Confirm New Password
                    </label>
                    <Input
                      id="confirmPasswordInput"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                      className="gap-2 text-xs font-semibold"
                    >
                      {isChangingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
                    </Button>
                  </div>
                </form>
              </div>

              {/* Active Session & Logout */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/60 shadow-2xs space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#1A2621]">Session Management</h2>
                    <p className="text-xs text-[#61726A]">Your current authenticated login session</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[#F4F5F3] border border-stone-200/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[#1A2621] flex items-center gap-2">
                      <span>Current Active Session</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </p>
                    <p className="text-[11px] text-[#61726A]">
                      Authenticated via JWT Token & Zustand store
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="text-xs gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Preferences Tab ─── */}
          {activeTab === 'preferences' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/60 shadow-2xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                <div className="w-9 h-9 rounded-xl bg-[#EBF5F1] text-[#236B56] flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#1A2621]">Dashboard Preferences</h2>
                  <p className="text-xs text-[#61726A]">Customize default metrics and display settings</p>
                </div>
              </div>

              <form onSubmit={handleSavePreferences} className="space-y-5 max-w-md">
                <div>
                  <label
                    htmlFor="defaultRangeSelect"
                    className="block text-xs font-semibold text-[#1A2621] mb-1.5"
                  >
                    Default Analytics Date Range
                  </label>
                  <select
                    id="defaultRangeSelect"
                    value={defaultRange}
                    onChange={(e) => setDefaultRange(e.target.value)}
                    className="w-full h-10 px-3.5 text-xs rounded-full border border-stone-200 bg-white text-[#1A2621] focus:outline-hidden focus:ring-2 focus:ring-[#236B56]/20 cursor-pointer"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days (Recommended)</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All time</option>
                  </select>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Preselects this time window when opening the Analytics or Overview tab
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="timezoneDisplay"
                    className="block text-xs font-semibold text-[#1A2621] mb-1.5"
                  >
                    Detected Timezone
                  </label>
                  <Input
                    id="timezoneDisplay"
                    value={timezone}
                    readOnly
                    disabled
                    className="bg-stone-50 text-stone-600 border-stone-200"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Timestamps in analytics charts are automatically converted to your local time
                  </p>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="gap-2 text-xs font-semibold">
                    {savedPrefs ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Preferences Saved</span>
                      </>
                    ) : (
                      <span>Save Preferences</span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ─── Account / Danger Zone Tab ─── */}
          {activeTab === 'account' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-rose-200 shadow-2xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-rose-100">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-rose-950">Danger Zone</h2>
                  <p className="text-xs text-rose-600">Irreversible actions on your account and data</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="max-w-xl">
                  <h3 className="text-sm font-semibold text-[#1A2621]">Delete Account</h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Permanently remove your account and all associated data. All short links, link groups, redirect configurations, and historical click analytics will be completely erased.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="md"
                  onClick={() => {
                    setDeleteConfirmationPassword('');
                    setIsDeleteModalOpen(true);
                  }}
                  className="gap-2 shrink-0 text-xs font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Account Deletion Confirmation Modal */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeletingAccount && setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-950">This action is permanent and cannot be undone.</p>
              <p className="text-rose-700 leading-relaxed">
                All your shortened links, redirect routes, groups, QR codes, and click metrics will be immediately and irreversibly deleted.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="deletePasswordInput"
              className="block text-xs font-semibold text-[#1A2621] mb-1.5"
            >
              Please enter your password to confirm:
            </label>
            <div className="relative">
              <Input
                id="deletePasswordInput"
                type={showDeletePass ? 'text' : 'password'}
                value={deleteConfirmationPassword}
                onChange={(e) => setDeleteConfirmationPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowDeletePass(!showDeletePass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                aria-label={showDeletePass ? 'Hide password' : 'Show password'}
              >
                {showDeletePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeletingAccount}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="md"
              disabled={isDeletingAccount || !deleteConfirmationPassword}
              className="gap-2 text-xs font-semibold"
            >
              {isDeletingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isDeletingAccount ? 'Deleting Account...' : 'Permanently Delete'}</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
