'use client';

import { useCallback, useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import { Trash2, Plus, Upload, Play, Terminal, GripVertical, ChevronUp, ChevronDown, Type, ListChecks, Star, AlignLeft, AlignCenter, AlignRight, BarChart3, Image as ImageIcon, MessageSquare, Sun, CloudRain, BrainCircuit, Maximize, MoveVertical, StretchHorizontal, Expand, ExternalLink, Link2, Palette, Layout, MousePointerClick, Type as TypeIcon } from 'lucide-react';
import type { EditorStateAdapter } from '@pulse/editor';
import type { Block, BlockData } from '@pulse/core';
import { type ReferenceStyle, formatReferenceNumber, buildPyodideSrcdoc, CardBlock } from '@pulse/blocks';
import { media as mediaApi } from '@/lib/api-client';
import { createSandboxHtml } from './CodeSandbox';

// ─── Reusable UI helpers ───

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">{children}</label>;
}

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={`w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)] focus:border-[var(--pulse-red)] ${props.className || ''}`}
    />
  );
});

const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(props, ref) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={`w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)] focus:border-[var(--pulse-red)] ${props.className || ''}`}
    />
  );
});

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const { options, ...rest } = props;
  return (
    <select
      {...rest}
      className={`rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1.5 text-xs font-semibold text-[var(--neutral-600)] outline-none ${props.className || ''}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Checkbox({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-2 text-xs text-[var(--neutral-600)]">
      <input type="checkbox" {...props} className="h-4 w-4 accent-[var(--pulse-red)]" />
      {label}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">{title}</p>
      {children}
    </div>
  );
}

function AccordionSection({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon?: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-[var(--neutral-100)] transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-[var(--neutral-700)]">
          {Icon && <Icon className="h-3.5 w-3.5 text-[var(--pulse-red)]" />}
          {title}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--neutral-500)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-[var(--neutral-200)] p-3 space-y-3">{children}</div>}
    </div>
  );
}

const PRESET_COLORS = [
  '#ff2800', '#ff7a00', '#ff0080', '#8e2de2', '#4a00e0',
  '#0061ff', '#60efff', '#134e5e', '#71b280', '#ff9a9e',
  '#373737', '#6c757d', '#ffffff', '#f8f9fa', '#e9ecef',
];

function ColorSwatch({ label, value, onChange, allowClear }: { label: string; value?: string; onChange: (color: string) => void; allowClear?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {allowClear && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Default"
            className={`h-6 w-6 rounded-full border-2 border-[var(--neutral-300)] bg-[var(--neutral-100)] flex items-center justify-center ${!value ? 'ring-2 ring-[var(--pulse-red)]' : ''}`}
          >
            <span className="text-[9px] text-[var(--neutral-500)]">✕</span>
          </button>
        )}
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            title={c}
            className={`h-6 w-6 rounded-full border border-[var(--neutral-200)] ${value === c ? 'ring-2 ring-[var(--pulse-red)] ring-offset-1' : ''}`}
            style={{ background: c }}
          />
        ))}
        <div className="relative h-6 w-6 overflow-hidden rounded-full border border-[var(--neutral-200)]">
          <input
            type="color"
            value={value || '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 h-10 w-10 cursor-pointer border-0 p-0"
          />
        </div>
      </div>
    </div>
  );
}

function AlignButtonGroup({ value, onChange }: { value: 'left' | 'center' | 'right'; onChange: (v: 'left' | 'center' | 'right') => void }) {
  const buttons: { value: 'left' | 'center' | 'right'; icon: React.ReactNode }[] = [
    { value: 'left', icon: <AlignLeft className="h-3.5 w-3.5" /> },
    { value: 'center', icon: <AlignCenter className="h-3.5 w-3.5" /> },
    { value: 'right', icon: <AlignRight className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="inline-flex rounded-lg border border-[var(--neutral-200)] bg-white p-0.5">
      {buttons.map((b) => (
        <button
          key={b.value}
          type="button"
          onClick={() => onChange(b.value)}
          className={`rounded-md px-2 py-1 transition-colors ${
            value === b.value ? 'bg-[var(--pulse-red)] text-white' : 'text-[var(--neutral-500)] hover:bg-[var(--neutral-100)]'
          }`}
          aria-label={`Align ${b.value}`}
        >
          {b.icon}
        </button>
      ))}
    </div>
  );
}

// ─── Color helpers ───

function parseRgba(rgba: string): { r: number; g: number; b: number; a: number } | null {
  const m = rgba.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!m) return null;
  return {
    r: Number(m[1]),
    g: Number(m[2]),
    b: Number(m[3]),
    a: m[4] === undefined ? 1 : Number(m[4]),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function normalizeColorToHex(color?: string): string {
  if (!color) return '#ff2800';
  if (color.startsWith('#')) return color;
  const rgba = parseRgba(color);
  if (rgba) return rgbToHex(rgba.r, rgba.g, rgba.b);
  return '#ff2800';
}

function sanitizeCardUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (['http:', 'https:'].includes(parsed.protocol)) return trimmed;
  } catch {
    if (!trimmed.includes(':') && trimmed.includes('.')) {
      return `https://${trimmed}`;
    }
  }
  return trimmed;
}

// ─── Markdown <-> HTML helpers for inline links ───


function parseRefAttrs(attrs: string): { text?: string; style?: string; target?: string; rel?: string } {
  const result: { text?: string; style?: string; target?: string; rel?: string } = {};
  const textMatch = attrs.match(/text="([^"]*)"/);
  if (textMatch) result.text = textMatch[1];
  const styleMatch = attrs.match(/style="([^"]*)"/);
  if (styleMatch) result.style = styleMatch[1];
  const targetMatch = attrs.match(/target="([^"]*)"/);
  if (targetMatch) result.target = targetMatch[1];
  const relMatch = attrs.match(/rel="([^"]*)"/);
  if (relMatch) result.rel = relMatch[1];
  return result;
}

function escapeHtmlWithInlineCode(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    const backtick = text.indexOf('`', i);
    if (backtick === -1) {
      result += escapeHtml(text.slice(i));
      break;
    }
    result += escapeHtml(text.slice(i, backtick));
    const endBacktick = text.indexOf('`', backtick + 1);
    if (endBacktick === -1) {
      result += escapeHtml(text.slice(backtick));
      break;
    }
    result += `<code>${escapeHtml(text.slice(backtick + 1, endBacktick))}</code>`;
    i = endBacktick + 1;
  }
  return result.replace(/\n/g, '<br>');
}

export function markdownToHtml(text: string): string {
  const regex = /\[([^\]]+)\]\(([^)]+)\)(?:\{([^}]*)\})?/g;
  let html = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let refCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    html += escapeHtmlWithInlineCode(text.slice(lastIndex, match.index));
    const label = match[1];
    const url = match[2];
    const attrs = match[3] || '';

    const targetMatch = attrs.match(/target="([^"]*)"/);
    const target = targetMatch ? targetMatch[1] : '';
    if (label === 'ref') {
      refCounter++;
      const { text: refText, style, rel: refRel } = parseRefAttrs(attrs);
      const num = formatReferenceNumber(refCounter, (style || 'numeric') as ReferenceStyle);
      html += `<span class="pulse-editor-ref pulse-reference-editor" data-url="${escapeHtml(url)}" data-text="${escapeHtml(refText || '')}" data-style="${escapeHtml(style || 'numeric')}"${target ? ` data-target="${escapeHtml(target)}"` : ''}${refRel ? ` data-rel="${escapeHtml(refRel)}"` : ''}>${num}</span>\u200B`;
    } else {
      const relMatch = attrs.match(/rel="([^"]*)"/);
      const rel = relMatch ? relMatch[1] : '';
      html += `<span class="pulse-editor-link" data-url="${escapeHtml(url)}" data-rel="${escapeHtml(rel)}" data-type="link"${target ? ` data-target="${escapeHtml(target)}"` : ''}>${escapeHtml(label)}</span>\u200B`;
    }
    lastIndex = match.index + match[0].length;
  }

  html += escapeHtmlWithInlineCode(text.slice(lastIndex));
  return html;
}

export function htmlToMarkdown(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  // Convert editor ref spans back to markdown
  div.querySelectorAll('span.pulse-editor-ref').forEach((span) => {
    const url = span.getAttribute('data-url') || '';
    const text = span.getAttribute('data-text') || '';
    const style = span.getAttribute('data-style') || '';
    const target = span.getAttribute('data-target') || '';
    const rel = span.getAttribute('data-rel') || '';
    const parts: string[] = [];
    if (text) parts.push(`text="${text}"`);
    if (style && style !== 'numeric') parts.push(`style="${style}"`);
    if (target) parts.push(`target="${target}"`);
    if (rel) parts.push(`rel="${rel}"`);
    const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';
    span.replaceWith(document.createTextNode(`[ref](${url})${attrs}`));
  });

  // Convert editor link spans back to markdown
  const links = div.querySelectorAll('span.pulse-editor-link');
  links.forEach((span) => {
    const url = span.getAttribute('data-url') || '';
    const text = span.textContent || '';
    const rel = span.getAttribute('data-rel') || '';
    const target = span.getAttribute('data-target') || '';
    const parts: string[] = [];
    if (rel) parts.push(`rel="${rel}"`);
    if (target) parts.push(`target="${target}"`);
    const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';
    span.replaceWith(document.createTextNode(`[${text}](${url})${attrs}`));
  });

  // Convert <code> to backticks
  div.querySelectorAll('code').forEach((code) => {
    const content = code.textContent || '';
    code.replaceWith(document.createTextNode(`\`${content}\``));
  });

  // Convert <br> to newlines
  const breaks = div.querySelectorAll('br');
  breaks.forEach((br) => br.replaceWith(document.createTextNode('\n')));

  return (div.textContent || '').replace(/\u200B/g, '');
}

export function getLinkAtCursor(element: HTMLElement): { text: string; url: string; rel: string; target: string } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const node: Node | null = selection.anchorNode;
  if (!node) return null;

  // Walk up to find the closest link span
  let el: HTMLElement | null = node.nodeType === Node.TEXT_NODE ? (node as Text).parentElement : (node as HTMLElement);
  while (el && el !== element) {
    if (el.tagName === 'SPAN' && el.classList.contains('pulse-editor-link')) {
      return {
        text: el.textContent || '',
        url: el.getAttribute('data-url') || '',
        rel: el.getAttribute('data-rel') || '',
        target: el.getAttribute('data-target') || '',
      };
    }
    el = el.parentElement;
  }

  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Upload helper ───

