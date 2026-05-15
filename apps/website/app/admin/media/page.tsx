'use client';

import { useState } from 'react';
import { media as mediaApi } from '@/lib/api-client';
import { useApi } from '@/lib/use-api';
import {
  Image,
  Upload,
  Trash2,
  Search,
  FileImage,
  FileVideo,
  FileText,
  Music,
  X,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Eye,
  Download,
  Pencil,
  Save,
  ExternalLink,
} from 'lucide-react';

const typeIcons: Record<string, typeof FileImage> = {
  image: FileImage,
  video: FileVideo,
  audio: Music,
  document: FileText,
};

function normalizeMediaUrl(url: string): string {
  // Fix double slashes from legacy storage adapter and ensure trailing slash
  return url.replace(/\/\/+/g, '/').replace(/([^/])$/, '$1/');
}

const typeColors: Record<string, string> = {
  image: 'bg-blue-50 text-blue-600',
  video: 'bg-purple-50 text-purple-600',
  audio: 'bg-amber-50 text-amber-600',
  document: 'bg-emerald-50 text-emerald-600',
};

function EditImageForm({
  item,
  onSave,
  onCancel,
}: {
  item: any;
  onSave: (updates: { name?: string; metadata?: Record<string, unknown> }) => void;
  onCancel: () => void;
}) {
  const meta = item.metadata || {};
  const [name, setName] = useState(item.name || '');
  const [alt, setAlt] = useState(meta.alt || item.name || '');
  const [width, setWidth] = useState(meta.desiredWidth ? String(meta.desiredWidth) : '');
  const [height, setHeight] = useState(meta.desiredHeight ? String(meta.desiredHeight) : '');
  const [format, setFormat] = useState(meta.desiredFormat || 'original');

  const origW = meta.width || 0;
  const origH = meta.height || 0;

  const handleSave = () => {
    const metadata: Record<string, unknown> = { ...meta };
    if (alt) metadata.alt = alt;
    if (width) metadata.desiredWidth = parseInt(width, 10);
    if (height) metadata.desiredHeight = parseInt(height, 10);
    if (format && format !== 'original') metadata.desiredFormat = format;
    onSave({ name: name || item.name, metadata });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="relative overflow-hidden rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)]">
        <img
          src={normalizeMediaUrl(item.url)}
          alt={item.name}
          className="h-48 w-full object-contain"
        />
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--pulse-red)]"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Alt text</span>
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe the image for accessibility"
            className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--pulse-red)]"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Width (px)</span>
            <input
              type="number"
              min={1}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder={origW ? String(origW) : 'Auto'}
              className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--pulse-red)]"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Height (px)</span>
            <input
              type="number"
              min={1}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder={origH ? String(origH) : 'Auto'}
              className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--pulse-red)]"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Format</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--pulse-red)]"
          >
            <option value="original">Original</option>
            <option value="webp">WebP</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
          </select>
          {meta.processedFilePath && (
            <p className="mt-1 text-[11px] text-emerald-600">
              Image has been processed. Original is preserved.
            </p>
          )}
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button"
          onClick={handleSave}
          className="flex-1 rounded-lg bg-[var(--pulse-black)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--pulse-red)] transition-colors"
        >
          Save Changes
        </button>
        <button type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--neutral-200)] bg-white px-4 py-2 text-xs font-bold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminMediaPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useApi(() => mediaApi.list({ page, limit: 20, search: search || undefined }), [page, search]);

  const [previewItem, setPreviewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await mediaApi.upload(file);
      refetch();
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media asset?')) return;
    try {
      await mediaApi.delete(id);
      refetch();
    } catch {
      alert('Delete failed');
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      await mediaApi.update(id, { name: renameValue.trim() });
      setRenamingId(null);
      refetch();
    } catch (err) {
      alert('Rename failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const startRename = (item: any) => {
    setRenamingId(item.id);
    setRenameValue(item.name);
  };

  const items = (data as any)?.items || [];
  const pagination = (data as any)?.pagination;
  const totalItems = pagination?.total || items.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--pulse-black)]">Media Library</h1>
          <p className="mt-1 text-sm text-[var(--neutral-600)]">
            {totalItems > 0
              ? `${totalItems} asset${totalItems !== 1 ? 's' : ''} in your library`
              : 'Manage images, videos, and documents'}
          </p>
        </div>
        <label className="btn btn-primary cursor-pointer text-sm">
          <Upload className="h-4 w-4" />
          Upload File
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {/* Search */}
      {totalItems > 0 || search ? (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--neutral-400)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search media by name..."
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
      ) : null}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-[var(--neutral-200)] bg-white py-16">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--pulse-red)]" />
            <span className="text-sm text-[var(--neutral-600)]">Loading media...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--neutral-300)] bg-white py-16">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--neutral-100)]">
              <Image className="h-10 w-10 text-[var(--neutral-400)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pulse-red)] text-white">
              <Upload className="h-4 w-4" />
            </div>
          </div>
          <h3 className="mt-5 text-lg font-semibold text-[var(--pulse-black)]">No media assets yet</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-[var(--neutral-600)]">
            Upload images, videos, documents, and audio files to use in your content.
          </p>
          <label className="btn btn-primary mt-5 cursor-pointer text-sm">
            <ImagePlus className="h-4 w-4" />
            Upload your first file
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              <FileImage className="h-3 w-3" />
              Images
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
              <FileVideo className="h-3 w-3" />
              Videos
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <FileText className="h-3 w-3" />
              Documents
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              <Music className="h-3 w-3" />
              Audio
            </span>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {!loading && items.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {items.map((item: any) => {
              const TypeIcon = typeIcons[item.type] || FileText;
              const typeColor = typeColors[item.type] || 'bg-gray-50 text-gray-600';
              const isImage = item.type === 'image';
              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Preview area */}
                  <div
                    className="relative cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                  >
                    {isImage ? (
                      <div className="relative aspect-square w-full overflow-hidden bg-[var(--neutral-100)]">
                        <img
                          src={normalizeMediaUrl(item.url)}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    ) : (
                      <div className="flex aspect-square w-full flex-col items-center justify-center bg-gradient-to-br from-[var(--neutral-50)] to-white">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${typeColor}`}>
                          <TypeIcon className="h-7 w-7" />
                        </div>
                        <span className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--neutral-500)]">
                          {item.type}
                        </span>
                      </div>
                    )}

                    {/* Hover overlay actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--pulse-black)] shadow-sm transition-transform hover:scale-110"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {isImage && (
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--pulse-black)] shadow-sm transition-transform hover:scale-110"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      <a
                        href={`${normalizeMediaUrl(item.url)}?download=1`}
                        download={item.filename}
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--pulse-black)] shadow-sm transition-transform hover:scale-110"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  {/* Info + actions */}
                  <div className="p-3">
                    {renamingId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRename(item.id); if (e.key === 'Escape') setRenamingId(null); }}
                          className="w-full rounded-lg border border-[var(--neutral-200)] px-2 py-1 text-xs outline-none focus:border-[var(--pulse-red)]"
                          autoFocus
                        />
                        <button type="button"
                          onClick={() => handleRename(item.id)}
                          className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-50"
                          title="Save"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="truncate text-xs font-medium text-[var(--pulse-black)]" title={item.name}>
                        {item.name}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-[var(--neutral-500)]">
                      {item.filename}
                    </p>

                    {/* Bottom action row */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex gap-1">
                        <button type="button"
                          onClick={() => startRename(item)}
                          className="rounded p-1 text-[var(--neutral-400)] transition-colors hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]"
                          title="Rename"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <a
                          href={normalizeMediaUrl(item.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1 text-[var(--neutral-400)] transition-colors hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <button type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded p-1 text-[var(--neutral-400)] transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--neutral-200)] bg-white px-4 py-3">
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
        </>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setEditItem(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--neutral-200)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--pulse-black)]">Edit Image</p>
              <button type="button"
                onClick={() => setEditItem(null)}
                className="rounded-lg p-2 text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <EditImageForm
              item={editItem}
              onSave={async (updates) => {
                try {
                  await mediaApi.update(editItem.id, updates);
                  setEditItem(null);
                  refetch();
                } catch (err: any) {
                  alert('Update failed: ' + (err.message || 'Unknown error'));
                }
              }}
              onCancel={() => setEditItem(null)}
            />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[var(--neutral-200)] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--pulse-black)]">{previewItem.name}</p>
                <p className="text-xs text-[var(--neutral-500)]">{previewItem.filename} • {previewItem.type}</p>
              </div>
              <div className="ml-4 flex items-center gap-1">
                <a
                  href={`${normalizeMediaUrl(previewItem.url)}?download=1`}
                  download={previewItem.filename}
                  className="rounded-lg p-2 text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)]"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button type="button"
                  onClick={() => setPreviewItem(null)}
                  className="rounded-lg p-2 text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex items-center justify-center bg-[var(--neutral-50)] p-4">
              {previewItem.type === 'image' ? (
                <img
                  src={normalizeMediaUrl(previewItem.url)}
                  alt={previewItem.name}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-lg"
                />
              ) : previewItem.type === 'video' ? (
                <video
                  src={normalizeMediaUrl(previewItem.url)}
                  controls
                  className="max-h-[60vh] max-w-full rounded-lg"
                />
              ) : previewItem.type === 'audio' ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                    <Music className="h-10 w-10 text-amber-600" />
                  </div>
                  <audio src={normalizeMediaUrl(previewItem.url)} controls className="w-72" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                    <FileText className="h-10 w-10 text-emerald-600" />
                  </div>
                  <p className="text-sm text-[var(--neutral-600)]">Preview not available for this file type</p>
                  <a
                    href={`${normalizeMediaUrl(previewItem.url)}?download=1`}
                    download={previewItem.filename}
                    className="btn btn-primary text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
