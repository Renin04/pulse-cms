'use client';

import { useState } from 'react';
import { taxonomies as taxonomiesApi } from '@/lib/api-client';
import { useApi } from '@/lib/use-api';
import {
  Tags, Plus, Trash2, Edit, Save, X, Tag, FolderOpen, Bookmark,
  ChevronDown, ChevronUp,
} from 'lucide-react';

const typeConfig: Record<string, { label: string; icon: typeof Tag; bg: string; text: string; border: string }> = {
  tag: { label: 'Tag', icon: Tag, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  category: { label: 'Category', icon: FolderOpen, bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  label: { label: 'Label', icon: Bookmark, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export default function AdminTaxonomiesPage() {
  const { data, loading, refetch } = useApi(() => taxonomiesApi.list(), []);
  const [creating, setCreating] = useState(false);
  const [newTaxonomy, setNewTaxonomy] = useState({ name: '', slug: '', type: 'tag', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', slug: '', description: '' });

  // Term management state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newTermInputs, setNewTermInputs] = useState<Record<string, { name: string; slug: string }>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!newTaxonomy.name || !newTaxonomy.slug) return;
    try {
      await taxonomiesApi.create(newTaxonomy);
      setCreating(false);
      setNewTaxonomy({ name: '', slug: '', type: 'tag', description: '' });
      refetch();
    } catch {
      alert('Failed to create taxonomy');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await taxonomiesApi.update(id, editData);
      setEditingId(null);
      refetch();
    } catch {
      alert('Failed to update taxonomy');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this taxonomy and all its terms?')) return;
    try {
      await taxonomiesApi.delete(id);
      refetch();
    } catch {
      alert('Failed to delete taxonomy');
    }
  };

  const handleCreateTerm = async (taxonomyId: string) => {
    const input = newTermInputs[taxonomyId];
    if (!input?.name) return;
    try {
      await taxonomiesApi.createTerm(taxonomyId, {
        name: input.name,
        slug: input.slug || input.name.toLowerCase().replace(/\s+/g, '-'),
      });
      setNewTermInputs((prev) => ({ ...prev, [taxonomyId]: { name: '', slug: '' } }));
      refetch();
    } catch {
      alert('Failed to create term');
    }
  };

  const handleDeleteTerm = async (taxonomyId: string, termId: string, termName: string) => {
    if (!confirm(`Delete term "${termName}"?`)) return;
    try {
      await taxonomiesApi.deleteTerm(taxonomyId, termId);
      refetch();
    } catch {
      alert('Failed to delete term');
    }
  };

  const items = (data as any) || [];

  const typeCounts = {
    tag: items.filter((t: any) => t.type === 'tag').length,
    category: items.filter((t: any) => t.type === 'category').length,
    label: items.filter((t: any) => t.type === 'label').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--pulse-black)]">Taxonomies</h1>
          <p className="mt-1 text-sm text-[var(--neutral-600)]">
            {items.length > 0
              ? `${items.length} taxonom${items.length !== 1 ? 'ies' : 'y'} total`
              : 'Manage tags, categories, and labels'}
          </p>
        </div>
        <button type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--pulse-red)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--pulse-black)] hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          New Taxonomy
        </button>
      </div>

      {/* Type stat cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {(['tag', 'category', 'label'] as const).map((type) => {
            const cfg = typeConfig[type];
            const Icon = cfg.icon;
            return (
              <div
                key={type}
                className="rounded-xl border border-[var(--neutral-200)] bg-white p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`mx-auto inline-flex rounded-lg p-1.5 ${cfg.bg} ${cfg.text}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="mt-1.5 text-lg font-bold text-[var(--pulse-black)]">{typeCounts[type]}</p>
                <p className="text-[11px] text-[var(--neutral-600)]">{cfg.label}s</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--pulse-red)]/10">
              <Plus className="h-4 w-4 text-[var(--pulse-red)]" />
            </div>
            <h3 className="font-bold text-[var(--pulse-black)]">Create Taxonomy</h3>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--pulse-black)]">Name</label>
              <input
                type="text"
                value={newTaxonomy.name}
                onChange={(e) => setNewTaxonomy({ ...newTaxonomy, name: e.target.value })}
                placeholder="e.g. Topics"
                className="w-full rounded-xl border border-[var(--neutral-200)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--pulse-black)]">Slug</label>
              <input
                type="text"
                value={newTaxonomy.slug}
                onChange={(e) => setNewTaxonomy({ ...newTaxonomy, slug: e.target.value })}
                placeholder="e.g. topics"
                className="w-full rounded-xl border border-[var(--neutral-200)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--pulse-black)]">Type</label>
              <select
                value={newTaxonomy.type}
                onChange={(e) => setNewTaxonomy({ ...newTaxonomy, type: e.target.value })}
                className="w-full rounded-xl border border-[var(--neutral-200)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
              >
                <option value="tag">Tag</option>
                <option value="category">Category</option>
                <option value="label">Label</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--pulse-black)]">Description</label>
              <input
                type="text"
                value={newTaxonomy.description}
                onChange={(e) => setNewTaxonomy({ ...newTaxonomy, description: e.target.value })}
                placeholder="Optional description"
                className="w-full rounded-xl border border-[var(--neutral-200)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--pulse-red)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--pulse-black)]"
            >
              <Save className="h-4 w-4" />
              Save Taxonomy
            </button>
            <button type="button"
              onClick={() => setCreating(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--neutral-200)] px-5 py-2.5 text-sm font-medium text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-50)]"
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
            <span className="text-sm text-[var(--neutral-600)]">Loading taxonomies...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--neutral-300)] bg-white py-16">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--neutral-100)]">
              <Tags className="h-10 w-10 text-[var(--neutral-400)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pulse-red)] text-white">
              <Plus className="h-4 w-4" />
            </div>
          </div>
          <h3 className="mt-5 text-lg font-semibold text-[var(--pulse-black)]">No taxonomies yet</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-[var(--neutral-600)]">
            Create your first taxonomy to organize content with tags, categories, or labels.
          </p>
          <button type="button"
            onClick={() => setCreating(true)}
            className="btn btn-primary mt-5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Create Taxonomy
          </button>
        </div>
      )}

      {/* List */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((taxonomy: any) => {
            const cfg = typeConfig[taxonomy.type] || typeConfig.tag;
            const TypeIcon = cfg.icon;
            const isEditing = editingId === taxonomy.id;
            const isExpanded = expandedIds.has(taxonomy.id);
            const termInput = newTermInputs[taxonomy.id] || { name: '', slug: '' };
            const terms = taxonomy.terms || [];

            return (
              <div
                key={taxonomy.id}
                className="overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white shadow-sm transition-all"
              >
                {/* Desktop row */}
                <div className="hidden md:block">
                  {isEditing ? (
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="flex-1 rounded-xl border border-[var(--neutral-200)] px-4 py-2 text-sm outline-none focus:border-[var(--pulse-red)]"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={editData.slug}
                        onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                        className="flex-1 rounded-xl border border-[var(--neutral-200)] px-4 py-2 text-sm outline-none focus:border-[var(--pulse-red)]"
                        placeholder="Slug"
                      />
                      <input
                        type="text"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="flex-1 rounded-xl border border-[var(--neutral-200)] px-4 py-2 text-sm outline-none focus:border-[var(--pulse-red)]"
                        placeholder="Description"
                      />
                      <div className="flex gap-2">
                        <button type="button"
                          onClick={() => handleUpdate(taxonomy.id)}
                          className="rounded-lg bg-emerald-50 p-2 text-emerald-700 transition-colors hover:bg-emerald-100"
                          title="Save"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg bg-[var(--neutral-100)] p-2 text-[var(--neutral-700)] transition-colors hover:bg-[var(--neutral-200)]"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 px-4 py-3">
                      <button type="button"
                        onClick={() => toggleExpand(taxonomy.id)}
                        className="rounded p-1 text-[var(--neutral-400)] transition-colors hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]"
                        title={isExpanded ? 'Collapse terms' : 'Expand terms'}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[var(--pulse-black)]">{taxonomy.name}</p>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            <TypeIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--neutral-500)]">/{taxonomy.slug}</p>
                      </div>
                      <div className="hidden text-sm text-[var(--neutral-600)] lg:block">
                        {taxonomy.description || '—'}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--neutral-600)]">
                          <Tags className="h-3 w-3" />
                          {terms.length}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button type="button"
                          onClick={() => {
                            setEditingId(taxonomy.id);
                            setEditData({
                              name: taxonomy.name,
                              slug: taxonomy.slug,
                              description: taxonomy.description || '',
                            });
                          }}
                          className="rounded-lg p-1.5 text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)]"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button type="button"
                          onClick={() => handleDelete(taxonomy.id)}
                          className="rounded-lg p-1.5 text-[var(--neutral-600)] transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile row */}
                <div className="md:hidden">
                  {isEditing ? (
                    <div className="space-y-3 p-4">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full rounded-xl border border-[var(--neutral-200)] px-4 py-2 text-sm outline-none focus:border-[var(--pulse-red)]"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={editData.slug}
                        onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                        className="w-full rounded-xl border border-[var(--neutral-200)] px-4 py-2 text-sm outline-none focus:border-[var(--pulse-red)]"
                        placeholder="Slug"
                      />
                      <div className="flex gap-2">
                        <button type="button"
                          onClick={() => handleUpdate(taxonomy.id)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2 text-sm font-medium text-emerald-700"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </button>
                        <button type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--neutral-200)] py-2 text-sm font-medium text-[var(--neutral-600)]"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[var(--pulse-black)]">{taxonomy.name}</p>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              <TypeIcon className="h-2.5 w-2.5" />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--neutral-500)]">/{taxonomy.slug}</p>
                          {taxonomy.description && (
                            <p className="mt-1 text-xs text-[var(--neutral-600)]">{taxonomy.description}</p>
                          )}
                        </div>
                        <div className="ml-3 flex gap-1">
                          <button type="button"
                            onClick={() => toggleExpand(taxonomy.id)}
                            className="rounded-lg p-1.5 text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)]"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <button type="button"
                            onClick={() => {
                              setEditingId(taxonomy.id);
                              setEditData({
                                name: taxonomy.name,
                                slug: taxonomy.slug,
                                description: taxonomy.description || '',
                              });
                            }}
                            className="rounded-lg p-1.5 text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)]"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button type="button"
                            onClick={() => handleDelete(taxonomy.id)}
                            className="rounded-lg p-1.5 text-[var(--neutral-600)] transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms panel */}
                {isExpanded && !isEditing && (
                  <div className="border-t border-[var(--neutral-100)] bg-[var(--neutral-50)]/50 px-4 py-3">
                    {/* Term list */}
                    {terms.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {terms.map((term: any) => (
                          <span
                            key={term.id}
                            className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--neutral-200)] bg-white px-3 py-1 text-xs font-medium text-[var(--pulse-black)] transition-all hover:border-red-200 hover:bg-red-50"
                          >
                            <span>{term.name}</span>
                            <button type="button"
                              onClick={() => handleDeleteTerm(taxonomy.id, term.id, term.name)}
                              className="rounded-full p-0.5 text-[var(--neutral-400)] opacity-0 transition-all group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
                              title="Delete term"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add term */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={termInput.name}
                        onChange={(e) =>
                          setNewTermInputs((prev) => ({
                            ...prev,
                            [taxonomy.id]: { ...termInput, name: e.target.value },
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTerm(taxonomy.id);
                        }}
                        placeholder="New term name..."
                        className="flex-1 rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--pulse-red)]"
                      />
                      <input
                        type="text"
                        value={termInput.slug}
                        onChange={(e) =>
                          setNewTermInputs((prev) => ({
                            ...prev,
                            [taxonomy.id]: { ...termInput, slug: e.target.value },
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTerm(taxonomy.id);
                        }}
                        placeholder="slug (auto)"
                        className="w-32 rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--pulse-red)]"
                      />
                      <button type="button"
                        onClick={() => handleCreateTerm(taxonomy.id)}
                        disabled={!termInput.name.trim()}
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--pulse-black)] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[var(--pulse-red)] disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