function InlineUploadButton({
  accept,
  uploading,
  onUpload,
}: {
  accept?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
        uploading
          ? 'border-[var(--pulse-jasmine)] bg-[var(--pulse-jasmine-light)] text-[var(--pulse-black)]'
          : 'border-[var(--neutral-200)] bg-white text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]'
      }`}
    >
      <Upload className="h-3.5 w-3.5" />
      {uploading ? 'Uploading…' : 'Upload'}
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}

// ─── Simple blocks ───

export function EditableHorizontalRule() {
  return <hr className="my-2 border-[var(--neutral-200)]" />;
}

export function EditableLink({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { text: string; url: string; openInNewTab: boolean; title?: string; rel?: string; align?: string };
  const align = data.align || 'left';

  const relOpts = {
    nofollow: data.rel?.includes('nofollow') || false,
    noopener: data.rel?.includes('noopener') || false,
    noreferrer: data.rel?.includes('noreferrer') || false,
    external: data.rel?.includes('external') || false,
  };

  const buildRel = (opts: typeof relOpts) => {
    const parts = Object.entries(opts).filter(([_, v]) => v).map(([k]) => k);
    return parts.join(' ') || undefined;
  };

  const setRelOpt = (key: keyof typeof relOpts, checked: boolean) => {
    const next = { ...relOpts, [key]: checked };
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rel: buildRel(next) } }));
  };

  const setOpenInNewTab = (checked: boolean) => {
    const nextRel = { ...relOpts, noopener: checked ? true : relOpts.noopener };
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, openInNewTab: checked, rel: buildRel(nextRel) } }));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={data.text} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: e.target.value } }))} placeholder="Link text" className="flex-1" />
        <Input value={data.url} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, url: e.target.value } }))} placeholder="https://..." className="flex-[2]" />
      </div>
      <div className="flex items-center gap-3">
        <Checkbox label="Open in new tab" checked={data.openInNewTab} onChange={(e) => setOpenInNewTab(e.target.checked)} />
        <Input value={data.title || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Title (optional)" className="flex-1" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className={`flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)] ${data.openInNewTab ? 'opacity-60' : ''}`} title={data.openInNewTab ? 'noopener is required for security when opening in a new tab' : ''}>
          <input type="checkbox" checked={relOpts.noopener} disabled={data.openInNewTab} onChange={(e) => setRelOpt('noopener', e.target.checked)} className="h-4 w-4 accent-[var(--pulse-red)]" />
          noopener
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)]">
          <input type="checkbox" checked={relOpts.noreferrer} onChange={(e) => setRelOpt('noreferrer', e.target.checked)} className="h-4 w-4 accent-[var(--pulse-red)]" />
          noreferrer
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)]">
          <input type="checkbox" checked={relOpts.nofollow} onChange={(e) => setRelOpt('nofollow', e.target.checked)} className="h-4 w-4 accent-[var(--pulse-red)]" />
          nofollow
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)]">
          <input type="checkbox" checked={relOpts.external} onChange={(e) => setRelOpt('external', e.target.checked)} className="h-4 w-4 accent-[var(--pulse-red)]" />
          external
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['left','center','right','justify'] as const).map((a) => (
          <button
            key={a}
            onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, align: a } }))}
            className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
              align === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EditableImage({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as {
    src: string | null;
    alt: string;
    caption?: string;
    width: number;
    height: number;
    fit: string;
    align?: string;
    captionAlign?: string;
    displaySize?: string;
    format?: string;
    compression?: number;
    fileSize?: number;
    mediaAssetId?: string;
    originalWidth?: number;
    originalHeight?: number;
  };
  const align = data.align || 'left';
  const captionAlign = data.captionAlign || 'center';
  const displaySize = data.displaySize || 'large';
  const format = data.format || 'original';
  const compression = data.compression ?? 100;
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Initialize original dimensions if missing (legacy blocks or newly added field)
  useEffect(() => {
    if (data.src && (data.originalWidth == null || data.originalHeight == null) && data.width && data.height) {
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: { ...data, originalWidth: data.width, originalHeight: data.height },
      }));
    }
  }, [data.src, data.width, data.height, data.originalWidth, data.originalHeight, block.id, adapter]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await mediaApi.upload(file);
      const metadata: Record<string, unknown> = {};
      if (format !== 'original') {
        metadata.desiredFormat = format;
      }
      if (compression < 100 && uploaded.width && uploaded.height) {
        metadata.desiredWidth = uploaded.width;
        metadata.desiredHeight = uploaded.height;
      }
      let finalUrl = uploaded.url;
      if (Object.keys(metadata).length > 0) {
        const updated = await mediaApi.update(uploaded.id, { metadata });
        finalUrl = updated.url || uploaded.url;
      }
      // Strip file extension from name for cleaner alt text
      const cleanName = uploaded.name.replace(/\.[^/.]+$/, '') || uploaded.name;
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: {
          ...data,
          src: finalUrl,
          alt: cleanName,
          width: uploaded.width || data.width,
          height: uploaded.height || data.height,
          originalWidth: uploaded.width || data.width,
          originalHeight: uploaded.height || data.height,
          fileSize: uploaded.size,
          mediaAssetId: uploaded.id,
        },
      }));
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleResetSizes = () => {
    const ow = data.originalWidth || data.width;
    const oh = data.originalHeight || data.height;
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, width: ow, height: oh } }));
  };

  const handleApplyFormat = async () => {
    const assetId = data.mediaAssetId;
    if (!assetId) {
      alert('Please re-upload the image to apply format changes.');
      return;
    }
    setProcessing(true);
    try {
      const metadata: Record<string, unknown> = {};
      if (format !== 'original') {
        metadata.desiredFormat = format;
      } else {
        metadata.desiredFormat = null;
      }
      if (typeof compression === 'number') {
        metadata.desiredQuality = compression;
      }
      const updated = await mediaApi.update(assetId, { metadata });
      const processedSize = (updated.metadata?.processedFileSize as number | undefined) ?? data.fileSize;
      // Cache-bust by appending a query param to the src
      const srcBase = (data.src || '').split('?')[0];
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: {
          ...data,
          src: srcBase ? `${srcBase}?v=${Date.now()}` : data.src,
          fileSize: processedSize,
        },
      }));
    } catch (err) {
      alert('Processing failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyCompression = async () => {
    const assetId = data.mediaAssetId;
    if (!assetId) {
      alert('Please re-upload the image to apply compression.');
      return;
    }
    setProcessing(true);
    try {
      const metadata: Record<string, unknown> = {};
      metadata.desiredQuality = compression;
      if (format !== 'original') {
        metadata.desiredFormat = format;
      }
      const updated = await mediaApi.update(assetId, { metadata });
      const processedSize = (updated.metadata?.processedFileSize as number | undefined) ?? data.fileSize;
      const srcBase = (data.src || '').split('?')[0];
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: {
          ...data,
          src: srcBase ? `${srcBase}?v=${Date.now()}` : data.src,
          fileSize: processedSize,
        },
      }));
    } catch (err) {
      alert('Processing failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setProcessing(false);
    }
  };

  const handleWidthChange = (val: number) => {
    const newWidth = val;
    let newHeight = data.height;
    if (data.height > 0 && data.width > 0) {
      const ratio = data.height / data.width;
      newHeight = Math.max(1, Math.round(newWidth * ratio));
    }
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, width: newWidth, height: newHeight } }));
  };

  const handleHeightChange = (val: number) => {
    const newHeight = val;
    let newWidth = data.width;
    if (data.width > 0 && data.height > 0) {
      const ratio = data.width / data.height;
      newWidth = Math.max(1, Math.round(newHeight * ratio));
    }
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, width: newWidth, height: newHeight } }));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const estimatedFileSize = (() => {
    if (!data.fileSize) return null;
    // Rough heuristic: lower quality = smaller file (JPEG/WebP). PNG is lossless so quality has less effect.
    const formatMultiplier = format === 'png' ? 0.6 + (compression / 100) * 0.4 : 0.25 + (compression / 100) * 0.75;
    return Math.round(data.fileSize * formatMultiplier);
  })();

  return (
    <div className="space-y-2">
      {/* Source */}
      <div className="flex gap-2">
        <Input value={data.src || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, src: e.target.value || null } }))} placeholder="Image URL" className="flex-1" />
        <InlineUploadButton accept="image/*" uploading={uploading} onUpload={handleUpload} />
      </div>

      {/* Meta */}
      <div className="flex gap-2">
        <Input value={data.alt} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, alt: e.target.value } }))} placeholder="Alt text" className="flex-1" />
        <div className="flex-1">
          <TextArea
            value={data.caption || ''}
            onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, caption: e.target.value } }))}
            placeholder="Caption"
            rows={2}
          />
          <div className="mt-0.5 text-right text-[10px] text-[var(--neutral-400)]">
            {(data.caption || '').length} chars
          </div>
        </div>
      </div>

      {/* Preview */}
      {data.src && (
        <div className="rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-2">
          <img src={data.src} alt={data.alt} className="h-28 w-full rounded-md" style={{ objectFit: data.fit as any }} />
          <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--neutral-500)]">
            <span>{data.width} × {data.height}</span>
            <span className="flex items-center gap-1.5">
              {data.fileSize ? (
                <>
                  <span className="text-[var(--neutral-400)]">Original: {formatFileSize(data.fileSize)}</span>
                  {estimatedFileSize && estimatedFileSize !== data.fileSize ? (
                    <span className="font-semibold text-[var(--pulse-red)]">→ {formatFileSize(estimatedFileSize)}</span>
                  ) : null}
                </>
              ) : null}
            </span>
          </div>
        </div>
      )}

      {/* Dimensions + Fit */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Label>W</Label>
          <Input type="number" value={data.width} onChange={(e) => handleWidthChange(Number(e.target.value) || 1)} className="w-20" />
        </div>
        <div className="flex items-center gap-1">
          <Label>H</Label>
          <Input type="number" value={data.height} onChange={(e) => handleHeightChange(Number(e.target.value) || 1)} className="w-20" />
        </div>
        <button
          type="button"
          onClick={handleResetSizes}
          title="Reset to original dimensions"
          className="flex h-8 items-center justify-center rounded-md border border-[var(--neutral-200)] bg-white px-2 text-[10px] font-semibold text-[var(--neutral-500)] hover:bg-[var(--neutral-50)]"
        >
          Reset
        </button>
        <Select
          value={data.fit}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, fit: e.target.value } }))}
          options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Fill' }]}
          className="ml-2"
        />
      </div>

      {/* Display controls: Size + Align + Caption align */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Size</span>
          {(['small','medium','large','full'] as const).map((s) => (
            <button
              key={s}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, displaySize: s } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                displaySize === s ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Align</span>
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, align: a } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                align === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Caption</span>
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, captionAlign: a } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                captionAlign === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Format + Quality */}
      <div className="rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-2 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Format</span>
            <Select
              value={format}
              onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, format: e.target.value } }))}
              options={[
                { value: 'original', label: 'Original' },
                { value: 'webp', label: 'WebP' },
                { value: 'jpeg', label: 'JPEG' },
                { value: 'png', label: 'PNG' },
              ]}
            />
          </div>
          <button
            type="button"
            onClick={handleApplyFormat}
            disabled={processing || !data.mediaAssetId}
            className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--pulse-red)] text-white disabled:bg-[var(--neutral-200)] disabled:text-[var(--neutral-400)] disabled:cursor-not-allowed"
          >
            {processing ? 'Processing…' : 'Apply'}
          </button>
          <div className="flex flex-1 items-center gap-2">
            <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Quality</span>
            <input
              type="range"
              min={0}
              max={100}
              value={compression}
              onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, compression: Number(e.target.value) } }))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--neutral-200)] accent-[var(--pulse-red)]"
            />
            <span className="w-8 text-right text-[10px] font-semibold text-[var(--neutral-600)]">{compression}</span>
            <button
              type="button"
              onClick={handleApplyCompression}
              disabled={processing || !data.mediaAssetId}
              className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--pulse-red)] text-white disabled:bg-[var(--neutral-200)] disabled:text-[var(--neutral-400)] disabled:cursor-not-allowed"
            >
              {processing ? '…' : 'Apply'}
            </button>
          </div>
        </div>
        {data.fileSize ? (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--neutral-500)]">
              Estimated: <span className="font-semibold text-[var(--pulse-red)]">{formatFileSize(estimatedFileSize || data.fileSize)}</span>
              {format !== 'original' ? ` (${format.toUpperCase()})` : null}
            </span>
            <span className="text-[var(--neutral-400)]">{compression < 50 ? 'High compression' : compression < 85 ? 'Balanced' : 'High quality'}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function EditableVideo({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as {
    url: string;
    provider: string;
    title: string;
    caption?: string;
    captionAlign?: string;
    autoplay: boolean;
    startAtSeconds: number;
    privacyMode?: boolean;
    quality?: string;
    poster?: string;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
  };
  const captionAlign = data.captionAlign || 'center';
  const [uploading, setUploading] = useState(false);
  const [posterUploading, setPosterUploading] = useState(false);

  const handleUpload = async (file: File) => {
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('Video too large (max 100MB). Please compress or use a URL instead.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await mediaApi.upload(file);
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: { ...data, url: uploaded.url, title: uploaded.name, provider: 'html5' },
      }));
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handlePosterUpload = async (file: File) => {
    setPosterUploading(true);
    try {
      const uploaded = await mediaApi.upload(file);
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: { ...data, poster: uploaded.url },
      }));
    } catch (err) {
      alert('Poster upload failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPosterUploading(false);
    }
  };

  const parseTimeToSeconds = (value: string): number => {
    const parts = value.split(':').map((p) => parseInt(p.trim(), 10));
    if (parts.some((p) => Number.isNaN(p) || p < 0)) return 0;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 1) return parts[0];
    return 0;
  };

  const formatSecondsToTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const timeValue = formatSecondsToTime(data.startAtSeconds || 0);

  const getYouTubeThumbnail = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  };

  const thumbnailUrl = data.provider === 'youtube' ? getYouTubeThumbnail(data.url) : null;

  return (
    <div className="space-y-2">
      {/* Source */}
      <div className="flex gap-2">
        <Input value={data.url} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, url: e.target.value } }))} placeholder="Video URL" className="flex-[2]" />
        <Select
          value={data.provider}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, provider: e.target.value } }))}
          options={[{ value: 'youtube', label: 'YouTube' }, { value: 'vimeo', label: 'Vimeo' }, { value: 'html5', label: 'HTML5' }]}
        />
        <InlineUploadButton accept="video/*" uploading={uploading} onUpload={handleUpload} />
      </div>

      {/* Meta */}
      <div className="flex gap-2">
        <Input value={data.title} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Video title" className="flex-1" />
        <Input value={data.caption || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, caption: e.target.value } }))} placeholder="Caption (optional)" className="flex-1" />
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Checkbox label="Autoplay" checked={data.autoplay} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, autoplay: e.target.checked } }))} />
        {data.provider === 'youtube' && (
          <Checkbox label="Privacy mode" checked={data.privacyMode ?? true} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, privacyMode: e.target.checked } }))} />
        )}
        {data.provider === 'html5' && (
          <>
            <Checkbox label="Loop" checked={data.loop ?? false} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, loop: e.target.checked } }))} />
            <Checkbox label="Muted" checked={data.muted ?? false} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, muted: e.target.checked } }))} />
            <Checkbox label="Controls" checked={data.controls ?? true} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, controls: e.target.checked } }))} />
          </>
        )}
      </div>

      {/* Caption alignment */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Caption</span>
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, captionAlign: a } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                captionAlign === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Quality row */}
      <div className="flex flex-wrap items-center gap-2">
        {data.provider === 'html5' && (
          <Select
            value={data.quality || 'auto'}
            onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, quality: e.target.value } }))}
            options={[{ value: 'auto', label: 'Quality: Auto' }, { value: '720p', label: '720p' }, { value: '1080p', label: '1080p' }, { value: '4k', label: '4K' }]}
          />
        )}
        <div className="flex items-center gap-1">
          <Label>Start at</Label>
          <Input
            type="text"
            placeholder="00:00"
            value={timeValue}
            onChange={(e) => {
              const seconds = parseTimeToSeconds(e.target.value);
              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, startAtSeconds: seconds } }));
            }}
            className="w-24"
          />
        </div>
        {data.provider === 'html5' && (
          <div className="flex flex-1 items-center gap-2">
            <Input value={data.poster || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, poster: e.target.value } }))} placeholder="Poster URL" className="flex-1" />
            <InlineUploadButton accept="image/*" uploading={posterUploading} onUpload={handlePosterUpload} />
          </div>
        )}
      </div>

      {/* Preview */}
      {data.url && (
        <div className="relative mt-2 overflow-hidden rounded-lg border border-[var(--neutral-200)] bg-black">
          <div className="aspect-video w-full">
            {data.provider === 'html5' ? (
              <video src={data.url} className="h-full w-full object-contain" preload="metadata" />
            ) : thumbnailUrl ? (
              <img src={thumbnailUrl} alt={data.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-[var(--neutral-500)]">
                Preview unavailable
              </div>
            )}
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pulse-red)]/90 text-white shadow-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EditableAudio({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as {
    src: string;
    title: string;
    artist?: string;
    caption?: string;
    autoplay: boolean;
    loop: boolean;
    coverUrl?: string;
    align?: string;
    captionAlign?: string;
    mediaAssetId?: string;
    fileSize?: number;
    linkUrl?: string;
  };
  const align = data.align || 'center';
  const captionAlign = data.captionAlign || 'center';
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const handleUpload = async (file: File) => {
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('Audio too large (max 10MB). Please compress or use a URL instead.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await mediaApi.upload(file);
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: {
          ...data,
          src: uploaded.url,
          title: uploaded.name.replace(/\.[^/.]+$/, '') || uploaded.name,
          fileSize: uploaded.size,
          mediaAssetId: uploaded.id,
        },
      }));
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true);
    try {
      const uploaded = await mediaApi.upload(file);
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: { ...data, coverUrl: uploaded.url },
      }));
    } catch (err) {
      alert('Cover upload failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setCoverUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Title */}
      <div>
        <Label>Track Title</Label>
        <Input value={data.title} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Enter track title" />
      </div>

      {/* Audio source */}
      <div>
        <Label>Audio File</Label>
        <div className="flex gap-2">
          <Input value={data.src} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, src: e.target.value } }))} placeholder="https://… or /api/media/file/…" className="flex-1" />
          <InlineUploadButton accept="audio/*" uploading={uploading} onUpload={handleUpload} />
        </div>
      </div>

      {/* Artist & Caption */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Artist</Label>
          <Input value={data.artist || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, artist: e.target.value } }))} placeholder="Artist name" />
        </div>
        <div>
          <Label>Caption</Label>
          <Input value={data.caption || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, caption: e.target.value } }))} placeholder="Short caption" />
        </div>
      </div>

      {/* Cover art */}
      <div>
        <Label>Cover Art</Label>
        <div className="flex gap-2">
          <Input value={data.coverUrl || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, coverUrl: e.target.value } }))} placeholder="https://… (optional)" className="flex-1" />
          <InlineUploadButton accept="image/*" uploading={coverUploading} onUpload={handleCoverUpload} />
        </div>
      </div>

      {/* Source link */}
      <div>
        <Label>Source Link</Label>
        <Input value={data.linkUrl || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, linkUrl: e.target.value } }))} placeholder="https://… (optional external link)" />
      </div>

      {/* Alignment */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Align</span>
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, align: a } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                align === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Caption</span>
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, captionAlign: a } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                captionAlign === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center gap-5 pt-1">
        <Checkbox label="Autoplay" checked={data.autoplay} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, autoplay: e.target.checked } }))} />
        <Checkbox label="Loop" checked={data.loop} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, loop: e.target.checked } }))} />
      </div>

      {/* Live preview */}
      {data.src && (
        <div className="mt-2 rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-400)]">Preview</p>
            {data.fileSize ? (
              <span className="text-[10px] text-[var(--neutral-500)]">
                Size: <span className="font-semibold">{formatFileSize(data.fileSize)}</span>
              </span>
            ) : null}
          </div>
          <audio controls preload="metadata" src={data.src} className="w-full" style={{ height: 36 }} />
        </div>
      )}
    </div>
  );
}

export function EditableEmbed({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { url: string; title: string; provider: string; aspectRatio: string; allowFullscreen: boolean };
  const providerIcon = (() => {
    const p = data.provider.toLowerCase();
    if (p.includes('youtube')) return '🎬';
    if (p.includes('vimeo')) return '🎞️';
    if (p.includes('spotify')) return '🎵';
    if (p.includes('twitter') || p.includes('x')) return '🐦';
    if (p.includes('instagram')) return '📷';
    if (p.includes('tiktok')) return '🎵';
    if (p.includes('twitch')) return '🎮';
    if (p.includes('figma')) return '🎨';
    if (p.includes('codepen')) return '💻';
    if (p.includes('github')) return '🐙';
    return '🔲';
  })();

  return (
    <div className="space-y-3">
      {/* Title */}
      <div>
        <Label>Title</Label>
        <Input value={data.title} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Embedded content title" />
      </div>

      {/* URL + Provider */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div>
          <Label>URL</Label>
          <Input value={data.url} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, url: e.target.value } }))} placeholder="https://…" />
        </div>
        <div>
          <Label>Provider</Label>
          <Input value={data.provider} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, provider: e.target.value } }))} placeholder="e.g. YouTube" className="w-32" />
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Ratio</span>
          {(['16:9','4:3','1:1','21:9'] as const).map((r) => (
            <button
              key={r}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, aspectRatio: r } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                data.aspectRatio === r ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <Checkbox label="Allow fullscreen" checked={data.allowFullscreen} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, allowFullscreen: e.target.checked } }))} />
      </div>

      {/* Preview */}
      {data.url && (
        <div className="rounded-xl border border-[var(--neutral-200)] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--neutral-50)] border-b border-[var(--neutral-200)]">
            <span className="text-base">{providerIcon}</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-red)]">{data.provider}</span>
              <span className="text-xs font-semibold text-[var(--neutral-700)] truncate">{data.title}</span>
            </div>
          </div>
          <div className="relative bg-black" style={{ paddingTop: data.aspectRatio === '16:9' ? '56.25%' : data.aspectRatio === '4:3' ? '75%' : data.aspectRatio === '1:1' ? '100%' : '42.86%' }}>
            <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--neutral-500)]">
              <div className="text-center">
                <div className="text-2xl mb-1">{providerIcon}</div>
                <p>Preview: {data.aspectRatio}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EditableFile({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as {
    name: string;
    url: string;
    sizeBytes?: number;
    mimeType?: string;
    description?: string;
    openInNewTab: boolean;
    enablePreview?: boolean;
    descriptionAlign?: string;
    linkUrl?: string;
    align?: string;
  };
  const descriptionAlign = data.descriptionAlign || 'left';
  const align = data.align || 'left';
  const [uploading, setUploading] = useState(false);

  // Link / Ref modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await mediaApi.upload(file);
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: {
          ...data,
          url: uploaded.url,
          name: uploaded.name,
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.size,
        },
      }));
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatMimeFriendly = (mimeType?: string) => {
    if (!mimeType) return '';
    const map: Record<string, string> = {
      'application/pdf': 'PDF Document',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'application/vnd.ms-excel': 'Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
      'application/vnd.ms-powerpoint': 'PowerPoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
      'application/zip': 'ZIP Archive',
    };
    if (map[mimeType]) return map[mimeType];
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('text/')) return 'Text File';
    return mimeType.replace(/^application\//, '');
  };

  const insertAtCursor = (text: string) => {
    const el = descRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = data.description || '';
    const next = before.slice(0, start) + text + before.slice(end);
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, description: next } }));
    // Restore cursor after insertion
    requestAnimationFrame(() => {
      const pos = start + text.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="space-y-3">
      {/* File name + URL + upload */}
      <div>
        <Label>File</Label>
        <div className="flex gap-2">
          <Input value={data.name} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, name: e.target.value } }))} placeholder="File name" className="flex-1" />
          <Input value={data.url} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, url: e.target.value } }))} placeholder="File URL" className="flex-[2]" />
          <InlineUploadButton uploading={uploading} onUpload={handleUpload} />
        </div>
      </div>

      {/* File metadata */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2">
        {data.mimeType ? (
          <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-600)] border border-[var(--neutral-200)]">
            {formatMimeFriendly(data.mimeType)}
          </span>
        ) : null}
        {typeof data.sizeBytes === 'number' ? (
          <span className="text-[10px] font-semibold text-[var(--pulse-red)]">
            {formatFileSize(data.sizeBytes)}
          </span>
        ) : null}
        {!data.mimeType && data.sizeBytes == null ? (
          <span className="text-[10px] text-[var(--neutral-400)]">Upload a file to see metadata</span>
        ) : null}
      </div>

      {/* Description with markdown link/ref support */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label>Description</Label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLinkModalOpen(true)}
              className="rounded-md bg-[var(--neutral-100)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-600)] hover:bg-[var(--neutral-200)]"
              title="Insert link [text](url)"
            >
              Link
            </button>
            <button
              onClick={() => setRefModalOpen(true)}
              className="rounded-md bg-[var(--neutral-100)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-600)] hover:bg-[var(--neutral-200)]"
              title="Insert reference [ref](url)"
            >
              Ref
            </button>
          </div>
        </div>
        <TextArea
          ref={descRef}
          value={data.description || ''}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, description: e.target.value } }))}
          placeholder="Short description (optional). Supports [links](https://…) and [ref](https://…){style=&quot;numeric&quot;}"
          rows={3}
        />
        <p className="mt-1 text-[10px] text-[var(--neutral-400)]">
          Tip: Use [label](url) for links and [ref](url){`{style="numeric"}`} for citations.
        </p>
      </div>

      {/* Source link */}
      <div>
        <Label>Source Link</Label>
        <Input value={data.linkUrl || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, linkUrl: e.target.value } }))} placeholder="https://… (optional external link)" />
      </div>

      {/* Align + Description alignment */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Align</span>
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, align: a } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                align === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Desc</span>
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, descriptionAlign: a } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                descriptionAlign === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
        <Checkbox label="Open in new tab" checked={data.openInNewTab} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, openInNewTab: e.target.checked } }))} />
        <Checkbox label="Enable preview" checked={data.enablePreview ?? false} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, enablePreview: e.target.checked } }))} />
      </div>

      {/* Link Modal */}
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        defaultText="link text"
        onConfirm={(url, rel, target) => {
          const parts: string[] = [];
          if (rel) parts.push(`rel="${rel}"`);
          if (target) parts.push(`target="${target}"`);
          const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';
          insertAtCursor(`[link text](${url})${attrs}`);
          setLinkModalOpen(false);
        }}
      />

      {/* Ref Modal */}
      <RefModal
        isOpen={refModalOpen}
        onClose={() => setRefModalOpen(false)}
        onConfirm={(url, text, style, target, rel) => {
          const parts: string[] = [];
          if (text) parts.push(`text="${text}"`);
          if (style && style !== 'numeric') parts.push(`style="${style}"`);
          if (target) parts.push(`target="${target}"`);
          if (rel) parts.push(`rel="${rel}"`);
          const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';
          insertAtCursor(`[ref](${url})${attrs}`);
          setRefModalOpen(false);
        }}
      />
    </div>
  );
}

// ─── Structured data blocks ───

export function EditableTable({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as {
    columns: string[];
    rows: string[][];
    caption?: string;
    captionAlign?: string;
    columnAligns?: string[];
  };
  const captionAlign = data.captionAlign || 'left';
  const columnAligns = data.columnAligns || [];

  const [focusedCell, setFocusedCell] = useState<{ ri: number; ci: number } | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const setCellRef = (ri: number, ci: number, el: HTMLInputElement | null) => {
    const key = `${ri}-${ci}`;
    if (el) cellRefs.current.set(key, el);
    else cellRefs.current.delete(key);
  };

  const insertIntoCell = (ri: number, ci: number, text: string) => {
    const key = `${ri}-${ci}`;
    const el = cellRefs.current.get(key);
    const currentValue = data.rows[ri]?.[ci] || '';
    const start = el ? el.selectionStart ?? currentValue.length : currentValue.length;
    const end = el ? el.selectionEnd ?? currentValue.length : currentValue.length;
    const nextValue = currentValue.slice(0, start) + text + currentValue.slice(end);

    const nextRows = data.rows.map((r, rIdx) =>
      rIdx === ri ? r.map((c, cIdx) => (cIdx === ci ? nextValue : c)) : r,
    );
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rows: nextRows } }));

    requestAnimationFrame(() => {
      const newEl = cellRefs.current.get(key);
      if (newEl) {
        newEl.focus();
        const pos = start + text.length;
        newEl.setSelectionRange(pos, pos);
      }
    });
  };

  const getFocusedCellValue = (): { ri: number; ci: number } | null => {
    if (focusedCell) return focusedCell;
    // Fallback: try to find focused element
    const active = document.activeElement;
    if (active && active.tagName === 'INPUT') {
      for (const [key, el] of cellRefs.current) {
        if (el === active) {
          const [ri, ci] = key.split('-').map(Number);
          return { ri, ci };
        }
      }
    }
    return null;
  };

  const handleInsertLink = () => {
    const cell = getFocusedCellValue();
    if (cell) {
      setFocusedCell(cell);
      setLinkModalOpen(true);
    } else {
      setLinkModalOpen(true);
    }
  };

  const handleInsertRef = () => {
    const cell = getFocusedCellValue();
    if (cell) {
      setFocusedCell(cell);
      setRefModalOpen(true);
    } else {
      setRefModalOpen(true);
    }
  };

  const setColumnAlign = (ci: number, align: 'left' | 'center' | 'right') => {
    const next = [...columnAligns];
    while (next.length <= ci) next.push('left');
    next[ci] = align;
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, columnAligns: next } }));
  };

  return (
    <div className="space-y-3">
      {/* Caption with alignment */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label>Caption</Label>
          <div className="flex items-center gap-1">
            {(['left','center','right'] as const).map((a) => (
              <button
                key={a}
                onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, captionAlign: a } }))}
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  captionAlign === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-500)]'
                }`}
              >
                {a[0]}
              </button>
            ))}
          </div>
        </div>
        <Input
          value={data.caption || ''}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, caption: e.target.value } }))}
          placeholder="Table caption (optional)"
        />
      </div>

      {/* Column headers with alignment */}
      <Section title={`Columns (${data.columns.length})`}>
        <div className="space-y-2">
          {data.columns.map((col, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={col}
                onChange={(e) => {
                  const next = [...data.columns];
                  next[i] = e.target.value;
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, columns: next } }));
                }}
                placeholder={`Column ${i + 1}`}
                className="flex-1 text-xs"
              />
              <div className="flex items-center gap-0.5">
                {(['left','center','right'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setColumnAlign(i, a)}
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      (columnAligns[i] || 'left') === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-500)]'
                    }`}
                    title={`Align ${a}`}
                  >
                    {a[0]}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  const next = data.columns.filter((_, idx) => idx !== i);
                  if (next.length === 0) return;
                  const rows = data.rows.map((r) => r.filter((_, idx) => idx !== i));
                  const nextAligns = columnAligns.filter((_, idx) => idx !== i);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, columns: next, rows, columnAligns: nextAligns } }));
                }}
                className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => adapter.updateBlock(block.id, (b) => ({
              ...b,
              data: {
                ...data,
                columns: [...data.columns, `Column ${data.columns.length + 1}`],
                rows: data.rows.map((r) => [...r, '']),
                columnAligns: [...columnAligns, 'left'],
              },
            }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
          >
            <Plus className="h-3 w-3" /> Column
          </button>
        </div>
      </Section>

      {/* Cell toolbar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Cell tools</span>
        <button
          onClick={handleInsertLink}
          className="rounded-md bg-[var(--neutral-100)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-600)] hover:bg-[var(--neutral-200)]"
        >
          Link
        </button>
        <button
          onClick={handleInsertRef}
          className="rounded-md bg-[var(--neutral-100)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-600)] hover:bg-[var(--neutral-200)]"
        >
          Ref
        </button>
        <span className="text-[10px] text-[var(--neutral-400)]">
          {focusedCell ? `Editing R${focusedCell.ri + 1}C${focusedCell.ci + 1}` : 'Click a cell to edit'}
        </span>
      </div>

      {/* Rows grid */}
      <Section title={`Rows (${data.rows.length})`}>
        <div className="space-y-1">
          {data.rows.map((row, ri) => (
            <div key={ri} className="flex items-center gap-1">
              <span className="w-5 text-[10px] font-bold text-[var(--neutral-400)]">{ri + 1}</span>
              {row.map((cell, ci) => (
                <Input
                  key={ci}
                  ref={(el) => setCellRef(ri, ci, el)}
                  value={cell}
                  onChange={(e) => {
                    const next = data.rows.map((r, rIdx) =>
                      rIdx === ri ? r.map((c, cIdx) => (cIdx === ci ? e.target.value : c)) : r,
                    );
                    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rows: next } }));
                  }}
                  onFocus={() => setFocusedCell({ ri, ci })}
                  className="min-w-0 flex-1 text-xs py-1"
                  placeholder={data.columns[ci] || `C${ci + 1}`}
                />
              ))}
              <button
                onClick={() => {
                  const next = data.rows.filter((_, idx) => idx !== ri);
                  adapter.updateBlock(block.id, (b) => ({
                    ...b,
                    data: { ...data, rows: next.length ? next : [data.columns.map(() => '')] },
                  }));
                }}
                className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => adapter.updateBlock(block.id, (b) => ({
              ...b,
              data: { ...data, rows: [...data.rows, data.columns.map(() => '')] },
            }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
          >
            <Plus className="h-3 w-3" /> Row
          </button>
        </div>
      </Section>

      {/* Link Modal for cells */}
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        defaultText="link"
        onConfirm={(url, rel, target) => {
          const cell = getFocusedCellValue();
          if (cell) {
            const parts: string[] = [];
            if (rel) parts.push(`rel="${rel}"`);
            if (target) parts.push(`target="${target}"`);
            const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';
            insertIntoCell(cell.ri, cell.ci, `[link](${url})${attrs}`);
          }
          setLinkModalOpen(false);
        }}
      />

      {/* Ref Modal for cells */}
      <RefModal
        isOpen={refModalOpen}
        onClose={() => setRefModalOpen(false)}
        onConfirm={(url, text, style, target, rel) => {
          const cell = getFocusedCellValue();
          if (cell) {
            const parts: string[] = [];
            if (text) parts.push(`text="${text}"`);
            if (style && style !== 'numeric') parts.push(`style="${style}"`);
            if (target) parts.push(`target="${target}"`);
            if (rel) parts.push(`rel="${rel}"`);
            const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';
            insertIntoCell(cell.ri, cell.ci, `[ref](${url})${attrs}`);
          }
          setRefModalOpen(false);
        }}
      />
    </div>
  );
}

export function EditableAlert({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { severity: string; title?: string; message: string; dismissible: boolean; isDismissed: boolean; align?: string };
  const align = data.align || 'left';
  const severityColors: Record<string, string> = {
    info: 'border-t-4 border-sky-400 bg-sky-50/60',
    success: 'border-t-4 border-emerald-400 bg-emerald-50/60',
    warning: 'border-t-4 border-amber-400 bg-amber-50/60',
    error: 'border-t-4 border-red-400 bg-red-50/60',
  };
  return (
    <div className={`space-y-3 rounded-xl p-4 ${severityColors[data.severity] || severityColors.info}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
        Alert banner — shown to readers, can be dismissed
      </p>
      <div className="flex items-center gap-2">
        {(['info', 'success', 'warning', 'error'] as const).map((s) => (
          <button key={s} onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, severity: s } }))}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${data.severity === s ? 'bg-white/80 text-[var(--pulse-black)]' : 'bg-white/40 text-[var(--neutral-600)]'}`}>
            {s}
          </button>
        ))}
      </div>
      <Input value={data.title || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Alert title (optional)" />
      <TextArea value={data.message} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, message: e.target.value } }))} placeholder="Alert message..." rows={2} />
      <div className="flex flex-wrap gap-4">
        <Checkbox label="Allow readers to dismiss" checked={data.dismissible} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, dismissible: e.target.checked } }))} />
        <Checkbox label="Hidden by default (already dismissed)" checked={data.isDismissed} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, isDismissed: e.target.checked } }))} />
      </div>
      <div className="flex flex-wrap gap-2">
        {(['left','center','right','justify'] as const).map((a) => (
          <button
            key={a}
            onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, align: a } }))}
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              align === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-white text-[var(--neutral-600)]'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EditableCallout({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { variant: string; title?: string; body: string; align?: string };
  const align = data.align || 'left';
  const variantColors: Record<string, string> = {
    note: 'border-l-4 border-violet-400 bg-violet-50/50',
    info: 'border-l-4 border-blue-400 bg-blue-50/50',
    tip: 'border-l-4 border-amber-400 bg-amber-50/50',
    warning: 'border-l-4 border-orange-400 bg-orange-50/50',
    success: 'border-l-4 border-emerald-400 bg-emerald-50/50',
  };
  return (
    <div className={`rounded-xl p-4 ${variantColors[data.variant] || variantColors.note}`}>
      <div className="mb-2 flex items-center gap-2">
        {(['note', 'info', 'tip', 'warning', 'success'] as const).map((v) => (
          <button
            key={v}
            onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, variant: v } }))}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              data.variant === v ? 'bg-white/80 text-[var(--pulse-black)]' : 'bg-white/40 text-[var(--neutral-600)]'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <Input
        value={data.title || ''}
        onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))}
        placeholder="Title (optional)"
        className="mb-2 text-sm font-bold"
      />
      <TextArea
        value={data.body}
        onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, body: e.target.value } }))}
        rows={2}
        placeholder="Body text..."
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {(['left','center','right','justify'] as const).map((a) => (
          <button
            key={a}
            onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, align: a } }))}
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              align === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-white text-[var(--neutral-600)]'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EditableToggle({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { label: string; content: string; defaultOn: boolean };
  return (
    <div className="space-y-2">
      <Input value={data.label} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, label: e.target.value } }))} placeholder="Toggle label" />
      <TextArea value={data.content} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, content: e.target.value } }))} placeholder="Content shown when toggled on..." rows={3} />
      <Checkbox label="On by default" checked={data.defaultOn} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, defaultOn: e.target.checked } }))} />
    </div>
  );
}

export function EditableSpoiler({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { label: string; content: string; revealed: boolean };
  return (
    <div className="space-y-2">
      <Input value={data.label} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, label: e.target.value } }))} placeholder="Spoiler label" />
      <TextArea value={data.content} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, content: e.target.value } }))} placeholder="Hidden spoiler content..." rows={3} />
      <Checkbox label="Revealed by default" checked={data.revealed} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, revealed: e.target.checked } }))} />
    </div>
  );
}

export function EditableCard({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const raw = block.data as {
    title: string;
    body: string;
    backgroundType?: 'image' | 'solid' | 'gradient';
    backgroundImageUrl?: string;
    backgroundImageFit?: 'cover' | 'fill' | 'fit';
    backgroundColor?: string;
    backgroundGradient?: string;
    geometricForm?: string;
    geometricSvg?: string;
    geometricPosition?: string;
    geometricColor?: string;
    geometricOpacity?: number;
    titleColor?: string;
    bodyColor?: string;
    titleAlign?: 'left' | 'center' | 'right';
    bodyAlign?: 'left' | 'center' | 'right';
    titleSize?: 'sm' | 'md' | 'lg' | 'xl';
    bodySize?: 'sm' | 'md' | 'lg';
    ctaLabel?: string;
    ctaLinkUrl?: string;
    ctaAlign?: 'left' | 'center' | 'right';
    ctaStyle?: 'filled' | 'outline' | 'ghost' | 'link';
    ctaBgColor?: string;
    ctaTextColor?: string;
    ctaBorderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'pill';
    ctaTarget?: '_self' | '_blank';
    cardPadding?: 'sm' | 'md' | 'lg' | 'xl';
    cardRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    imageScrimOpacity?: number;
    overlayText?: string;
    overlayAlign?: string;
    overlayFontSize?: string;
    // Legacy fields
    mediaUrl?: string;
    linkUrl?: string;
  };
  const data = {
    ...raw,
    backgroundType: raw.backgroundType || (raw.mediaUrl ? 'image' : 'solid'),
    backgroundImageUrl: raw.backgroundImageUrl || raw.mediaUrl,
    backgroundImageFit: raw.backgroundImageFit || 'cover',
    backgroundColor: raw.backgroundColor || '#ffffff',
    ctaLinkUrl: raw.ctaLinkUrl || raw.linkUrl,
    ctaAlign: raw.ctaAlign || 'center',
    ctaStyle: raw.ctaStyle || 'filled',
    ctaBorderRadius: raw.ctaBorderRadius || 'pill',
    ctaTarget: raw.ctaTarget || '_blank',
    overlayAlign: raw.overlayAlign || 'center',
    overlayFontSize: raw.overlayFontSize || 'md',
    geometricForm: raw.geometricForm || 'none',
    geometricPosition: raw.geometricPosition || 'top-right',
    geometricColor: normalizeColorToHex(raw.geometricColor),
    geometricOpacity: raw.geometricOpacity ?? 0.15,
    titleAlign: raw.titleAlign || 'left',
    bodyAlign: raw.bodyAlign || 'left',
    titleSize: raw.titleSize || 'lg',
    bodySize: raw.bodySize || 'md',
    cardPadding: raw.cardPadding || 'md',
    cardRadius: raw.cardRadius || 'lg',
    imageScrimOpacity: raw.imageScrimOpacity ?? 0.5,
  };
  const [uploading, setUploading] = useState(false);
  const [gradientMode, setGradientMode] = useState<'presets' | 'builder' | 'raw'>(
    data.backgroundGradient && !data.backgroundGradient.startsWith('linear-gradient') ? 'raw' : 'presets'
  );

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await mediaApi.upload(file);
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: { ...data, backgroundImageUrl: uploaded.url },
      }));
    } finally {
      setUploading(false);
    }
  };

  const update = (patch: Partial<typeof data>) => {
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, ...patch } }));
  };

  const presetGradients = [
    { name: 'Sunset', value: 'linear-gradient(135deg, #ff0080 0%, #ff8c00 100%)' },
    { name: 'Ocean', value: 'linear-gradient(135deg, #0061ff 0%, #60efff 100%)' },
    { name: 'Forest', value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
    { name: 'Berry', value: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)' },
    { name: 'Peach', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { name: 'Midnight', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
    { name: 'Cotton', value: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' },
    { name: 'Pulse', value: 'linear-gradient(135deg, #ff2800 0%, #ff7a00 100%)' },
  ];

  const [gradientDir, setGradientDir] = useState('135deg');
  const [gradientFrom, setGradientFrom] = useState('#ff0080');
  const [gradientTo, setGradientTo] = useState('#ff8c00');

  const applyBuiltGradient = () => {
    update({ backgroundGradient: `linear-gradient(${gradientDir}, ${gradientFrom}, ${gradientTo})` });
  };

  const previewHtml = useMemo(() => {
    try {
      return CardBlock.render(data);
    } catch {
      return '';
    }
  }, [data]);

  const hasCta = Boolean(data.ctaLabel && data.ctaLinkUrl);

  return (
    <div className="space-y-3">
      {/* Live mini-preview */}
      <div className="rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-100)] p-2">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Preview</p>
        <div
          className="pulse-card-preview rounded-lg bg-white p-2"
          style={{ minHeight: '120px' }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>

      <AccordionSection title="Content" icon={TypeIcon} defaultOpen>
        <Input value={data.title} onChange={(e) => update({ title: e.target.value })} placeholder="Card title" />
        <TextArea value={data.body} onChange={(e) => update({ body: e.target.value })} placeholder="Card body text..." rows={2} />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--neutral-600)]">Title alignment</span>
          <AlignButtonGroup value={data.titleAlign} onChange={(v) => update({ titleAlign: v })} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--neutral-600)]">Body alignment</span>
          <AlignButtonGroup value={data.bodyAlign} onChange={(v) => update({ bodyAlign: v })} />
        </div>
      </AccordionSection>

      <AccordionSection title="Typography" icon={Palette}>
        <ColorSwatch label="Title color" value={data.titleColor} allowClear onChange={(c) => update({ titleColor: c })} />
        <ColorSwatch label="Body color" value={data.bodyColor} allowClear onChange={(c) => update({ bodyColor: c })} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Title size</Label>
            <Select
              value={data.titleSize}
              onChange={(e) => update({ titleSize: e.target.value as typeof data.titleSize })}
              options={[{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }, { value: 'xl', label: 'XL' }]}
            />
          </div>
          <div>
            <Label>Body size</Label>
            <Select
              value={data.bodySize}
              onChange={(e) => update({ bodySize: e.target.value as typeof data.bodySize })}
              options={[{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }]}
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Background" icon={ImageIcon}>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select
              value={data.backgroundType}
              onChange={(e) => update({ backgroundType: e.target.value as typeof data.backgroundType })}
              options={[{ value: 'solid', label: 'Solid' }, { value: 'gradient', label: 'Gradient' }, { value: 'image', label: 'Image' }]}
            />
            {data.backgroundType === 'solid' && (
              <input
                type="color"
                value={data.backgroundColor || '#ffffff'}
                onChange={(e) => update({ backgroundColor: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-[var(--neutral-200)]"
              />
            )}
            {data.backgroundType === 'gradient' && (
              <div className="flex flex-1 items-center gap-2">
                <div
                  className="h-8 w-10 flex-shrink-0 rounded border border-[var(--neutral-200)]"
                  style={{ background: data.backgroundGradient || 'linear-gradient(135deg, #ff0080, #ff8c00)' }}
                />
                <Input
                  value={data.backgroundGradient || ''}
                  onChange={(e) => update({ backgroundGradient: e.target.value })}
                  placeholder="CSS gradient"
                  className="flex-1 text-xs"
                />
              </div>
            )}
            {data.backgroundType === 'image' && (
              <div className="flex flex-1 gap-2">
                <Input
                  value={data.backgroundImageUrl || ''}
                  onChange={(e) => update({ backgroundImageUrl: e.target.value })}
                  placeholder="Image URL"
                  className="flex-1 text-xs"
                />
                <InlineUploadButton accept="image/*" uploading={uploading} onUpload={handleUpload} />
              </div>
            )}
          </div>

          {data.backgroundType === 'gradient' && (
            <div className="space-y-2 rounded-lg border border-[var(--neutral-200)] bg-white p-2">
              <div className="flex gap-1">
                {(['presets', 'builder', 'raw'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setGradientMode(m)}
                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      gradientMode === m ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {gradientMode === 'presets' && (
                <div className="grid grid-cols-4 gap-2">
                  {presetGradients.map((g) => (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => update({ backgroundGradient: g.value })}
                      className={`group relative h-10 overflow-hidden rounded-md border-2 ${
                        data.backgroundGradient === g.value ? 'border-[var(--pulse-red)]' : 'border-transparent'
                      }`}
                      title={g.name}
                    >
                      <div className="absolute inset-0" style={{ background: g.value }} />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white opacity-0 shadow-black drop-shadow group-hover:opacity-100">
                        {g.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {gradientMode === 'builder' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Dir</Label>
                    <Select
                      value={gradientDir}
                      onChange={(e) => { setGradientDir(e.target.value); applyBuiltGradient(); }}
                      options={[
                        { value: 'to right', label: '→' },
                        { value: 'to bottom', label: '↓' },
                        { value: '45deg', label: '↘' },
                        { value: '135deg', label: '↗' },
                        { value: 'to bottom right', label: '↘ (long)' },
                      ]}
                    />
                    <input type="color" value={gradientFrom} onChange={(e) => { setGradientFrom(e.target.value); applyBuiltGradient(); }} className="h-7 w-10 cursor-pointer rounded border border-[var(--neutral-200)]" />
                    <input type="color" value={gradientTo} onChange={(e) => { setGradientTo(e.target.value); applyBuiltGradient(); }} className="h-7 w-10 cursor-pointer rounded border border-[var(--neutral-200)]" />
                  </div>
                </div>
              )}

              {gradientMode === 'raw' && (
                <TextArea
                  value={data.backgroundGradient || ''}
                  onChange={(e) => update({ backgroundGradient: e.target.value })}
                  placeholder="linear-gradient(45deg, #ff0080, #ff8c00)"
                  rows={2}
                  className="text-xs font-mono"
                />
              )}
            </div>
          )}

          {data.backgroundType === 'image' && (
            <>
              <Select
                value={data.backgroundImageFit || 'cover'}
                onChange={(e) => update({ backgroundImageFit: e.target.value as typeof data.backgroundImageFit })}
                options={[{ value: 'cover', label: 'Cover' }, { value: 'fill', label: 'Fill' }, { value: 'fit', label: 'Fit' }]}
              />
              <div>
                <Label>Image dimming</Label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={data.imageScrimOpacity}
                  onChange={(e) => update({ imageScrimOpacity: Number(e.target.value) })}
                  className="w-full accent-[var(--pulse-red)]"
                />
              </div>
            </>
          )}
        </div>
      </AccordionSection>

      <AccordionSection title="CTA Button" icon={MousePointerClick}>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input value={data.ctaLabel || ''} onChange={(e) => update({ ctaLabel: e.target.value })} placeholder="Button text" className="flex-1" />
            <Input
              value={data.ctaLinkUrl || ''}
              onChange={(e) => update({ ctaLinkUrl: e.target.value })}
              onBlur={(e) => update({ ctaLinkUrl: sanitizeCardUrl(e.target.value) })}
              placeholder="URL"
              className="flex-1"
            />
          </div>
          {hasCta && (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--neutral-600)]">Alignment</span>
                <AlignButtonGroup value={data.ctaAlign} onChange={(v) => update({ ctaAlign: v })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Style</Label>
                  <Select
                    value={data.ctaStyle}
                    onChange={(e) => update({ ctaStyle: e.target.value as typeof data.ctaStyle })}
                    options={[
                      { value: 'filled', label: 'Filled' },
                      { value: 'outline', label: 'Outline' },
                      { value: 'ghost', label: 'Ghost' },
                      { value: 'link', label: 'Link' },
                    ]}
                  />
                </div>
                <div>
                  <Label>Radius</Label>
                  <Select
                    value={data.ctaBorderRadius}
                    onChange={(e) => update({ ctaBorderRadius: e.target.value as typeof data.ctaBorderRadius })}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'sm', label: 'Small' },
                      { value: 'md', label: 'Medium' },
                      { value: 'lg', label: 'Large' },
                      { value: 'pill', label: 'Pill' },
                    ]}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  label="Open in new tab"
                  checked={data.ctaTarget === '_blank'}
                  onChange={(e) => update({ ctaTarget: e.target.checked ? '_blank' : '_self' })}
                />
              </div>
              {data.ctaStyle !== 'link' && (
                <div className="grid grid-cols-2 gap-2">
                  <ColorSwatch label="Button color" value={data.ctaBgColor} allowClear onChange={(c) => update({ ctaBgColor: c })} />
                  <ColorSwatch label="Button text" value={data.ctaTextColor} allowClear onChange={(c) => update({ ctaTextColor: c })} />
                </div>
              )}
            </>
          )}
        </div>
      </AccordionSection>

      <AccordionSection title="Decoration" icon={Star}>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select
              value={data.geometricForm || 'none'}
              onChange={(e) => update({ geometricForm: e.target.value })}
              options={[
                { value: 'none', label: 'None' },
                { value: 'circle', label: 'Circle' },
                { value: 'triangle', label: 'Triangle' },
                { value: 'square', label: 'Square' },
                { value: 'diamond', label: 'Diamond' },
                { value: 'hexagon', label: 'Hexagon' },
                { value: 'wave', label: 'Wave' },
                { value: 'dots', label: 'Dots' },
                { value: 'lines', label: 'Lines' },
                { value: 'custom', label: 'Custom SVG' },
              ]}
              className="flex-1"
            />
            {data.geometricForm && data.geometricForm !== 'none' && (
              <Select
                value={data.geometricPosition || 'top-right'}
                onChange={(e) => update({ geometricPosition: e.target.value })}
                options={[
                  { value: 'top-left', label: 'TL' },
                  { value: 'top-right', label: 'TR' },
                  { value: 'bottom-left', label: 'BL' },
                  { value: 'bottom-right', label: 'BR' },
                  { value: 'center', label: 'Center' },
                ]}
              />
            )}
          </div>
          {data.geometricForm === 'custom' && (
            <TextArea
              value={data.geometricSvg || ''}
              onChange={(e) => update({ geometricSvg: e.target.value })}
              placeholder='<svg viewBox="0 0 100 100">...</svg>'
              rows={2}
              className="text-xs font-mono"
            />
          )}
          {data.geometricForm && data.geometricForm !== 'none' && (
            <div className="space-y-2">
              <ColorSwatch label="Decoration color" value={data.geometricColor} onChange={(c) => update({ geometricColor: c })} />
              <div>
                <Label>Opacity</Label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={data.geometricOpacity}
                  onChange={(e) => update({ geometricOpacity: Number(e.target.value) })}
                  className="w-full accent-[var(--pulse-red)]"
                />
              </div>
            </div>
          )}
        </div>
      </AccordionSection>

      <AccordionSection title="Overlay Text" icon={Type}>
        <div className="space-y-2">
          <Input
            value={data.overlayText || ''}
            onChange={(e) => update({ overlayText: e.target.value })}
            placeholder="Optional overlay text"
          />
          {data.overlayText && (
            <div className="flex gap-2">
              <Select
                value={data.overlayAlign || 'center'}
                onChange={(e) => update({ overlayAlign: e.target.value })}
                options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]}
              />
              <Select
                value={data.overlayFontSize || 'md'}
                onChange={(e) => update({ overlayFontSize: e.target.value })}
                options={[{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }, { value: 'xl', label: 'XL' }]}
              />
            </div>
          )}
        </div>
      </AccordionSection>

      <AccordionSection title="Layout" icon={Layout}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Padding</Label>
            <Select
              value={data.cardPadding}
              onChange={(e) => update({ cardPadding: e.target.value as typeof data.cardPadding })}
              options={[{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }, { value: 'xl', label: 'XL' }]}
            />
          </div>
          <div>
            <Label>Corner radius</Label>
            <Select
              value={data.cardRadius}
              onChange={(e) => update({ cardRadius: e.target.value as typeof data.cardRadius })}
              options={[
                { value: 'none', label: 'None' },
                { value: 'sm', label: 'Small' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
                { value: 'xl', label: 'XL' },
              ]}
            />
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}

export function EditableSpeechBubble({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as {
    speaker: string;
    text: string;
    tone: string;
    align: string;
    title?: string;
    titleAlign?: string;
    contentAlign?: string;
  };

  const titleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const activeFieldRef = useRef<'title' | 'text'>('text');
  const skipBlurRef = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);

  // Link modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalText, setLinkModalText] = useState('');
  const [linkModalUrl, setLinkModalUrl] = useState('');
  const [linkModalRel, setLinkModalRel] = useState('');
  const [linkModalTarget, setLinkModalTarget] = useState('');
  const existingLinkRef = useRef<{ text: string; url: string; rel: string; target: string } | null>(null);

  // Ref modal state
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [refModalUrl, setRefModalUrl] = useState('');
  const [refModalText, setRefModalText] = useState('');
  const [refModalStyle, setRefModalStyle] = useState<'numeric' | 'alphabetic' | 'greek' | 'abjad'>('numeric');
  const [refModalTarget, setRefModalTarget] = useState('');
  const [refModalRel, setRefModalRel] = useState('');
  const existingRefRef = useRef<{ url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad'; target?: string; rel?: string } | null>(null);

  const toneIcons: Record<string, React.ReactNode> = {
    neutral: <MessageSquare className="h-3.5 w-3.5" />,
    happy: <Sun className="h-3.5 w-3.5" />,
    angry: <CloudRain className="h-3.5 w-3.5" />,
    thinking: <BrainCircuit className="h-3.5 w-3.5" />,
  };

  const toneLabels: Record<string, string> = {
    neutral: 'Neutral',
    happy: 'Happy',
    angry: 'Angry',
    thinking: 'Thinking',
  };

  const titleAlign = data.titleAlign || 'left';
  const contentAlign = data.contentAlign || 'left';

  useEffect(() => {
    const el = titleRef.current;
    if (el) el.innerHTML = markdownToHtml(data.title || '');
  }, [data.title]);

  useEffect(() => {
    const el = textRef.current;
    if (el) el.innerHTML = markdownToHtml(data.text);
  }, [data.text]);

  const getActiveEl = () => {
    return activeFieldRef.current === 'title' ? titleRef.current : textRef.current;
  };

  const openLinkModal = (field: 'title' | 'text') => {
    activeFieldRef.current = field;
    const el = field === 'title' ? titleRef.current : textRef.current;
    if (!el) return;
    skipBlurRef.current = true;
    const existingLink = getLinkAtCursor(el);
    if (existingLink) {
      setLinkModalText(existingLink.text);
      setLinkModalUrl(existingLink.url);
      setLinkModalRel(existingLink.rel);
      setLinkModalTarget(existingLink.target);
      existingLinkRef.current = existingLink;
      savedRangeRef.current = null;
      setLinkModalOpen(true);
      return;
    }
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingLinkRef.current = null;
    setLinkModalText(selectedText);
    setLinkModalUrl('');
    setLinkModalRel('');
    setLinkModalTarget('');
    setLinkModalOpen(true);
  };

  const handleLinkConfirm = (url: string, rel: string, target: string) => {
    const el = getActiveEl();
    if (!el) return;
    skipBlurRef.current = false;
    const parts: string[] = [];
    if (rel) parts.push(`rel="${rel}"`);
    if (target) parts.push(`target="${target}"`);
    const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';
    const markdownText = `[${linkModalText}](${url})${attrs}`;
    if (existingLinkRef.current) {
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(markdownText));
        }
      });
    } else if (savedRangeRef.current) {
      el.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
      document.execCommand('insertText', false, markdownText);
    }
    skipBlurRef.current = false;
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    const field = activeFieldRef.current;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, [field]: markdown } }));
    }, 0);
  };

  const handleLinkRemove = () => {
    const el = getActiveEl();
    if (!el) return;
    if (existingLinkRef.current) {
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text) {
          span.replaceWith(document.createTextNode(span.textContent || ''));
        }
      });
    }
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    const field = activeFieldRef.current;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, [field]: markdown } }));
    }, 0);
  };

  const openRefModal = (field: 'title' | 'text') => {
    activeFieldRef.current = field;
    const el = field === 'title' ? titleRef.current : textRef.current;
    if (!el) return;
    skipBlurRef.current = true;
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingRefRef.current = null;
    setRefModalUrl('');
    setRefModalText(selectedText);
    setRefModalStyle('numeric');
    setRefModalTarget('');
    setRefModalRel('');
    setRefModalOpen(true);
  };

  const handleRefConfirm = (url: string, text: string, style: 'numeric' | 'alphabetic' | 'greek' | 'abjad', target: string, rel: string) => {
    const el = getActiveEl();
    if (!el) return;
    skipBlurRef.current = false;
    const parts: string[] = [];
    parts.push(`text="${text}"`);
    parts.push(`style="${style}"`);
    if (target) parts.push(`target="${target}"`);
    if (rel) parts.push(`rel="${rel}"`);
    const attrs = `{${parts.join(' ')}}`;
    const markdownText = `[ref](${url})${attrs}`;
    if (savedRangeRef.current) {
      el.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
        selection.collapseToEnd();
      }
      document.execCommand('insertText', false, markdownText);
    }
    skipBlurRef.current = false;
    setRefModalOpen(false);
    savedRangeRef.current = null;
    const field = activeFieldRef.current;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, [field]: markdown } }));
    }, 0);
  };

  const handleRefRemove = () => {
    setRefModalOpen(false);
    savedRangeRef.current = null;
  };

  const handleBlur = (field: 'title' | 'text') => {
    if (skipBlurRef.current) return;
    const el = field === 'title' ? titleRef.current : textRef.current;
    if (!el) return;
    const markdown = htmlToMarkdown(el.innerHTML);
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, [field]: markdown } }));
  };

  return (
    <div className="space-y-3">
      {/* Live Preview */}
      <div className="rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-400)] mb-1.5">Preview</div>
        <div className={`pulse-speech-bubble pulse-speech-bubble--${data.tone} pulse-speech-bubble--align-${data.align}`} style={{ marginTop: 0, marginBottom: 0 }}>
          {data.title ? (
            <div className="pulse-speech-bubble__title" style={{ textAlign: titleAlign }} dangerouslySetInnerHTML={{ __html: markdownToHtml(data.title) }} />
          ) : null}
          <div className="pulse-speech-bubble__body">
            <div className="pulse-speech-bubble__text" style={{ textAlign: contentAlign }} dangerouslySetInnerHTML={{ __html: markdownToHtml(data.text) }} />
            <div className="pulse-speech-bubble__tail"></div>
          </div>
          <figcaption className="pulse-speech-bubble__speaker">{data.speaker}</figcaption>
        </div>
      </div>

      {/* Tone + Align */}
      <div className="flex gap-2">
        <div className="flex rounded-lg border border-[var(--neutral-200)] overflow-hidden">
          {(['neutral', 'happy', 'angry', 'thinking'] as const).map((t) => (
            <button
              key={t}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, tone: t } }))}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                data.tone === t
                  ? 'bg-[var(--pulse-red)] text-white'
                  : 'bg-white text-[var(--neutral-600)] hover:bg-[var(--neutral-50)]'
              }`}
              title={toneLabels[t]}
            >
              {toneIcons[t]} {toneLabels[t]}
            </button>
          ))}
        </div>

      </div>

      {/* Title — contentEditable with link/ref support */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Title (optional)</Label>
          <div className="flex gap-1">
            <button onClick={() => openLinkModal('title')} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-red)]" title="Add link">
              <Link2 className="h-3 w-3" /> Link
            </button>
            <button onClick={() => openRefModal('title')} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-red)]" title="Add reference">
              <ExternalLink className="h-3 w-3" /> Ref
            </button>
          </div>
        </div>
        <div
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={() => handleBlur('title')}
          onMouseDown={() => { activeFieldRef.current = 'title'; }}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          className="min-h-[2.5rem] w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-sm text-[var(--neutral-700)] outline-none focus:border-[var(--pulse-red)]"
          style={{ textAlign: titleAlign }}
        />
        <div className="mt-1 flex flex-wrap gap-1">
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, titleAlign: a } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                titleAlign === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Dialogue — contentEditable with link/ref support */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Dialogue</Label>
          <div className="flex gap-1">
            <button onClick={() => openLinkModal('text')} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-red)]" title="Add link">
              <Link2 className="h-3 w-3" /> Link
            </button>
            <button onClick={() => openRefModal('text')} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-red)]" title="Add reference">
              <ExternalLink className="h-3 w-3" /> Ref
            </button>
          </div>
        </div>
        <div
          ref={textRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={() => handleBlur('text')}
          onMouseDown={() => { activeFieldRef.current = 'text'; }}
          className="min-h-[5rem] w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-sm text-[var(--neutral-700)] outline-none focus:border-[var(--pulse-red)]"
          style={{ textAlign: contentAlign }}
        />
        <div className="mt-1 flex flex-wrap gap-1">
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, contentAlign: a } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                contentAlign === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => { setLinkModalOpen(false); skipBlurRef.current = false; }}
        onConfirm={handleLinkConfirm}
        onRemove={existingLinkRef.current ? handleLinkRemove : undefined}
        defaultText={linkModalText}
        defaultUrl={linkModalUrl}
        defaultRel={linkModalRel}
        defaultTarget={linkModalTarget}
      />

      <RefModal
        isOpen={refModalOpen}
        onClose={() => { setRefModalOpen(false); skipBlurRef.current = false; }}
        onConfirm={handleRefConfirm}
        onRemove={existingRefRef.current ? handleRefRemove : undefined}
        defaultUrl={refModalUrl}
        defaultText={refModalText}
        defaultStyle={refModalStyle}
        defaultTarget={refModalTarget}
        defaultRel={refModalRel}
      />
    </div>
  );
}

