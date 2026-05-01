'use client';

import { useState } from 'react';
import { users as usersApi } from '@/lib/api-client';
import { useApi } from '@/lib/use-api';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Shield,
  UserPlus,
  Mail,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

function getInitials(name: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatLastLogin(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  inactive: { label: 'Inactive', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: AlertCircle },
  suspended: { label: 'Suspended', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertCircle },
};

export default function AdminUsersPage() {
  const { data, loading, refetch } = useApi(() => usersApi.list(), []);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ email: '', displayName: '', status: 'active' });

  const items = (data as any)?.items || [];
  const totalUsers = (data as any)?.pagination?.total || items.length;

  const handleCreate = async () => {
    if (!newUser.email || !newUser.password) return;
    try {
      await usersApi.create(newUser);
      setCreating(false);
      setNewUser({ email: '', password: '', displayName: '' });
      refetch();
    } catch (err) {
      alert('Failed to create user: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await usersApi.update(id, editData);
      setEditingId(null);
      refetch();
    } catch {
      alert('Failed to update user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await usersApi.delete(id);
      refetch();
    } catch {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--pulse-black)]">Users</h1>
          <p className="mt-1 text-sm text-[var(--neutral-600)]">
            {totalUsers > 0
              ? `Managing ${totalUsers} team member${totalUsers !== 1 ? 's' : ''}`
              : 'Manage users and roles'}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="btn btn-primary text-sm"
        >
          <UserPlus className="h-4 w-4" />
          New User
        </button>
      </div>

      {/* Create User Form */}
      {creating && (
        <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--pulse-red)]/10">
              <UserPlus className="h-4 w-4 text-[var(--pulse-red)]" />
            </div>
            <h3 className="font-semibold text-[var(--pulse-black)]">Create User</h3>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--neutral-600)]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--neutral-400)]" />
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full rounded-xl border border-[var(--neutral-200)] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--neutral-600)]">Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[var(--neutral-200)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--neutral-600)]">Display Name</label>
              <input
                type="text"
                value={newUser.displayName}
                onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                placeholder="John Doe"
                className="w-full rounded-xl border border-[var(--neutral-200)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreate}
              className="btn btn-primary text-sm"
            >
              <Save className="h-4 w-4" />
              Create User
            </button>
            <button
              onClick={() => setCreating(false)}
              className="btn btn-ghost text-sm"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-[var(--neutral-200)] bg-white py-16">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--pulse-red)]" />
            <span className="text-sm text-[var(--neutral-600)]">Loading users...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--neutral-300)] bg-white py-16">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--neutral-100)]">
              <Users className="h-10 w-10 text-[var(--neutral-400)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pulse-red)] text-white">
              <Plus className="h-4 w-4" />
            </div>
          </div>
          <h3 className="mt-5 text-lg font-semibold text-[var(--pulse-black)]">No team members yet</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-[var(--neutral-600)]">
            Add users to collaborate on content. Each user can have different roles and permissions.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="btn btn-primary mt-5 text-sm"
          >
            <UserPlus className="h-4 w-4" />
            Add your first user
          </button>
          <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Tip: You can assign admin, editor, or viewer roles to control access.</span>
          </div>
        </div>
      )}

      {/* User Table */}
      {!loading && items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--neutral-50)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--neutral-600)]">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--neutral-600)]">Roles</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--neutral-600)]">Status</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-[var(--neutral-600)] lg:table-cell">Last Login</th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--neutral-600)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neutral-200)]">
                {items.map((user: any) => {
                  const cfg = statusConfig[user.status] || statusConfig.inactive;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={user.id} className="group transition-colors hover:bg-[var(--neutral-50)]">
                      {editingId === user.id ? (
                        <>
                          <td className="px-4 py-3">
                            <div className="grid gap-2">
                              <input
                                type="text"
                                value={editData.displayName}
                                onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                                placeholder="Display Name"
                                className="w-full rounded-lg border border-[var(--neutral-200)] px-3 py-1.5 text-sm outline-none focus:border-[var(--pulse-red)]"
                              />
                              <input
                                type="email"
                                value={editData.email}
                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                placeholder="Email"
                                className="w-full rounded-lg border border-[var(--neutral-200)] px-3 py-1.5 text-sm outline-none focus:border-[var(--pulse-red)]"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--neutral-100)] px-2 py-0.5 text-xs text-[var(--neutral-600)]">
                              <Shield className="h-3 w-3" />
                              {user.roles?.join(', ') || 'None'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={editData.status}
                              onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                              className="rounded-lg border border-[var(--neutral-200)] px-2 py-1.5 text-sm outline-none focus:border-[var(--pulse-red)]"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </td>
                          <td className="hidden px-4 py-3 lg:table-cell">
                            <span className="text-xs text-[var(--neutral-500)]">{formatLastLogin(user.lastLoginAt)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleUpdate(user.id)}
                                className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100"
                                title="Save"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded-lg bg-[var(--neutral-100)] p-1.5 text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-200)]"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--pulse-red)]/20 to-[var(--pulse-jasmine)]/30 text-xs font-bold text-[var(--pulse-red)]">
                                {getInitials(user.displayName || user.email)}
                              </div>
                              <div>
                                <p className="font-medium text-[var(--pulse-black)]">
                                  {user.displayName || '—'}
                                </p>
                                <p className="text-xs text-[var(--neutral-500)]">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(user.roles || []).map((role: string) => (
                                <span
                                  key={role}
                                  className="inline-flex items-center gap-1 rounded-full bg-[var(--neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--neutral-600)]"
                                >
                                  <Shield className="h-3 w-3" />
                                  {role}
                                </span>
                              ))}
                              {(!user.roles || user.roles.length === 0) && (
                                <span className="text-xs text-[var(--neutral-400)]">None</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 lg:table-cell">
                            <span className="flex items-center gap-1 text-xs text-[var(--neutral-500)]">
                              <Clock className="h-3 w-3" />
                              {formatLastLogin(user.lastLoginAt)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => {
                                  setEditingId(user.id);
                                  setEditData({ email: user.email, displayName: user.displayName || '', status: user.status });
                                }}
                                className="rounded-lg p-1.5 text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)]"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="rounded-lg p-1.5 text-[var(--neutral-600)] transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
