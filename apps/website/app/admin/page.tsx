'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useEntries } from '@/lib/use-api';
import { useBackendBlogEntries } from '@/lib/use-backend-entries';
import {
  FileText,
  Users,
  Image,
  Tag,
  Clock,
  CheckCircle,
  Archive,
  PenTool,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Calendar,
  Eye,
  Zap,
  ChevronRight,
} from 'lucide-react';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '—';
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: typeof CheckCircle }> = {
  published: { label: 'Published', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
  draft: { label: 'Draft', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: FileText },
  review: { label: 'In Review', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: Eye },
  scheduled: { label: 'Scheduled', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Calendar },
  archived: { label: 'Archived', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: Archive },
};

export default function AdminDashboardPage() {
  const { data: cmsEntries, loading: cmsLoading } = useEntries({ limit: 50 });
  const { entries: blogEntries, loading: blogLoading } = useBackendBlogEntries();
  const [greeting, setGreeting] = useState('Welcome');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const stats = useMemo(() => {
    const items = cmsEntries?.items || [];
    const total = items.length;
    const published = items.filter((e: any) => e.status === 'published').length;
    const draft = items.filter((e: any) => e.status === 'draft').length;
    const review = items.filter((e: any) => e.status === 'review').length;
    const scheduled = items.filter((e: any) => e.status === 'scheduled').length;
    const archived = items.filter((e: any) => e.status === 'archived').length;
    return { total, published, draft, review, scheduled, archived };
  }, [cmsEntries]);

  const recentEntries = useMemo(() => {
    const items = cmsEntries?.items || [];
    return [...items]
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [cmsEntries]);

  const statCards = [
    {
      label: 'Total Posts',
      value: blogEntries.length,
      icon: FileText,
      gradient: 'from-blue-500/10 to-blue-600/5',
      iconBg: 'bg-blue-100 text-blue-600',
      trend: '+12%',
    },
    {
      label: 'Published',
      value: stats.published,
      icon: CheckCircle,
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      iconBg: 'bg-emerald-100 text-emerald-600',
      trend: '+8%',
    },
    {
      label: 'Drafts',
      value: stats.draft,
      icon: PenTool,
      gradient: 'from-amber-500/10 to-amber-600/5',
      iconBg: 'bg-amber-100 text-amber-600',
      trend: null,
    },
    {
      label: 'In Review',
      value: stats.review,
      icon: Eye,
      gradient: 'from-violet-500/10 to-violet-600/5',
      iconBg: 'bg-violet-100 text-violet-600',
      trend: null,
    },
    {
      label: 'Scheduled',
      value: stats.scheduled,
      icon: Calendar,
      gradient: 'from-sky-500/10 to-sky-600/5',
      iconBg: 'bg-sky-100 text-sky-600',
      trend: null,
    },
    {
      label: 'Archived',
      value: stats.archived,
      icon: Archive,
      gradient: 'from-slate-500/10 to-slate-600/5',
      iconBg: 'bg-slate-100 text-slate-600',
      trend: null,
    },
  ];

  const quickActions = [
    {
      href: '/admin/studio',
      label: 'New Post',
      desc: 'Create a fresh article',
      icon: FileText,
      color: 'bg-[var(--pulse-red)] text-white shadow-[var(--shadow-red)]',
    },
    {
      href: '/admin/media',
      label: 'Upload Media',
      desc: 'Add images or files',
      icon: Image,
      color: 'bg-white text-[var(--pulse-black)] border border-[var(--neutral-200)]',
    },
    {
      href: '/admin/users',
      label: 'Manage Users',
      desc: 'Team & permissions',
      icon: Users,
      color: 'bg-white text-[var(--pulse-black)] border border-[var(--neutral-200)]',
    },
    {
      href: '/admin/taxonomies',
      label: 'Edit Taxonomies',
      desc: 'Tags & categories',
      icon: Tag,
      color: 'bg-white text-[var(--pulse-black)] border border-[var(--neutral-200)]',
    },
  ];

  const distribution = useMemo(() => {
    const total = stats.total || 1;
    return [
      { label: 'Published', value: stats.published, color: 'bg-emerald-500', width: `${(stats.published / total) * 100}%` },
      { label: 'Drafts', value: stats.draft, color: 'bg-amber-500', width: `${(stats.draft / total) * 100}%` },
      { label: 'Review', value: stats.review, color: 'bg-violet-500', width: `${(stats.review / total) * 100}%` },
      { label: 'Scheduled', value: stats.scheduled, color: 'bg-sky-500', width: `${(stats.scheduled / total) * 100}%` },
      { label: 'Archived', value: stats.archived, color: 'bg-slate-400', width: `${(stats.archived / total) * 100}%` },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const isLoading = cmsLoading || blogLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--pulse-red)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--pulse-black)]">{greeting}</h1>
          <p className="mt-1 text-sm text-[var(--neutral-600)]">
            Here&apos;s what&apos;s happening with your content today.
          </p>
        </div>
        <p className="text-xs text-[var(--neutral-500)]">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex rounded-lg p-2 ${card.iconBg}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {card.trend && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                      <TrendingUp className="h-3 w-3" />
                      {card.trend}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-2xl font-bold text-[var(--pulse-black)]">{card.value}</p>
                <p className="text-xs text-[var(--neutral-600)]">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column - Recent Entries + Distribution */}
        <div className="space-y-6 xl:col-span-2">
          {/* Content Distribution */}
          {stats.total > 0 && (
            <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[var(--pulse-red)]" />
                <h2 className="text-sm font-semibold text-[var(--pulse-black)]">Content Distribution</h2>
              </div>
              <div className="mt-4">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--neutral-100)]">
                  {distribution.map((d) => (
                    <div
                      key={d.label}
                      className={`${d.color} h-full transition-all duration-500`}
                      style={{ width: d.width }}
                      title={`${d.label}: ${d.value}`}
                    />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {distribution.map((d) => (
                    <div key={d.label} className="flex items-center gap-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${d.color}`} />
                      <span className="text-xs text-[var(--neutral-600)]">
                        {d.label} <span className="font-medium text-[var(--pulse-black)]">{d.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Entries */}
          <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--pulse-red)]" />
                <h2 className="text-sm font-semibold text-[var(--pulse-black)]">Recent Entries</h2>
              </div>
              <Link
                href="/admin/content"
                className="flex items-center gap-1 text-xs font-medium text-[var(--pulse-red)] transition-colors hover:text-[var(--pulse-red-dark)]"
              >
                View all
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {recentEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--neutral-300)] py-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--neutral-100)]">
                  <FileText className="h-5 w-5 text-[var(--neutral-400)]" />
                </div>
                <p className="mt-3 text-sm font-medium text-[var(--pulse-black)]">No entries yet</p>
                <p className="text-xs text-[var(--neutral-500)]">Create your first post to get started.</p>
                <Link
                  href="/admin/studio"
                  className="btn btn-primary mt-4 text-xs"
                >
                  <Zap className="h-3.5 w-3.5" />
                  New Post
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--neutral-100)]">
                {recentEntries.map((entry: any) => {
                  const cfg = statusConfig[entry.status] || statusConfig.draft;
                  const StatusIcon = cfg.icon;
                  return (
                    <div
                      key={entry.id}
                      className="group flex items-center justify-between py-3.5 transition-colors first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-[var(--pulse-black)] group-hover:text-[var(--pulse-red)] transition-colors">
                            {entry.title}
                          </p>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-xs text-[var(--neutral-500)]">/{entry.slug}</span>
                          <span className="text-[var(--neutral-300)]">•</span>
                          <span className="text-xs text-[var(--neutral-500)]">{timeAgo(entry.updatedAt)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                        <Link
                          href={`/admin/content?edit=${entry.id}`}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <ArrowUpRight className="h-4 w-4 text-[var(--neutral-400)] hover:text-[var(--pulse-red)]" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions + Insights */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[var(--pulse-red)]" />
              <h2 className="text-sm font-semibold text-[var(--pulse-black)]">Quick Actions</h2>
            </div>
            <div className="mt-4 space-y-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const isPrimary = action.href === '/admin/studio';
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                      isPrimary
                        ? 'bg-[var(--pulse-red)] text-white shadow-[var(--shadow-red)] hover:bg-[var(--pulse-red-dark)] hover:shadow-lg'
                        : 'border border-[var(--neutral-200)] bg-white text-[var(--pulse-black)] hover:border-[var(--pulse-red)] hover:bg-[var(--pulse-red)]/5'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isPrimary ? 'text-white' : 'text-[var(--pulse-red)]'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{action.label}</p>
                      <p className={`text-xs ${isPrimary ? 'text-white/70' : 'text-[var(--neutral-500)]'}`}>
                        {action.desc}
                      </p>
                    </div>
                    <ArrowUpRight
                      className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        isPrimary ? 'text-white/70' : 'text-[var(--neutral-400)]'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Content Health */}
          <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--pulse-red)]" />
              <h2 className="text-sm font-semibold text-[var(--pulse-black)]">Content Health</h2>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--neutral-600)]">Publish Rate</span>
                  <span className="font-medium text-[var(--pulse-black)]">
                    {stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--neutral-100)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--pulse-red)] to-[var(--pulse-red-light)] transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? (stats.published / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--neutral-600)]">Review Pipeline</span>
                  <span className="font-medium text-[var(--pulse-black)]">
                    {stats.total > 0 ? Math.round(((stats.review + stats.scheduled) / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--neutral-100)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? ((stats.review + stats.scheduled) / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--neutral-600)]">Draft Backlog</span>
                  <span className="font-medium text-[var(--pulse-black)]">
                    {stats.total > 0 ? Math.round((stats.draft / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--neutral-100)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? (stats.draft / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