export function EditableMap({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { provider: string; latitude: number; longitude: number; zoom: number; label?: string };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select value={data.provider} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, provider: e.target.value } }))}
          options={[{ value: 'openstreetmap', label: 'OpenStreetMap' }, { value: 'google', label: 'Google' }, { value: 'mapbox', label: 'Mapbox' }]} />
        <Input value={data.label || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, label: e.target.value } }))} placeholder="Map label (optional)" className="flex-1" />
      </div>
      <div className="flex gap-2">
        <div className="flex items-center gap-1 flex-1">
          <Label>Lat</Label>
          <Input type="number" step="any" value={data.latitude} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, latitude: Number(e.target.value) || 0 } }))} />
        </div>
        <div className="flex items-center gap-1 flex-1">
          <Label>Lng</Label>
          <Input type="number" step="any" value={data.longitude} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, longitude: Number(e.target.value) || 0 } }))} />
        </div>
        <div className="flex items-center gap-1 w-28">
          <Label>Zoom</Label>
          <Input type="number" min={1} max={20} value={data.zoom} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, zoom: Number(e.target.value) || 10 } }))} className="w-16" />
        </div>
      </div>
    </div>
  );
}

export function EditableMath({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { latex: string; displayMode: boolean };
  return (
    <div className="space-y-2">
      <TextArea value={data.latex} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, latex: e.target.value } }))} placeholder="E = mc^2" rows={2} className="font-mono" />
      <Checkbox label="Display mode (block)" checked={data.displayMode} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, displayMode: e.target.checked } }))} />
      <code className="block rounded-lg bg-[var(--neutral-100)] px-3 py-2 text-xs text-[var(--neutral-600)]">{data.latex}</code>
    </div>
  );
}

