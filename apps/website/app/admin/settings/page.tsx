'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Tag, X, Settings, Key, Shield, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { settings, users } from '@/lib/api-client';
import { useAuth, useApi } from '@/lib/use-api';
import { useBackendBlogEntries, useBackendFeaturedTags } from '@/lib/use-backend-entries';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { entries: allEntries } = useBackendBlogEntries();
  const { tags: featuredTagsFromApi, refetch: refetchFeaturedTags } = useBackendFeaturedTags();
  const { data: siteSettings } = useApi(() => settings.list(), []);
  const [featuredTags, setFeaturedTags] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const allTags = useMemo(() => {
    const set = new Set<string>();
    allEntries.forEach((e) => e.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [allEntries]);

  useEffect(() => {
    if (featuredTagsFromApi) {
      setFeaturedTags(featuredTagsFromApi);
    }
  }, [featuredTagsFromApi]);

  const toggleTag = (tag: string) => {
    setFeaturedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const saveFeaturedTags = async () => {
    try {
      await settings.updateFeaturedTags(featuredTags);
      await refetchFeaturedTags();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Failed to save featured tags');
    }
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters!');
      return;
    }
    if (!user?.id) {
      alert('User not loaded');
      return;
    }
    try {
      await users.update(user.id, { password: newPassword });
      alert('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      alert('Failed to update password');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pulse-black)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--neutral-600)]">Manage site settings, featured tags, and account security</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — Settings cards */}
        <div className="space-y-6 lg:col-span-2">
          {/* Featured Tags */}
          <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--pulse-red)]/10">
                <Sparkles className="h-4.5 w-4.5 text-[var(--pulse-red)]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--pulse-black)]">Featured Tags</h2>
                <p className="text-xs text-[var(--neutral-600)]">
                  {featuredTags.length} of {allTags.length} tags selected for blog filters
                </p>
              </div>
            </div>

            {allTags.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] p-8 text-center">
                <Tag className="mx-auto h-8 w-8 text-[var(--neutral-400)]" />
                <p className="mt-2 text-sm text-[var(--neutral-600)]">No tags found in published posts</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {allTags.map((tag) => {
                  const isSelected = featuredTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-[var(--pulse-red)] bg-[var(--pulse-red)] text-white shadow-sm'
                          : 'border-[var(--neutral-200)] bg-white text-[var(--neutral-600)] hover:border-[var(--pulse-red)]/40 hover:bg-[var(--pulse-red)]/5'
                      }`}
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      {isSelected && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-[var(--neutral-100)] pt-4">
              {saved && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved successfully
                </span>
              )}
              <button
                onClick={saveFeaturedTags}
                disabled={allTags.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--pulse-red)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--pulse-black)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save Featured Tags
              </button>
            </div>
          </div>

          {/* Site Settings */}
          <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Globe className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--pulse-black)]">Site Settings</h2>
                <p className="text-xs text-[var(--neutral-600)]">Read-only view of configured values</p>
              </div>
            </div>

            {siteSettings && siteSettings.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-[var(--neutral-200)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--neutral-50)]">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--neutral-600)]">Key</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--neutral-600)]">Category</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--neutral-600)]">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--neutral-100)]">
                    {siteSettings.map((setting: any) => (
                      <tr key={setting.id} className="hover:bg-[var(--neutral-50)]/50">
                        <td className="px-4 py-3 font-mono text-xs text-[var(--pulse-black)]">{setting.key}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-md bg-[var(--neutral-100)] px-2 py-0.5 text-[11px] font-medium text-[var(--neutral-600)]">
                            {setting.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--neutral-600)]">{JSON.stringify(setting.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] p-8 text-center">
                <Settings className="mx-auto h-8 w-8 text-[var(--neutral-400)]" />
                <p className="mt-2 text-sm text-[var(--neutral-600)]">No site settings configured</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column — Account */}
        <div className="space-y-6">
          {/* Change Password */}
          <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <Shield className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--pulse-black)]">Change Password</h2>
                <p className="text-xs text-[var(--neutral-600)]">Update your account password</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--pulse-black)]">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-[var(--neutral-200)] bg-white px-4 py-2.5 text-sm text-[var(--pulse-black)] outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--pulse-black)]">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[var(--neutral-200)] bg-white px-4 py-2.5 text-sm text-[var(--pulse-black)] outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              onClick={savePassword}
              disabled={!newPassword || !confirmPassword}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--pulse-black)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--pulse-red)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Key className="h-4 w-4" />
              Update Password
            </button>
          </div>

          {/* Quick tips card */}
          <div className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-5">
            <h3 className="text-sm font-semibold text-[var(--pulse-black)]">Tips</h3>
            <ul className="mt-3 space-y-2 text-xs text-[var(--neutral-600)]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pulse-red)]" />
                Featured tags appear in the blog filter bar
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pulse-red)]" />
                Password must be at least 8 characters
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pulse-red)]" />
                Site settings are managed via the database
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
