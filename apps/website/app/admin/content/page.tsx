'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useEntries } from '@/lib/use-api';
import { entries as entriesApi } from '@/lib/api-client';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Archive,
  PenTool,
  Calendar,
  ExternalLink,
  BarChart3,
  PenLine,
  Square,
  CheckSquare,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
  published: { label: 'Published', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  draft: { label: 'Draft', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: PenTool },
  review: { label: 'In Review', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: Eye },
  scheduled: { label: 'Scheduled', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Calendar },
  archived: { label: 'Archived', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: Archive },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}

export default function AdminContentPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useEntries({ page, limit: 20, search: search || undefined, status: statusFilter || undefined });

  const items = data?.items || [];
  const pagination = data?.pagination;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const stats = useMemo(() => {
    const all = data?.items || [];
    return {
      total: all.length,
      published: all.filter((e: any) => e.status === 'published').length,
      draft: all.filter((e: any) => e.status === 'draft').length,
      review: all.filter((e: any) => e.status === 'review').length,
      scheduled: all.filter((e: any) => e.status === 'scheduled').length,
      archived: all.filter((e: any) => e.status === 'archived').length,
    };
  }, [data]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((e: any) => e.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await entriesApi.delete(id);
      refetch();
    } catch {
      alert('Failed to delete entry');
    }
  };

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'archive' | 'delete') => {
    if (selectedIds.size === 0) {
      alert('No entries selected');
      return;
    }
    const selected = Array.from(selectedIds);
    if (!confirm(`Are you sure you want to ${action} ${selected.length} selected entr${selected.length !== 1 ? 'ies' : 'y'}?`)) return;
    try {
      await entriesApi.bulkAction(selected, action);
      setSelectedIds(new Set());
      refetch();
    } catch {
      alert(`Failed to ${action} entries`);
    }
  };

  const statCards = [
    { label: 'Total', value: stats.total, icon: BarChart3, color: 'bg-blue-100 text-blue-600' },
    { label: 'Published', value: stats.published, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Drafts', value: stats.draft, icon: PenTool, color: 'bg-amber-100 text-amber-600' },
    { label: 'In Review', value: stats.review, icon: Eye, color: 'bg-violet-100 text-violet-600' },
    { label: 'Scheduled', value: stats.scheduled, icon: Calendar, color: 'bg-sky-100 text-sky-600' },
    { label: 'Archived', value: stats.archived, icon: Archive, color: 'bg-slate-100 text-slate-600' },
  ];

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--pulse-black)]">Content Library</h1>
          <p className="mt-1 text-sm text-[var(--neutral-600)]">
            {(pagination?.total ?? 0) > 0
              ? `${pagination!.total} entr${pagination!.total !== 1 ? 'ies' : 'y'} total`
              : 'Manage all your content entries'}
          </p>
        </div>
        <Link href="/admin/studio" className="btn btn-primary text-sm">
          <Plus className="h-4 w-4" />
          New Entry
        </Link>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-xl border border-[var(--neutral-200)] bg-white p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`mx-auto inline-flex rounded-lg p-1.5 ${card.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="mt-1.5 text-lg font-bold text-[var(--pulse-black)]">{card.value}</p>
                <p className="text-[11px] text-[var(--neutral-600)]">{card.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--neutral-400)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search entries by title or slug..."
            className="w-full rounded-xl border border-[var(--neutral-200)] bg-white py-2.5 pl-10 pr-10 text-sm text-[var(--pulse-black)] outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
          />
          {search && (
            <button type="button"
              onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] hover:text-[var(--pulse-black)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--neutral-400)]" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl border border-[var(--neutral-200)] bg-white py-2.5 pl-10 pr-8 text-sm text-[var(--pulse-black)] outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <ChevronLeft className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 rotate-[-90deg] text-[var(--neutral-400)] pointer-events-none" />
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.size > 0 ? (
            <>
              <span className="text-xs font-semibold text-[var(--pulse-red)]">
                {selectedIds.size} selected
              </span>
              <button type="button"
                onClick={() => handleBulkAction('publish')}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <CheckCircle2 className="h-3 w-3" />
                Publish
              </button>
              <button type="button"
                onClick={() => handleBulkAction('unpublish')}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                <PenLine className="h-3 w-3" />
                Unpublish
              </button>
              <button type="button"
                onClick={() => handleBulkAction('archive')}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <Archive className="h-3 w-3" />
                Archive
              </button>
              <button type="button"
                onClick={() => handleBulkAction('delete')}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
              <button type="button"
                onClick={clearSelection}
                className="ml-auto text-xs font-medium text-[var(--neutral-500)] hover:text-[var(--pulse-black)]"
              >
                Clear selection
              </button>
            </>
          ) : (
            <span className="text-xs text-[var(--neutral-500)]">Select entries to use bulk actions</span>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-[var(--neutral-200)] bg-white py-16">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--pulse-red)]" />
            <span className="text-sm text-[var(--neutral-600)]">Loading entries...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--neutral-300)] bg-white py-16">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--neutral-100)]">
              <FileText className="h-10 w-10 text-[var(--neutral-400)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pulse-red)] text-white">
              <Plus className="h-4 w-4" />
            </div>
          </div>
          <h3 className="mt-5 text-lg font-semibold text-[var(--pulse-black)]">No entries found</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-[var(--neutral-600)]">
            {search || statusFilter
              ? "Try adjusting your search or filter to find what you're looking for."
              : 'Create your first content entry to get started.'}
          </p>
          <Link href="/admin/studio" className="btn btn-primary mt-5 text-sm">
            <Plus className="h-4 w-4" />
            Create Entry
          </Link>
        </div>
      )}

      {/* Desktop Table */}
      {!loading && items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-[var(--neutral-50)]">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button type="button"
                      onClick={toggleSelectAll}
                      className="flex items-center gap-1 text-[var(--neutral-600)] transition-colors hover:text-[var(--pulse-black)]"
                      title={allSelected ? 'Deselect all' : 'Select all'}
                    >
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4 text-[var(--pulse-red)]" />
                      ) : someSelected ? (
                        <div className="relative h-4 w-4">
                          <Square className="h-4 w-4 text-[var(--pulse-red)]" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-sm bg-[var(--pulse-red)]" />
                          </div>
                        </div>
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--neutral-600)]">Entry</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--neutral-600)]">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--neutral-600)]">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--neutral-600)]">Author</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--neutral-600)]">Updated</th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--neutral-600)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neutral-100)]">
                {items.map((entry: any) => {
                  const cfg = statusConfig[entry.status] || statusConfig.draft;
                  const StatusIcon = cfg.icon;
                  const isSelected = selectedIds.has(entry.id);
                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${isSelected ? 'bg-[var(--pulse-red)]/5' : 'hover:bg-[var(--neutral-50)]'}`}
                    >
                      <td className="px-4 py-3">
                        <button type="button"
                          onClick={() => toggleSelect(entry.id)}
                          className="text-[var(--neutral-400)] transition-colors hover:text-[var(--pulse-red)]"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-[var(--pulse-red)]" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-[var(--pulse-black)]">{entry.title}</p>
                          <p className="text-xs text-[var(--neutral-500)]">/{entry.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-[var(--neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--neutral-600)]">
                          {entry.contentType?.name || 'Post'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--neutral-600)]">
                        {entry.author?.displayName || entry.author?.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-[var(--neutral-500)]">
                          <Clock className="h-3 w-3" />
                          {timeAgo(entry.updatedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/blog/${entry.slug}`}
                            target="_blank"
                            className="rounded-lg p-1.5 text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)]"
                            title="View"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/admin/studio?edit=${entry.id}`}
                            className="rounded-lg p-1.5 text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)]"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="rounded-lg p-1.5 text-[var(--neutral-600)] transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="divide-y divide-[var(--neutral-100)] md:hidden">
            {items.map((entry: any) => {
              const cfg = statusConfig[entry.status] || statusConfig.draft;
              const StatusIcon = cfg.icon;
              const isSelected = selectedIds.has(entry.id);
              return (
                <div key={entry.id} className={`p-4 ${isSelected ? 'bg-[var(--pulse-red)]/5' : ''}`}>
                  <div className="flex items-start gap-3">
                    <button type="button"
                      onClick={() => toggleSelect(entry.id)}
                      className="mt-0.5 text-[var(--neutral-400)] transition-colors hover:text-[var(--pulse-red)]"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-[var(--pulse-red)]" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-[var(--pulse-black)]">{entry.title}</p>
                        <span className={`ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--neutral-500)]">/{entry.slug}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-[var(--neutral-500)]">
                        <span>{entry.contentType?.name || 'Post'}</span>
                        <span>•</span>
                        <span>{entry.author?.displayName || entry.author?.email || '—'}</span>
                        <span>•</span>
                        <span>{timeAgo(entry.updatedAt)}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/blog/${entry.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] px-3 py-1.5 text-xs font-medium text-[var(--pulse-black)]"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Link>
                        <Link
                          href={`/admin/studio?edit=${entry.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] px-3 py-1.5 text-xs font-medium text-[var(--pulse-black)]"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Link>
                        <button type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--neutral-200)] px-4 py-3">
              <p className="text-xs text-[var(--neutral-600)]">
                Page <span className="font-medium text-[var(--pulse-black)]">{pagination.page}</span> of{' '}
                <span className="font-medium text-[var(--pulse-black)]">{pagination.totalPages}</span>
                <span className="ml-1 text-[var(--neutral-400)]">({pagination.total} total)</span>
              </p>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] px-3 py-1.5 text-xs font-medium text-[var(--pulse-black)] transition-colors hover:bg-[var(--neutral-50)] disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] px-3 py-1.5 text-xs font-medium text-[var(--pulse-black)] transition-colors hover:bg-[var(--neutral-50)] disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