export function EditableDiagram({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { engine: string; source: string; caption?: string };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select value={data.engine} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, engine: e.target.value } }))}
          options={[{ value: 'mermaid', label: 'Mermaid' }, { value: 'plantuml', label: 'PlantUML' }]} />
        <Input value={data.caption || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, caption: e.target.value } }))} placeholder="Caption (optional)" className="flex-1" />
      </div>
      <TextArea value={data.source} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, source: e.target.value } }))} placeholder="graph TD\n  A --> B" rows={4} className="font-mono text-xs" />
    </div>
  );
}

export function EditableBeforeAfter({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { beforeUrl: string; afterUrl: string; beforeLabel: string; afterLabel: string; position: number };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label>Before</Label>
          <Input value={data.beforeUrl} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, beforeUrl: e.target.value } }))} placeholder="Before image URL" />
          <Input value={data.beforeLabel} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, beforeLabel: e.target.value } }))} placeholder="Before label" />
        </div>
        <div className="flex-1 space-y-1">
          <Label>After</Label>
          <Input value={data.afterUrl} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, afterUrl: e.target.value } }))} placeholder="After image URL" />
          <Input value={data.afterLabel} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, afterLabel: e.target.value } }))} placeholder="After label" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Label>Slider position</Label>
        <input type="range" min={0} max={100} value={data.position} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, position: Number(e.target.value) } }))} className="flex-1" />
        <span className="w-10 text-right text-xs text-[var(--neutral-600)]">{data.position}%</span>
      </div>
    </div>
  );
}

// ─── List-based blocks ───

export function EditableQuiz({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { question: string; options: { id: string; text: string; isCorrect: boolean; explanation?: string }[]; allowMultiple: boolean; randomizeOptions: boolean; showExplanations: boolean; align?: string; successMessage?: string; failureMessage?: string };
  const align = data.align || 'left';

  const safeUpdate = (nextData: typeof data) => {
    try {
      adapter.updateBlock(block.id, (b) => ({ ...b, data: nextData }));
    } catch {
      // Validation error — state is inconsistent, ignore silently
    }
  };

  return (
    <div className="space-y-2">
      <TextArea value={data.question} onChange={(e) => safeUpdate({ ...data, question: e.target.value })} placeholder="Quiz question..." rows={2} />
      <div className="flex gap-4">
        <Checkbox label="Multiple correct" checked={data.allowMultiple} onChange={(e) => {
          const allowMultiple = e.target.checked;
          let options = data.options;
          if (!allowMultiple) {
            // Uncheck all but the first correct option
            let foundCorrect = false;
            options = options.map((o) => {
              if (o.isCorrect) {
                if (foundCorrect) return { ...o, isCorrect: false };
                foundCorrect = true;
              }
              return o;
            });
          }
          safeUpdate({ ...data, allowMultiple, options });
        }} />
        <Checkbox label="Randomize order" checked={data.randomizeOptions} onChange={(e) => safeUpdate({ ...data, randomizeOptions: e.target.checked })} />
        <Checkbox label="Show explanations" checked={data.showExplanations} onChange={(e) => safeUpdate({ ...data, showExplanations: e.target.checked })} />
      </div>
      <div className="flex flex-wrap gap-2">
        {(['left','center','right','justify'] as const).map((a) => (
          <button
            key={a}
            onClick={() => safeUpdate({ ...data, align: a })}
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              align === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-white text-[var(--neutral-600)]'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={data.successMessage || ''} onChange={(e) => safeUpdate({ ...data, successMessage: e.target.value })} placeholder="Success message (default: Correct!)" />
        <Input value={data.failureMessage || ''} onChange={(e) => safeUpdate({ ...data, failureMessage: e.target.value })} placeholder="Failure message (default: Some answers are incorrect...)" />
      </div>
      <Section title={`Options (${data.options.length})`}>
        <div className="space-y-1">
          {data.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2 rounded-lg bg-white p-2">
              <Checkbox label="" checked={opt.isCorrect} onChange={(e) => {
                const checked = e.target.checked;
                let next = data.options.map((o, idx) => idx === i ? { ...o, isCorrect: checked } : o);
                if (checked && !data.allowMultiple) {
                  // Uncheck all others when in single-answer mode
                  next = next.map((o, idx) => idx === i ? o : { ...o, isCorrect: false });
                }
                safeUpdate({ ...data, options: next });
              }} />
              <Input value={opt.text} onChange={(e) => {
                const next = data.options.map((o, idx) => idx === i ? { ...o, text: e.target.value } : o);
                safeUpdate({ ...data, options: next });
              }} placeholder="Option text" className="flex-1 text-xs" />
              <Input value={opt.explanation || ''} onChange={(e) => {
                const next = data.options.map((o, idx) => idx === i ? { ...o, explanation: e.target.value } : o);
                safeUpdate({ ...data, options: next });
              }} placeholder="Explanation" className="flex-1 text-xs" />
              <button onClick={() => {
                const next = data.options.filter((_, idx) => idx !== i);
                safeUpdate({ ...data, options: next.length >= 2 ? next : data.options });
              }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <button onClick={() => safeUpdate({ ...data, options: [...data.options, { id: `opt-${Date.now()}`, text: 'New option', isCorrect: false }] })}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Option
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditablePoll({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { question: string; options: { id: string; label: string; votes: number }[]; allowMultiple: boolean; explanation?: string; align?: string };
  const align = data.align || 'left';
  return (
    <div className="space-y-2">
      <TextArea value={data.question} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, question: e.target.value } }))} placeholder="Poll question..." rows={2} />
      <TextArea value={data.explanation || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, explanation: e.target.value } }))} placeholder="Explanation (optional)..." rows={2} />
      <div className="flex flex-wrap gap-2">
        {(['left', 'center', 'right', 'justify'] as const).map((a) => (
          <button key={a} onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, align: a } }))}
            className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${align === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'}`}>
            {a}
          </button>
        ))}
      </div>
      <Checkbox label="Allow multiple votes" checked={data.allowMultiple} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, allowMultiple: e.target.checked } }))} />
      <Section title={`Options (${data.options.length})`}>
        <div className="space-y-1">
          {data.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2 rounded-lg bg-white p-2">
              <Input value={opt.label} onChange={(e) => {
                const next = data.options.map((o, idx) => idx === i ? { ...o, label: e.target.value } : o);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, options: next } }));
              }} placeholder="Option label" className="flex-1 text-xs" />
              <div className="flex items-center gap-1">
                <Label>Votes</Label>
                <Input type="number" min={0} value={opt.votes} onChange={(e) => {
                  const next = data.options.map((o, idx) => idx === i ? { ...o, votes: Number(e.target.value) || 0 } : o);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, options: next } }));
                }} className="w-16 text-xs" />
              </div>
              <button onClick={() => {
                const next = data.options.filter((_, idx) => idx !== i);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, options: next.length >= 2 ? next : data.options } }));
              }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, options: [...data.options, { id: `poll-${Date.now()}`, label: 'New option', votes: 0 }] } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Option
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditableSurvey({ block, adapter, entrySlug }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>>; entrySlug?: string | null }) {
  const data = block.data as {
    title: string;
    description?: string;
    questions: { id: string; prompt: string; type: 'text' | 'single' | 'multi' | 'rating'; required: boolean; options?: string[]; scaleMax?: number }[];
  };

  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsData, setResultsData] = useState<any>(null);

  const safeUpdate = (nextData: typeof data) => {
    try { adapter.updateBlock(block.id, (b) => ({ ...b, data: nextData })); } catch { /* ignore validation errors during typing */ }
  };

  const loadResults = async () => {
    if (!entrySlug) return;
    const surveyHash = stableSurveyHash(data.title, data.questions);
    setResultsLoading(true);
    try {
      const res = await fetch(`/api/surveys/results?entryId=${encodeURIComponent(entrySlug)}&surveyHash=${encodeURIComponent(surveyHash)}`);
      const payload = await res.json();
      if (res.ok) setResultsData(payload.data);
    } catch { /* ignore */ }
    setResultsLoading(false);
  };

  const stableSurveyHash = (title: string, questions: typeof data.questions) => {
    const raw = title + questions.map((q) => q.id + q.prompt + q.type).join('');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'survey-' + Math.abs(hash).toString(36);
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= data.questions.length) return;
    const qs = [...data.questions];
    [qs[index], qs[newIndex]] = [qs[newIndex], qs[index]];
    safeUpdate({ ...data, questions: qs });
  };

  const questionTypeOptions = [
    { value: 'text', label: 'Text', icon: <Type className="h-3 w-3" /> },
    { value: 'single', label: 'Single choice', icon: <ListChecks className="h-3 w-3" /> },
    { value: 'multi', label: 'Multiple choice', icon: <AlignLeft className="h-3 w-3" /> },
    { value: 'rating', label: 'Rating', icon: <Star className="h-3 w-3" /> },
  ];

  return (
    <div className="space-y-3">
      <Input value={data.title} onChange={(e) => safeUpdate({ ...data, title: e.target.value })} placeholder="Survey title..." />
      <TextArea value={data.description || ''} onChange={(e) => safeUpdate({ ...data, description: e.target.value })} placeholder="Description (optional)..." rows={2} />
      <Section title={`Questions (${data.questions.length})`}>
        <div className="space-y-3">
          {data.questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-[var(--neutral-200)] bg-white p-3 space-y-2">
              <div className="flex items-center gap-2">
                <GripVertical className="h-3.5 w-3.5 text-[var(--neutral-300)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-400)]">Q{i + 1}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-600)] disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                  <button onClick={() => moveQuestion(i, 1)} disabled={i === data.questions.length - 1} className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-600)] disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                  <button onClick={() => {
                    const next = data.questions.filter((_, idx) => idx !== i);
                    safeUpdate({ ...data, questions: next.length >= 1 ? next : data.questions });
                  }} className="rounded p-1 text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <Input value={q.prompt} onChange={(e) => {
                const next = data.questions.map((qq, idx) => idx === i ? { ...qq, prompt: e.target.value } : qq);
                safeUpdate({ ...data, questions: next });
              }} placeholder="Question prompt..." />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={q.type}
                  onChange={(e) => {
                    const newType = e.target.value as typeof q.type;
                    const nextQ = { ...q, type: newType };
                    if (newType === 'rating' && !nextQ.scaleMax) nextQ.scaleMax = 5;
                    if ((newType === 'single' || newType === 'multi') && (!nextQ.options || nextQ.options.length === 0)) nextQ.options = ['Option 1', 'Option 2'];
                    const next = data.questions.map((qq, idx) => idx === i ? nextQ : qq);
                    safeUpdate({ ...data, questions: next });
                  }}
                  className="rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] outline-none"
                >
                  {questionTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-[var(--neutral-600)]">
                  <input type="checkbox" checked={q.required} onChange={(e) => {
                    const next = data.questions.map((qq, idx) => idx === i ? { ...qq, required: e.target.checked } : qq);
                    safeUpdate({ ...data, questions: next });
                  }} className="h-3.5 w-3.5 accent-[var(--pulse-red)]" />
                  Required
                </label>
                {q.type === 'rating' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Scale</span>
                    <input type="number" min={3} max={10} value={q.scaleMax ?? 5}
                      onChange={(e) => {
                        const next = data.questions.map((qq, idx) => idx === i ? { ...qq, scaleMax: Math.min(10, Math.max(3, Number(e.target.value) || 5)) } : qq);
                        safeUpdate({ ...data, questions: next });
                      }}
                      className="w-12 rounded-lg border border-[var(--neutral-200)] bg-white px-1.5 py-1 text-xs font-semibold text-[var(--neutral-600)] outline-none"
                    />
                  </div>
                )}
              </div>
              {(q.type === 'single' || q.type === 'multi') && (
                <div className="space-y-1.5">
                  {q.options?.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <Input value={opt} onChange={(e) => {
                        const nextOpts = q.options!.map((o, oi) => oi === optIdx ? e.target.value : o);
                        const next = data.questions.map((qq, idx) => idx === i ? { ...qq, options: nextOpts } : qq);
                        safeUpdate({ ...data, questions: next });
                      }} placeholder={`Option ${optIdx + 1}`} className="flex-1 text-xs" />
                      <button onClick={() => {
                        const nextOpts = q.options!.filter((_, oi) => oi !== optIdx);
                        const next = data.questions.map((qq, idx) => idx === i ? { ...qq, options: nextOpts.length >= 2 ? nextOpts : q.options } : qq);
                        safeUpdate({ ...data, questions: next });
                      }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <button onClick={() => {
                    const nextOpts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
                    const next = data.questions.map((qq, idx) => idx === i ? { ...qq, options: nextOpts } : qq);
                    safeUpdate({ ...data, questions: next });
                  }} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
                    <Plus className="h-3 w-3" /> Option
                  </button>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => {
            safeUpdate({
              ...data,
              questions: [...data.questions, {
                id: `survey-q-${Date.now()}`,
                prompt: 'New question',
                type: 'text',
                required: false,
              }],
            });
          }} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] border border-[var(--neutral-200)]">
            <Plus className="h-3 w-3" /> Add question
          </button>
        </div>
      </Section>
      {entrySlug && (
        <div className="pt-2">
          <button
            onClick={() => {
              if (!resultsOpen) loadResults();
              setResultsOpen((o) => !o);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--neutral-600)] hover:border-[var(--pulse-red)] hover:text-[var(--pulse-red)] transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {resultsOpen ? 'Hide Results' : 'View Results'}
          </button>
          {resultsOpen && (
            <div className="mt-2 rounded-xl border border-[var(--neutral-200)] bg-white p-3 space-y-3">
              {resultsLoading ? (
                <div className="flex items-center gap-2 text-xs text-[var(--neutral-500)]">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--neutral-300)] border-t-[var(--pulse-red)]" />
                  Loading results...
                </div>
              ) : !resultsData ? (
                <p className="text-xs text-[var(--neutral-500)]">No results yet.</p>
              ) : resultsData.uniqueRespondents === 0 ? (
                <p className="text-xs text-[var(--neutral-500)]">No responses yet.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[var(--neutral-600)]">{resultsData.uniqueRespondents} respondent{resultsData.uniqueRespondents === 1 ? '' : 's'}</p>
                  {data.questions.map((q) => {
                    const qResult = resultsData.results?.[q.id];
                    if (!qResult) return null;
                    const maxCount = Math.max(...Object.values(qResult.frequency || {}) as number[]);
                    return (
                      <div key={q.id} className="rounded-lg border border-[var(--neutral-100)] p-2.5 space-y-1.5">
                        <p className="text-xs font-semibold text-[var(--neutral-700)]">{q.prompt}</p>
                        {q.type === 'text' ? (
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {qResult.samples?.slice(0, 10).map((sample: string, si: number) => (
                              <p key={si} className="text-[11px] text-[var(--neutral-600)] bg-[var(--neutral-50)] rounded px-2 py-1">{sample}</p>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {Object.entries(qResult.frequency || {} as Record<string, number>).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([label, count]) => (
                              <div key={label} className="flex items-center gap-2">
                                <div className="flex-1 h-5 bg-[var(--neutral-100)] rounded overflow-hidden relative">
                                  <div className="absolute inset-y-0 left-0 bg-[var(--pulse-red)]/80 rounded" style={{ width: `${maxCount ? (count as number / maxCount) * 100 : 0}%` }} />
                                  <span className="relative z-10 text-[10px] font-semibold text-[var(--neutral-700)] px-2 leading-5">{label}</span>
                                </div>
                                <span className="text-[10px] font-bold text-[var(--neutral-500)] w-6 text-right">{count as number}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function EditableAccordion({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { allowMultiple: boolean; items: { id: string; title: string; content: string; defaultOpen: boolean }[] };
  return (
    <div className="space-y-2">
      <Checkbox label="Allow multiple open" checked={data.allowMultiple} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, allowMultiple: e.target.checked } }))} />
      <Section title={`Items (${data.items.length})`}>
        <div className="space-y-1">
          {data.items.map((item, i) => (
            <div key={item.id} className="space-y-1 rounded-lg bg-white p-2">
              <div className="flex items-center gap-2">
                <Checkbox label="Open" checked={item.defaultOpen} onChange={(e) => {
                  const next = data.items.map((it, idx) => idx === i ? { ...it, defaultOpen: e.target.checked } : it);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
                }} />
                <Input value={item.title} onChange={(e) => {
                  const next = data.items.map((it, idx) => idx === i ? { ...it, title: e.target.value } : it);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
                }} placeholder="Item title" className="flex-1 text-xs" />
                <button onClick={() => {
                  const next = data.items.filter((_, idx) => idx !== i);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next.length ? next : data.items } }));
                }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
              </div>
              <TextArea value={item.content} onChange={(e) => {
                const next = data.items.map((it, idx) => idx === i ? { ...it, content: e.target.value } : it);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
              }} placeholder="Item content..." rows={2} className="text-xs" />
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: [...data.items, { id: `acc-${Date.now()}`, title: 'New item', content: '', defaultOpen: false }] } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Item
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditableTabs({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { activeTabId?: string; tabs: { id: string; label: string; content: string }[] };
  return (
    <div className="space-y-2">
      <Section title={`Tabs (${data.tabs.length})`}>
        <div className="space-y-1">
          {data.tabs.map((tab, i) => (
            <div key={tab.id} className="space-y-1 rounded-lg bg-white p-2">
              <div className="flex items-center gap-2">
                <Input value={tab.label} onChange={(e) => {
                  const next = data.tabs.map((t, idx) => idx === i ? { ...t, label: e.target.value } : t);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, tabs: next } }));
                }} placeholder="Tab label" className="flex-1 text-xs" />
                <button onClick={() => {
                  const next = data.tabs.filter((_, idx) => idx !== i);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, tabs: next.length ? next : data.tabs } }));
                }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
              </div>
              <TextArea value={tab.content} onChange={(e) => {
                const next = data.tabs.map((t, idx) => idx === i ? { ...t, content: e.target.value } : t);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, tabs: next } }));
              }} placeholder="Tab content..." rows={2} className="text-xs" />
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, tabs: [...data.tabs, { id: `tab-${Date.now()}`, label: 'New tab', content: '' }] } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Tab
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditableFlashcard({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { title?: string; shuffle: boolean; cards: { id: string; front: string; back: string; hint?: string }[] };
  return (
    <div className="space-y-2">
      <Input value={data.title || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Flashcard set title (optional)" />
      <Checkbox label="Shuffle cards" checked={data.shuffle} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, shuffle: e.target.checked } }))} />
      <Section title={`Cards (${data.cards.length})`}>
        <div className="space-y-1">
          {data.cards.map((card, i) => (
            <div key={card.id} className="space-y-1 rounded-lg bg-white p-2">
              <div className="flex items-center gap-2">
                <Input value={card.front} onChange={(e) => {
                  const next = data.cards.map((c, idx) => idx === i ? { ...c, front: e.target.value } : c);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, cards: next } }));
                }} placeholder="Front" className="flex-1 text-xs" />
                <button onClick={() => {
                  const next = data.cards.filter((_, idx) => idx !== i);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, cards: next.length ? next : data.cards } }));
                }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
              </div>
              <Input value={card.back} onChange={(e) => {
                const next = data.cards.map((c, idx) => idx === i ? { ...c, back: e.target.value } : c);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, cards: next } }));
              }} placeholder="Back" className="text-xs" />
              <Input value={card.hint || ''} onChange={(e) => {
                const next = data.cards.map((c, idx) => idx === i ? { ...c, hint: e.target.value } : c);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, cards: next } }));
              }} placeholder="Hint (optional)" className="text-xs" />
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, cards: [...data.cards, { id: `fc-${Date.now()}`, front: 'Front', back: 'Back' }] } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Card
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditableTimeline({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { title?: string; entries: { id: string; title: string; date: string; description?: string }[] };
  return (
    <div className="space-y-2">
      <Input value={data.title || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Timeline title (optional)" />
      <Section title={`Events (${data.entries.length})`}>
        <div className="space-y-1">
          {data.entries.map((entry, i) => (
            <div key={entry.id} className="space-y-1 rounded-lg bg-white p-2">
              <div className="flex items-center gap-2">
                <Input value={entry.title} onChange={(e) => {
                  const next = data.entries.map((en, idx) => idx === i ? { ...en, title: e.target.value } : en);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, entries: next } }));
                }} placeholder="Event title" className="flex-1 text-xs" />
                <Input type="datetime-local" value={entry.date.slice(0, 16)} onChange={(e) => {
                  const next = data.entries.map((en, idx) => idx === i ? { ...en, date: new Date(e.target.value).toISOString() } : en);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, entries: next } }));
                }} className="w-40 text-xs" />
                <button onClick={() => {
                  const next = data.entries.filter((_, idx) => idx !== i);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, entries: next.length ? next : data.entries } }));
                }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
              </div>
              <TextArea value={entry.description || ''} onChange={(e) => {
                const next = data.entries.map((en, idx) => idx === i ? { ...en, description: e.target.value } : en);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, entries: next } }));
              }} placeholder="Description (optional)" rows={1} className="text-xs" />
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, entries: [...data.entries, { id: `tl-${Date.now()}`, title: 'New event', date: new Date().toISOString() }] } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Event
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditableComparison({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { leftTitle: string; rightTitle: string; rows: { id: string; label: string; leftValue: string; rightValue: string }[] };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={data.leftTitle} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, leftTitle: e.target.value } }))} placeholder="Left column title" className="flex-1" />
        <Input value={data.rightTitle} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rightTitle: e.target.value } }))} placeholder="Right column title" className="flex-1" />
      </div>
      <Section title={`Rows (${data.rows.length})`}>
        <div className="space-y-1">
          {data.rows.map((row, i) => (
            <div key={row.id} className="flex items-center gap-1 rounded-lg bg-white p-2">
              <Input value={row.label} onChange={(e) => {
                const next = data.rows.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rows: next } }));
              }} placeholder="Label" className="flex-1 text-xs" />
              <Input value={row.leftValue} onChange={(e) => {
                const next = data.rows.map((r, idx) => idx === i ? { ...r, leftValue: e.target.value } : r);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rows: next } }));
              }} placeholder="Left" className="flex-1 text-xs" />
              <Input value={row.rightValue} onChange={(e) => {
                const next = data.rows.map((r, idx) => idx === i ? { ...r, rightValue: e.target.value } : r);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rows: next } }));
              }} placeholder="Right" className="flex-1 text-xs" />
              <button onClick={() => {
                const next = data.rows.filter((_, idx) => idx !== i);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rows: next.length ? next : data.rows } }));
              }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rows: [...data.rows, { id: `cmp-${Date.now()}`, label: 'Feature', leftValue: 'A', rightValue: 'B' }] } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Row
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditableChart({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { title?: string; chartType: string; labels: string[]; datasets: { id: string; label: string; values: number[] }[] };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={data.title || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Chart title (optional)" className="flex-1" />
        <Select value={data.chartType} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, chartType: e.target.value } }))}
          options={[{ value: 'bar', label: 'Bar' }, { value: 'line', label: 'Line' }, { value: 'pie', label: 'Pie' }]} />
      </div>
      <Section title={`Labels (${data.labels.length})`}>
        <div className="flex flex-wrap gap-2">
          {data.labels.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input value={label} onChange={(e) => {
                const next = [...data.labels];
                next[i] = e.target.value;
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, labels: next } }));
              }} className="w-20 text-xs py-1" />
              <button onClick={() => {
                const next = data.labels.filter((_, idx) => idx !== i);
                if (!next.length) return;
                const datasets = data.datasets.map((d) => ({ ...d, values: d.values.filter((_, idx) => idx !== i) }));
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, labels: next, datasets } }));
              }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, labels: [...data.labels, 'New'], datasets: data.datasets.map((d) => ({ ...d, values: [...d.values, 0] })) } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Label
          </button>
        </div>
      </Section>
      <Section title={`Datasets (${data.datasets.length})`}>
        <div className="space-y-2">
          {data.datasets.map((ds, di) => (
            <div key={ds.id} className="rounded-lg bg-white p-2 space-y-1">
              <div className="flex items-center gap-2">
                <Input value={ds.label} onChange={(e) => {
                  const next = data.datasets.map((d, idx) => idx === di ? { ...d, label: e.target.value } : d);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, datasets: next } }));
                }} placeholder="Dataset name" className="flex-1 text-xs" />
                <button onClick={() => {
                  const next = data.datasets.filter((_, idx) => idx !== di);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, datasets: next.length ? next : data.datasets } }));
                }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
              </div>
              <div className="flex flex-wrap gap-1">
                {ds.values.map((v, vi) => (
                  <Input key={vi} type="number" value={v} onChange={(e) => {
                    const next = data.datasets.map((d, idx) => idx === di ? { ...d, values: d.values.map((val, vidx) => vidx === vi ? Number(e.target.value) || 0 : val) } : d);
                    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, datasets: next } }));
                  }} className="w-16 text-xs py-1" />
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, datasets: [...data.datasets, { id: `ds-${Date.now()}`, label: 'New dataset', values: data.labels.map(() => 0) }] } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Dataset
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditableGallery({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as {
    title?: string;
    layout: string;
    columns: number;
    gap?: number;
    images: {
      id: string;
      src: string;
      alt: string;
      caption?: string;
      title?: string;
      fit?: string;
      linkUrl?: string;
      linkTarget?: string;
      linkRel?: string;
      captionAlign?: string;
      titleAlign?: string;
    }[];
  };
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const updateImage = (i: number, patch: Partial<typeof data.images[0]>) => {
    const next = data.images.map((im, idx) => idx === i ? { ...im, ...patch } : im);
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, images: next } }));
  };

  const handleUpload = async (file: File, i: number) => {
    setUploadingIdx(i);
    try {
      const uploaded = await mediaApi.upload(file);
      updateImage(i, { src: uploaded.url });
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={data.title || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Gallery title (optional)" className="flex-1" />
        <Select value={data.layout} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, layout: e.target.value } }))}
          options={[{ value: 'grid', label: 'Grid' }, { value: 'masonry', label: 'Masonry' }]} />
        <div className="flex items-center gap-1">
          <Label>Cols</Label>
          <Input type="number" min={1} max={6} value={data.columns} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, columns: Number(e.target.value) || 3 } }))} className="w-14 text-xs" />
        </div>
        <div className="flex items-center gap-1">
          <Label>Gap</Label>
          <Input type="number" min={0} max={64} value={data.gap ?? 12} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, gap: Number(e.target.value) || 0 } }))} className="w-14 text-xs" />
        </div>
      </div>
      <Section title={`Images (${data.images.length})`}>
        <div className="space-y-1">
          {data.images.map((img, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={img.id} className="rounded-lg border border-[var(--neutral-200)] bg-white overflow-hidden">
                <div className="flex w-full items-center gap-2 px-3 py-2">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="flex flex-1 items-center gap-2 text-left hover:bg-[var(--neutral-50)]"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--neutral-100)] text-[10px] font-bold text-[var(--neutral-500)]">{i + 1}</span>
                    <img src={img.src} alt="" className="h-6 w-6 rounded object-cover" />
                    <span className="flex-1 truncate text-xs font-semibold text-[var(--neutral-700)]">{img.alt || `Image ${i + 1}`}</span>
                    {isOpen ? <ChevronUp className="h-3 w-3 text-[var(--neutral-400)]" /> : <ChevronDown className="h-3 w-3 text-[var(--neutral-400)]" />}
                  </button>
                  <button
                    onClick={() => {
                      const next = data.images.filter((_, idx) => idx !== i);
                      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, images: next.length ? next : data.images } }));
                      if (openIdx === i) setOpenIdx(null);
                    }}
                    className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                {isOpen && (
                  <div className="space-y-2 border-t border-[var(--neutral-100)] p-3">
                    <div className="flex gap-2">
                      <Input value={img.src} onChange={(e) => updateImage(i, { src: e.target.value })} placeholder="Image URL" className="flex-1 text-xs" />
                      <InlineUploadButton accept="image/*" uploading={uploadingIdx === i} onUpload={(file) => handleUpload(file, i)} />
                    </div>
                    <div className="flex gap-2">
                      <Input value={img.alt} onChange={(e) => updateImage(i, { alt: e.target.value })} placeholder="Alt text" className="flex-1 text-xs" />
                      <Input value={img.title || ''} onChange={(e) => updateImage(i, { title: e.target.value })} placeholder="Title" className="flex-1 text-xs" />
                    </div>
                    <div className="flex gap-2">
                      <Input value={img.caption || ''} onChange={(e) => updateImage(i, { caption: e.target.value })} placeholder="Caption" className="flex-1 text-xs" />
                      <Select value={img.fit || 'cover'} onChange={(e) => updateImage(i, { fit: e.target.value })} options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Fill' }]} />
                    </div>
                    <div className="flex gap-2">
                      <Input value={img.linkUrl || ''} onChange={(e) => updateImage(i, { linkUrl: e.target.value })} placeholder="Link URL" className="flex-1 text-xs" />
                      <Input value={img.linkTarget || ''} onChange={(e) => updateImage(i, { linkTarget: e.target.value })} placeholder="Target" className="w-20 text-xs" />
                      <Input value={img.linkRel || ''} onChange={(e) => updateImage(i, { linkRel: e.target.value })} placeholder="Rel" className="w-20 text-xs" />
                    </div>
                    <div className="flex gap-2">
                      <Select value={img.captionAlign || 'center'} onChange={(e) => updateImage(i, { captionAlign: e.target.value })} options={[{ value: 'left', label: 'C-Left' }, { value: 'center', label: 'C-Center' }, { value: 'right', label: 'C-Right' }, { value: 'justify', label: 'C-Justify' }]} />
                      <Select value={img.titleAlign || 'left'} onChange={(e) => updateImage(i, { titleAlign: e.target.value })} options={[{ value: 'left', label: 'T-Left' }, { value: 'center', label: 'T-Center' }, { value: 'right', label: 'T-Right' }, { value: 'justify', label: 'T-Justify' }]} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, images: [...data.images, { id: `gal-${Date.now()}`, src: 'https://example.com/image.jpg', alt: 'Image', fit: 'cover' }] } }))}
          className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
          <Plus className="h-3 w-3" /> Image
        </button>
      </Section>
    </div>
  );
}

export function EditableCarousel({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as {
    slides: { id: string; title?: string; body?: string; mediaUrl?: string; mediaFit?: string }[];
    autoplay: boolean;
    intervalMs: number;
    showIndicators: boolean;
    showArrows?: boolean;
    slideHeight?: string;
  };
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const updateSlide = (i: number, patch: Partial<typeof data.slides[0]>) => {
    const next = data.slides.map((s, idx) => idx === i ? { ...s, ...patch } : s);
    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, slides: next } }));
  };

  const handleUpload = async (file: File, i: number) => {
    setUploadingIdx(i);
    try {
      const uploaded = await mediaApi.upload(file);
      updateSlide(i, { mediaUrl: uploaded.url });
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-4">
        <Checkbox label="Autoplay" checked={data.autoplay} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, autoplay: e.target.checked } }))} />
        <Checkbox label="Indicators" checked={data.showIndicators} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, showIndicators: e.target.checked } }))} />
        <Checkbox label="Arrows" checked={data.showArrows ?? true} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, showArrows: e.target.checked } }))} />
        <div className="flex items-center gap-1">
          <Label>Interval (ms)</Label>
          <Input type="number" min={1000} max={120000} step={1000} value={data.intervalMs} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, intervalMs: Number(e.target.value) || 5000 } }))} className="w-20 text-xs" />
        </div>
        <div className="flex items-center gap-1">
          <Label>Height</Label>
          <Input value={data.slideHeight || '360px'} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, slideHeight: e.target.value } }))} className="w-20 text-xs" />
        </div>
      </div>
      <Section title={`Slides (${data.slides.length})`}>
        <div className="space-y-1">
          {data.slides.map((slide, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={slide.id} className="rounded-lg border border-[var(--neutral-200)] bg-white overflow-hidden">
                <div className="flex w-full items-center gap-2 px-3 py-2">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="flex flex-1 items-center gap-2 text-left hover:bg-[var(--neutral-50)]"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--neutral-100)] text-[10px] font-bold text-[var(--neutral-500)]">{i + 1}</span>
                    <span className="flex-1 truncate text-xs font-semibold text-[var(--neutral-700)]">{slide.title || `Slide ${i + 1}`}</span>
                    {isOpen ? <ChevronUp className="h-3 w-3 text-[var(--neutral-400)]" /> : <ChevronDown className="h-3 w-3 text-[var(--neutral-400)]" />}
                  </button>
                  <button
                    onClick={() => {
                      const next = data.slides.filter((_, idx) => idx !== i);
                      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, slides: next.length ? next : data.slides } }));
                      if (openIdx === i) setOpenIdx(null);
                    }}
                    className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                {isOpen && (
                  <div className="space-y-2 border-t border-[var(--neutral-100)] p-3">
                    <Input value={slide.title || ''} onChange={(e) => updateSlide(i, { title: e.target.value })} placeholder="Slide title" className="text-xs" />
                    <div className="flex gap-2">
                      <Input value={slide.mediaUrl || ''} onChange={(e) => updateSlide(i, { mediaUrl: e.target.value })} placeholder="Media URL" className="flex-1 text-xs" />
                      <InlineUploadButton accept="image/*" uploading={uploadingIdx === i} onUpload={(file) => handleUpload(file, i)} />
                    </div>
                    <Select value={slide.mediaFit || 'cover'} onChange={(e) => updateSlide(i, { mediaFit: e.target.value })} options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Fill' }]} />
                    <TextArea value={slide.body || ''} onChange={(e) => updateSlide(i, { body: e.target.value })} placeholder="Body text (optional)" rows={2} className="text-xs" />
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, slides: [...data.slides, { id: `slide-${Date.now()}`, title: 'New slide', body: '', mediaFit: 'cover' }] } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Slide
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditableManga({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as {
    title?: string;
    layout: string;
    panels: {
      id: string;
      mode?: string;
      imageUrl?: string;
      caption?: string;
      dialogue?: string;
      textContent?: string;
      backgroundColor?: string;
      textColor?: string;
      panelSize?: string;
      originalWidth?: number;
      originalHeight?: number;
    }[];
    readingDirection: string;
  };

  const layoutCols: Record<string, string> = {
    single: 'grid-cols-1',
    'two-up': 'grid-cols-2',
    'grid-2x2': 'grid-cols-2',
    strip: 'flex flex-row overflow-x-auto gap-3 pb-2',
  };

  const sizeIcons: Record<string, React.ReactNode> = {
    normal: <Maximize className="h-3 w-3" />,
    wide: <StretchHorizontal className="h-3 w-3" />,
    tall: <MoveVertical className="h-3 w-3" />,
    hero: <Expand className="h-3 w-3" />,
  };

  const sizeLabels: Record<string, string> = {
    normal: 'Normal',
    wide: 'Wide',
    tall: 'Tall',
    hero: 'Hero',
  };

  const handleUpload = async (file: File, panelIndex: number) => {
    try {
      const uploaded = await mediaApi.upload(file);
      const next = data.panels.map((p, idx) =>
        idx === panelIndex
          ? { ...p, imageUrl: uploaded.url, originalWidth: uploaded.width, originalHeight: uploaded.height }
          : p
      );
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const isStrip = data.layout === 'strip';

  return (
    <div className="space-y-3">
      {/* Header controls */}
      <div className="flex gap-2">
        <Input
          value={data.title || ''}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))}
          placeholder="Manga title (optional)"
          className="flex-1"
        />
        <Select
          value={data.layout}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, layout: e.target.value } }))}
          options={[
            { value: 'single', label: 'Single' },
            { value: 'two-up', label: 'Two-up' },
            { value: 'grid-2x2', label: '2x2 Grid' },
            { value: 'strip', label: 'Strip' },
          ]}
        />
        <Select
          value={data.readingDirection}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, readingDirection: e.target.value } }))}
          options={[{ value: 'ltr', label: 'LTR' }, { value: 'rtl', label: 'RTL' }]}
        />
      </div>

      {/* Panels grid */}
      <Section title={`Panels (${data.panels.length})`}>
        <div className={`${isStrip ? layoutCols[data.layout] : `grid ${layoutCols[data.layout] || 'grid-cols-2'} gap-3`}`}>
          {data.panels.map((panel, i) => {
            const mode = panel.mode || 'pic';
            const size = panel.panelSize || 'normal';
            const gridSpanClass = size === 'wide' ? 'col-span-2' : size === 'tall' ? 'row-span-2' : size === 'hero' ? 'col-span-full row-span-2' : '';
            const flexWidth = isStrip ? (size === 'wide' || size === 'hero' ? 'w-72' : 'w-44') : '';

            return (
              <div
                key={panel.id}
                className={`rounded-xl border-2 border-[var(--pulse-black)] bg-white overflow-hidden transition-shadow hover:shadow-[3px_3px_0_var(--pulse-black)] ${gridSpanClass} ${flexWidth} ${isStrip ? 'flex-shrink-0' : ''}`}
              >
                {/* Panel toolbar */}
                <div className="flex items-center gap-1 px-2 py-1.5 bg-[var(--neutral-50)] border-b border-[var(--neutral-200)]">
                  <span className="text-[10px] font-bold text-[var(--neutral-400)] mr-1">#{i + 1}</span>

                  {/* Mode toggle */}
                  <div className="flex rounded border border-[var(--neutral-200)] overflow-hidden">
                    <button
                      onClick={() => {
                        const next = data.panels.map((p, idx) => idx === i ? { ...p, mode: 'pic' } : p);
                        adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
                      }}
                      className={`px-1.5 py-0.5 ${mode === 'pic' ? 'bg-[var(--pulse-red)] text-white' : 'bg-white text-[var(--neutral-500)]'}`}
                      title="Picture mode"
                    >
                      <ImageIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        const next = data.panels.map((p, idx) => idx === i ? { ...p, mode: 'text' } : p);
                        adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
                      }}
                      className={`px-1.5 py-0.5 ${mode === 'text' ? 'bg-[var(--pulse-red)] text-white' : 'bg-white text-[var(--neutral-500)]'}`}
                      title="Text mode"
                    >
                      <Type className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Size selector */}
                  <div className="flex rounded border border-[var(--neutral-200)] overflow-hidden ml-auto">
                    {(['normal', 'wide', 'tall', 'hero'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          const next = data.panels.map((p, idx) => idx === i ? { ...p, panelSize: s } : p);
                          adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
                        }}
                        className={`px-1.5 py-0.5 ${size === s ? 'bg-[var(--pulse-black)] text-white' : 'bg-white text-[var(--neutral-500)]'}`}
                        title={sizeLabels[s]}
                      >
                        {sizeIcons[s]}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const next = data.panels.filter((_, idx) => idx !== i);
                      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next.length ? next : data.panels } }));
                    }}
                    className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)] ml-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Panel content */}
                <div className="p-2 space-y-2">
                  {mode === 'pic' ? (
                    <>
                      <div className="flex gap-1.5">
                        <Input
                          value={panel.imageUrl || ''}
                          onChange={(e) => {
                            const next = data.panels.map((p, idx) => idx === i ? { ...p, imageUrl: e.target.value } : p);
                            adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
                          }}
                          placeholder="Image URL"
                          className="flex-1 text-xs"
                        />
                        <InlineUploadButton accept="image/*" uploading={false} onUpload={(file) => handleUpload(file, i)} />
                      </div>
                      {panel.imageUrl && (
                        <div className="rounded-md border border-[var(--neutral-200)] overflow-hidden">
                          <img
                            src={panel.imageUrl}
                            alt={panel.caption || `Panel ${i + 1}`}
                            className="w-full h-20 object-cover"
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              if (!panel.originalWidth && img.naturalWidth) {
                                const next = data.panels.map((p, idx) =>
                                  idx === i ? { ...p, originalWidth: img.naturalWidth, originalHeight: img.naturalHeight } : p
                                );
                                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
                              }
                            }}
                          />
                          {panel.originalWidth && panel.originalHeight && (
                            <div className="px-2 py-0.5 text-[10px] text-[var(--neutral-400)] bg-[var(--neutral-50)]">
                              {panel.originalWidth} x {panel.originalHeight}
                            </div>
                          )}
                        </div>
                      )}
                      <Input
                        value={panel.caption || ''}
                        onChange={(e) => {
                          const next = data.panels.map((p, idx) => idx === i ? { ...p, caption: e.target.value } : p);
                          adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
                        }}
                        placeholder="Caption"
                        className="text-xs"
                      />
                      <TextArea
                        value={panel.dialogue || ''}
                        onChange={(e) => {
                          const next = data.panels.map((p, idx) => idx === i ? { ...p, dialogue: e.target.value } : p);
                          adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
                        }}
                        placeholder="Dialogue (optional)"
                        rows={1}
                        className="text-xs"
                      />
                    </>
                  ) : (
                    <>
                      <TextArea
                        value={panel.textContent || ''}
                        onChange={(e) => {
                          const next = data.panels.map((p, idx) => idx === i ? { ...p, textContent: e.target.value } : p);
                          adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
                        }}
                        placeholder="Story text..."
                        rows={3}
                        className="text-xs"
                      />
                      <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-1">
                          <Label>Bg</Label>
                          <input
                            type="color"
                            value={panel.backgroundColor || '#1a1a2e'}
                            onChange={(e) => {
                              const next = data.panels.map((p, idx) => idx === i ? { ...p, backgroundColor: e.target.value } : p);
                              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
                            }}
                            className="w-7 h-7 rounded cursor-pointer border border-[var(--neutral-200)]"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Label>Text</Label>
                          <input
                            type="color"
                            value={panel.textColor || '#ffffff'}
                            onChange={(e) => {
                              const next = data.panels.map((p, idx) => idx === i ? { ...p, textColor: e.target.value } : p);
                              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
                            }}
                            className="w-7 h-7 rounded cursor-pointer border border-[var(--neutral-200)]"
                          />
                        </div>
                      </div>
                      {/* Live text preview */}
                      <div
                        className="rounded-md p-2 min-h-[60px] flex items-center justify-center"
                        style={{
                          backgroundColor: panel.backgroundColor || '#1a1a2e',
                          color: panel.textColor || '#ffffff',
                        }}
                      >
                        <p className="text-xs text-center font-medium">
                          {panel.textContent || <span className="opacity-40">Preview...</span>}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add panel button */}
        <button
          onClick={() =>
            adapter.updateBlock(block.id, (b) => ({
              ...b,
              data: {
                ...data,
                panels: [
                  ...data.panels,
                  {
                    id: `panel-${Date.now()}`,
                    mode: 'pic',
                    caption: `Panel ${data.panels.length + 1}`,
                    panelSize: 'normal',
                  },
                ],
              },
            }))
          }
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--neutral-500)] hover:border-[var(--pulse-red)] hover:text-[var(--pulse-red)] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Panel
        </button>
      </Section>
    </div>
  );
}

export function EditableHeroSection({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { title: string; subtitle?: string; backgroundUrl?: string; ctaLabel?: string; ctaUrl?: string };
  return (
    <div className="space-y-2">
      <Input value={data.title} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Hero title" />
      <TextArea value={data.subtitle || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, subtitle: e.target.value } }))} placeholder="Subtitle (optional)" rows={2} />
      <Input value={data.backgroundUrl || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, backgroundUrl: e.target.value } }))} placeholder="Background image URL (optional)" />
      <div className="flex gap-2">
        <Input value={data.ctaLabel || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, ctaLabel: e.target.value } }))} placeholder="CTA label (optional)" className="flex-1" />
        <Input value={data.ctaUrl || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, ctaUrl: e.target.value } }))} placeholder="CTA URL (optional)" className="flex-[2]" />
      </div>
      {data.backgroundUrl && (
        <div className="h-24 w-full rounded-lg border border-[var(--neutral-200)] bg-cover bg-center" style={{ backgroundImage: `url(${data.backgroundUrl})` }} />
      )}
    </div>
  );
}

export function EditableAnnotatedImage({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { imageUrl: string; alt: string; caption?: string; hotspots: { id: string; x: number; y: number; label: string; description?: string }[] };
  return (
    <div className="space-y-2">
      <Input value={data.imageUrl} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, imageUrl: e.target.value } }))} placeholder="Image URL" />
      <div className="flex gap-2">
        <Input value={data.alt} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, alt: e.target.value } }))} placeholder="Alt text" className="flex-1" />
        <Input value={data.caption || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, caption: e.target.value } }))} placeholder="Caption (optional)" className="flex-1" />
      </div>
      <Section title={`Hotspots (${data.hotspots.length})`}>
        <div className="space-y-1">
          {data.hotspots.map((h, i) => (
            <div key={h.id} className="flex items-center gap-2 rounded-lg bg-white p-2">
              <div className="flex items-center gap-1">
                <Label>X</Label>
                <Input type="number" min={0} max={100} value={h.x} onChange={(e) => {
                  const next = data.hotspots.map((hp, idx) => idx === i ? { ...hp, x: Number(e.target.value) || 0 } : hp);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, hotspots: next } }));
                }} className="w-14 text-xs" />
              </div>
              <div className="flex items-center gap-1">
                <Label>Y</Label>
                <Input type="number" min={0} max={100} value={h.y} onChange={(e) => {
                  const next = data.hotspots.map((hp, idx) => idx === i ? { ...hp, y: Number(e.target.value) || 0 } : hp);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, hotspots: next } }));
                }} className="w-14 text-xs" />
              </div>
              <Input value={h.label} onChange={(e) => {
                const next = data.hotspots.map((hp, idx) => idx === i ? { ...hp, label: e.target.value } : hp);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, hotspots: next } }));
              }} placeholder="Label" className="flex-1 text-xs" />
              <Input value={h.description || ''} onChange={(e) => {
                const next = data.hotspots.map((hp, idx) => idx === i ? { ...hp, description: e.target.value } : hp);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, hotspots: next } }));
              }} placeholder="Description" className="flex-1 text-xs" />
              <button onClick={() => {
                const next = data.hotspots.filter((_, idx) => idx !== i);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, hotspots: next } }));
              }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, hotspots: [...data.hotspots, { id: `hs-${Date.now()}`, x: 50, y: 50, label: 'Hotspot' }] } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Hotspot
          </button>
        </div>
      </Section>
    </div>
  );
}


const CODE_SANDBOX_LANGUAGES = [
  'typescript', 'tsx', 'javascript', 'jsx', 'json', 'html', 'css',
  'markdown', 'bash', 'http', 'python', 'go', 'rust',
];

export function EditableCodeSandbox({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { code: string; language: string; showLineNumbers?: boolean; readOnly?: boolean };
  const [hasRun, setHasRun] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isRunnable = ['javascript', 'typescript', 'tsx', 'jsx', 'html', 'css', 'json', 'python'].includes(data.language);
  const isPython = data.language === 'python';

  const runCode = useCallback(() => {
    setHasRun(true);
    let html: string;
    if (isPython) {
      html = buildPyodideSrcdoc(data.code);
    } else {
      html = createSandboxHtml(data.code, data.language);
    }
    if (iframeRef.current) {
      iframeRef.current.srcdoc = html;
    }
  }, [data.code, data.language, isPython]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={data.language}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, language: e.target.value } }))}
          className="rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] outline-none"
        >
          {CODE_SANDBOX_LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-xs text-[var(--neutral-600)]">
          <input
            type="checkbox"
            checked={data.showLineNumbers ?? true}
            onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, showLineNumbers: e.target.checked } }))}
            className="h-4 w-4 accent-[var(--pulse-red)]"
          />
          Line numbers
        </label>

        <label className="flex items-center gap-1.5 text-xs text-[var(--neutral-600)]">
          <input
            type="checkbox"
            checked={data.readOnly ?? false}
            onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, readOnly: e.target.checked } }))}
            className="h-4 w-4 accent-[var(--pulse-red)]"
          />
          Read-only
        </label>
      </div>

      <div className="pulse-editor-code-block">
        <div className="pulse-editor-code-header">
          <Terminal className="h-3.5 w-3.5 text-[var(--pulse-red)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
            {data.language}
          </span>
        </div>
        <textarea
          value={data.code}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, code: e.target.value } }))}
          rows={Math.max(4, data.code.split('\n').length)}
          className="pulse-editor-code-textarea"
          placeholder="Type your code here..."
          spellCheck={false}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={runCode}
          disabled={!isRunnable}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            isRunnable
              ? 'bg-[var(--pulse-red)] text-white hover:bg-[var(--pulse-red-dark)]'
              : 'bg-[var(--neutral-200)] text-[var(--neutral-400)] cursor-not-allowed'
          }`}
        >
          <Play className="h-3 w-3" />
          Test Run
        </button>
        {!isRunnable && (
          <span className="text-xs text-[var(--neutral-500)]">
            Execution not available for {data.language} in browser sandbox
          </span>
        )}
      </div>

      {hasRun && isRunnable && (
        <iframe
          ref={iframeRef}
          title="Code sandbox output"
          sandbox="allow-scripts allow-same-origin"
          style={{ width: '100%', minHeight: '160px', border: 'none', display: 'block', background: '#1e1e2e' }}
        />
      )}
    </div>
  );
}

// ─── Link Modal ───

export function LinkModal({
  isOpen,
  onClose,
  onConfirm,
  onRemove,
  defaultText,
  defaultUrl,
  defaultRel,
  defaultTarget,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string, rel: string, target: string) => void;
  onRemove?: () => void;
  defaultText: string;
  defaultUrl?: string;
  defaultRel?: string;
  defaultTarget?: string;
}) {
  const isEditing = Boolean(defaultUrl);
  const [url, setUrl] = useState(defaultUrl || 'https://');
  const [relOpts, setRelOpts] = useState({
    nofollow: defaultRel?.includes('nofollow') || false,
    noopener: defaultRel?.includes('noopener') || false,
    noreferrer: defaultRel?.includes('noreferrer') || false,
    external: defaultRel?.includes('external') || false,
  });
  const [openInNewTab, setOpenInNewTab] = useState(defaultTarget === '_blank');
  const originalRelRef = useRef(defaultRel || '');

  useEffect(() => {
    if (isOpen) {
      setUrl(defaultUrl || 'https://');
      originalRelRef.current = defaultRel || '';
      setRelOpts({
        nofollow: defaultRel?.includes('nofollow') || false,
        noopener: defaultRel?.includes('noopener') || false,
        noreferrer: defaultRel?.includes('noreferrer') || false,
        external: defaultRel?.includes('external') || false,
      });
      setOpenInNewTab(defaultTarget === '_blank');
    }
  }, [isOpen, defaultUrl, defaultRel, defaultTarget]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const relParts = Object.entries(relOpts)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    onConfirm(url, relParts.join(' '), openInNewTab ? '_blank' : '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-bold text-[var(--pulse-black)]">
          {isEditing ? 'Edit Link' : 'Insert Link'}
        </h3>

        <div className="mb-3">
          <Label>Selected Text</Label>
          <div className="rounded-lg bg-[var(--neutral-100)] px-3 py-2 text-sm font-medium text-[var(--neutral-700)]">
            {defaultText}
          </div>
        </div>

        <div className="mb-4">
          <Label>URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://"
            autoFocus
          />
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)]">
            <input
              type="checkbox"
              checked={relOpts.nofollow}
              onChange={(e) => setRelOpts((r) => ({ ...r, nofollow: e.target.checked }))}
              className="h-4 w-4 accent-[var(--pulse-red)]"
            />
            nofollow
          </label>
          <label className={`flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)] ${openInNewTab ? 'opacity-60' : ''}`} title={openInNewTab ? 'noopener is required for security when opening in a new tab' : ''}>
            <input
              type="checkbox"
              checked={relOpts.noopener}
              disabled={openInNewTab}
              onChange={(e) => setRelOpts((r) => ({ ...r, noopener: e.target.checked }))}
              className="h-4 w-4 accent-[var(--pulse-red)]"
            />
            noopener
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)]">
            <input
              type="checkbox"
              checked={relOpts.noreferrer}
              onChange={(e) => setRelOpts((r) => ({ ...r, noreferrer: e.target.checked }))}
              className="h-4 w-4 accent-[var(--pulse-red)]"
            />
            noreferrer
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)]">
            <input
              type="checkbox"
              checked={relOpts.external}
              onChange={(e) => setRelOpts((r) => ({ ...r, external: e.target.checked }))}
              className="h-4 w-4 accent-[var(--pulse-red)]"
            />
            external
          </label>
        </div>

        <div className="mb-5">
          <label className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)]">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => {
                const checked = e.target.checked;
                setOpenInNewTab(checked);
                if (checked) {
                  setRelOpts((r) => ({ ...r, noopener: true }));
                } else {
                  setRelOpts((r) => ({ ...r, noopener: originalRelRef.current.includes('noopener') }));
                }
              }}
              className="h-4 w-4 accent-[var(--pulse-red)]"
            />
            Open in new tab
          </label>
        </div>

        <div className="flex justify-end gap-2">
          {isEditing && onRemove && (
            <button
              onClick={onRemove}
              className="mr-auto rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
            >
              Remove Link
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--neutral-200)] bg-white px-4 py-2 text-sm font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-[var(--pulse-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--pulse-red-dark)]"
          >
            {isEditing ? 'Update Link' : 'Insert Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Link Context Menu ───

export function getLinkFromEvent(e: React.MouseEvent): { text: string; url: string; rel: string; target: string } | null {
  let target = e.target as HTMLElement | null;
  while (target && target !== e.currentTarget) {
    if (target.classList.contains('pulse-editor-link')) {
      return {
        text: target.textContent || '',
        url: target.getAttribute('data-url') || '',
        rel: target.getAttribute('data-rel') || '',
        target: target.getAttribute('data-target') || '',
      };
    }
    target = target.parentElement;
  }
  return null;
}

export function LinkContextMenu({
  x,
  y,
  onEdit,
  onRemove,
  onClose,
}: {
  x: number;
  y: number;
  onEdit: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleClick = () => onClose();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-[60] rounded-lg border border-[var(--neutral-200)] bg-white py-1 shadow-lg"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onEdit}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
      >
        Edit Link
      </button>
      <button
        onClick={onRemove}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
      >
        Remove Link
      </button>
    </div>
  );
}


// ─── Reference helpers ───

export function getRefAtCursor(element: HTMLElement): { url: string; text: string; style: ReferenceStyle; target: string; rel: string } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  let el: HTMLElement | null = selection.anchorNode?.nodeType === Node.TEXT_NODE
    ? (selection.anchorNode as Text).parentElement
    : (selection.anchorNode as HTMLElement);
  while (el && el !== element) {
    if (el.tagName === 'SPAN' && el.classList.contains('pulse-editor-ref')) {
      return { url: el.getAttribute('data-url') || '', text: el.getAttribute('data-text') || '', style: (el.getAttribute('data-style') || 'numeric') as ReferenceStyle, target: el.getAttribute('data-target') || '', rel: el.getAttribute('data-rel') || '' };
    }
    el = el.parentElement;
  }
  return null;
}

export function getRefElementAtCursor(element: HTMLElement): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  let el: HTMLElement | null = selection.anchorNode?.nodeType === Node.TEXT_NODE
    ? (selection.anchorNode as Text).parentElement
    : (selection.anchorNode as HTMLElement);
  while (el && el !== element) {
    if (el.tagName === 'SPAN' && el.classList.contains('pulse-editor-ref')) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

export function getRefFromEvent(e: React.MouseEvent): { url: string; text: string; style: ReferenceStyle; target: string; rel: string } | null {
  let target = e.target as HTMLElement | null;
  while (target && target !== e.currentTarget) {
    if (target.classList.contains('pulse-editor-ref')) {
      return { url: target.getAttribute('data-url') || '', text: target.getAttribute('data-text') || '', style: (target.getAttribute('data-style') || 'numeric') as ReferenceStyle, target: target.getAttribute('data-target') || '', rel: target.getAttribute('data-rel') || '' };
    }
    target = target.parentElement;
  }
  return null;
}

export function getRefElementFromEvent(e: React.MouseEvent): HTMLElement | null {
  let target = e.target as HTMLElement | null;
  while (target && target !== e.currentTarget) {
    if (target.classList.contains('pulse-editor-ref')) {
      return target;
    }
    target = target.parentElement;
  }
  return null;
}

export function RefModal({
  isOpen,
  onClose,
  onConfirm,
  onRemove,
  defaultUrl,
  defaultText,
  defaultStyle,
  defaultTarget,
  defaultRel,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string, text: string, style: ReferenceStyle, target: string, rel: string) => void;
  onRemove?: () => void;
  defaultUrl?: string;
  defaultText?: string;
  defaultStyle?: ReferenceStyle;
  defaultTarget?: string;
  defaultRel?: string;
}) {
  const [url, setUrl] = useState(defaultUrl || '');
  const [text, setText] = useState(defaultText || '');
  const [style, setStyle] = useState(defaultStyle || 'numeric');
  const [openInNewTab, setOpenInNewTab] = useState(defaultTarget === '_blank');
  const [relOpts, setRelOpts] = useState({
    nofollow: defaultRel?.includes('nofollow') || false,
    noopener: defaultRel?.includes('noopener') || false,
    noreferrer: defaultRel?.includes('noreferrer') || false,
    external: defaultRel?.includes('external') || false,
  });
  const originalRelRef = useRef(defaultRel || '');
  const isEditing = Boolean(defaultUrl);

  useEffect(() => {
    if (isOpen) {
      setUrl(defaultUrl || '');
      setText(defaultText || '');
      setStyle(defaultStyle || 'numeric');
      originalRelRef.current = defaultRel || '';
      setRelOpts({
        nofollow: defaultRel?.includes('nofollow') || false,
        noopener: defaultRel?.includes('noopener') || false,
        noreferrer: defaultRel?.includes('noreferrer') || false,
        external: defaultRel?.includes('external') || false,
      });
      setOpenInNewTab(defaultTarget === '_blank');
    }
  }, [isOpen, defaultUrl, defaultText, defaultStyle, defaultTarget, defaultRel]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const relParts = Object.entries(relOpts)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    onConfirm(url, text, style, openInNewTab ? '_blank' : '', relParts.join(' '));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold text-[var(--pulse-black)]">
          {isEditing ? 'Edit Reference' : 'Add Reference'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--neutral-500)]">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)] focus:border-[var(--pulse-red)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--neutral-500)]">Citation text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Optional citation text"
              className="w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)] focus:border-[var(--pulse-red)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--neutral-500)]">Numbering style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as ReferenceStyle)}
              className="w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-sm text-[var(--neutral-700)] outline-none focus:border-[var(--pulse-red)]"
            >
              <option value="numeric">Numeric (1, 2, 3...)</option>
              <option value="alphabetic">Alphabetic (a, b, c...)</option>
              <option value="greek">Greek (α, β, γ...)</option>
              <option value="abjad">Abjad (ابجد...)</option>
            </select>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Link options</p>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)] ${relOpts.noopener && openInNewTab ? 'opacity-60' : ''}`}>
                <input
                  type="checkbox"
                  checked={relOpts.nofollow}
                  onChange={(e) => setRelOpts((r) => ({ ...r, nofollow: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--pulse-red)]"
                />
                nofollow
              </label>
              <label className={`flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)] ${openInNewTab ? 'opacity-60' : ''}`} title={openInNewTab ? 'noopener is required for security when opening in a new tab' : ''}>
                <input
                  type="checkbox"
                  checked={relOpts.noopener}
                  disabled={openInNewTab}
                  onChange={(e) => setRelOpts((r) => ({ ...r, noopener: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--pulse-red)]"
                />
                noopener
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)]">
                <input
                  type="checkbox"
                  checked={relOpts.noreferrer}
                  onChange={(e) => setRelOpts((r) => ({ ...r, noreferrer: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--pulse-red)]"
                />
                noreferrer
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)]">
                <input
                  type="checkbox"
                  checked={relOpts.external}
                  onChange={(e) => setRelOpts((r) => ({ ...r, external: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--pulse-red)]"
                />
                external
              </label>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-600)] cursor-pointer hover:bg-[var(--neutral-100)]">
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setOpenInNewTab(checked);
                  if (checked) {
                    setRelOpts((r) => ({ ...r, noopener: true }));
                  } else {
                    setRelOpts((r) => ({ ...r, noopener: originalRelRef.current.includes('noopener') }));
                  }
                }}
                className="h-4 w-4 accent-[var(--pulse-red)]"
              />
              Open in new tab
            </label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          {isEditing && onRemove && (
            <button
              onClick={onRemove}
              className="mr-auto rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
            >
              Remove
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--neutral-200)] bg-white px-4 py-2 text-sm font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-[var(--pulse-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--pulse-red-dark)]"
          >
            {isEditing ? 'Update' : 'Insert'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RefContextMenu({
  x,
  y,
  onEdit,
  onRemove,
  onClose,
}: {
  x: number;
  y: number;
  onEdit: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleClick = () => onClose();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-[60] rounded-lg border border-[var(--neutral-200)] bg-white py-1 shadow-lg"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onEdit}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
      >
        Edit Reference
      </button>
      <button
        onClick={onRemove}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
      >
        Remove Reference
      </button>
    </div>
  );
}
