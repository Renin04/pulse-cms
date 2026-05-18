'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, Plus, Upload } from 'lucide-react';
import type { EditorStateAdapter } from '@pulse/editor';
import type { Block, BlockData } from '@pulse/core';
import { type ReferenceStyle, formatReferenceNumber } from '@pulse/blocks';
import { media as mediaApi } from '@/lib/api-client';

// ─── Reusable UI helpers ───

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)] focus:border-[var(--pulse-red)] ${props.className || ''}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)] focus:border-[var(--pulse-red)] ${props.className || ''}`}
    />
  );
}

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
  const data = block.data as { text: string; url: string; openInNewTab: boolean; title?: string; align?: string };
  const align = data.align || 'left';
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={data.text} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: e.target.value } }))} placeholder="Link text" className="flex-1" />
        <Input value={data.url} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, url: e.target.value } }))} placeholder="https://..." className="flex-[2]" />
      </div>
      <div className="flex items-center gap-3">
        <Checkbox label="Open in new tab" checked={data.openInNewTab} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, openInNewTab: e.target.checked } }))} />
        <Input value={data.title || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Title (optional)" className="flex-1" />
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
  const data = block.data as { src: string | null; alt: string; caption?: string; width: number; height: number; fit: string; align?: string };
  const align = data.align || 'left';
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await mediaApi.upload(file);
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: {
          ...data,
          src: uploaded.url,
          alt: uploaded.name,
          width: uploaded.width || data.width,
          height: uploaded.height || data.height,
        },
      }));
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={data.src || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, src: e.target.value || null } }))} placeholder="Image URL" className="flex-1" />
        <InlineUploadButton accept="image/*" uploading={uploading} onUpload={handleUpload} />
      </div>
      <div className="flex gap-2">
        <Input value={data.alt} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, alt: e.target.value } }))} placeholder="Alt text" className="flex-1" />
        <Input value={data.caption || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, caption: e.target.value } }))} placeholder="Caption" className="flex-1" />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Label>W</Label>
          <Input type="number" value={data.width} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, width: Number(e.target.value) || 800 } }))} className="w-20" />
        </div>
        <div className="flex items-center gap-1">
          <Label>H</Label>
          <Input type="number" value={data.height} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, height: Number(e.target.value) || 450 } }))} className="w-20" />
        </div>
        <Select
          value={data.fit}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, fit: e.target.value } }))}
          options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Fill' }]}
          className="ml-2"
        />
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
      {data.src && (
        <img src={data.src} alt={data.alt} className="mt-2 h-32 w-full rounded-lg border border-[var(--neutral-200)]" style={{ objectFit: data.fit as any }} />
      )}
    </div>
  );
}

export function EditableVideo({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { url: string; provider: string; title: string; caption?: string; autoplay: boolean; startAtSeconds: number };
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
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

  return (
    <div className="space-y-2">
      <Input value={data.title} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Video title" />
      <div className="flex gap-2">
        <Input value={data.url} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, url: e.target.value } }))} placeholder="Video URL" className="flex-[2]" />
        <Select
          value={data.provider}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, provider: e.target.value } }))}
          options={[{ value: 'youtube', label: 'YouTube' }, { value: 'vimeo', label: 'Vimeo' }, { value: 'html5', label: 'HTML5' }]}
        />
        <InlineUploadButton accept="video/*" uploading={uploading} onUpload={handleUpload} />
      </div>
      <Input value={data.caption || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, caption: e.target.value } }))} placeholder="Caption (optional)" />
      <div className="flex items-center gap-4">
        <Checkbox label="Autoplay" checked={data.autoplay} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, autoplay: e.target.checked } }))} />
        <div className="flex items-center gap-1">
          <Label>Start at</Label>
          <Input type="number" min={0} value={data.startAtSeconds} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, startAtSeconds: Number(e.target.value) || 0 } }))} className="w-20" />
          <span className="text-xs text-[var(--neutral-500)]">sec</span>
        </div>
      </div>
    </div>
  );
}

export function EditableAudio({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { src: string; title: string; artist?: string; caption?: string; autoplay: boolean; loop: boolean };
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await mediaApi.upload(file);
      adapter.updateBlock(block.id, (b) => ({
        ...b,
        data: { ...data, src: uploaded.url, title: uploaded.name },
      }));
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input value={data.title} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Audio title" />
      <div className="flex gap-2">
        <Input value={data.src} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, src: e.target.value } }))} placeholder="Audio URL (.mp3, etc.)" className="flex-1" />
        <InlineUploadButton accept="audio/*" uploading={uploading} onUpload={handleUpload} />
      </div>
      <div className="flex gap-2">
        <Input value={data.artist || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, artist: e.target.value } }))} placeholder="Artist (optional)" className="flex-1" />
        <Input value={data.caption || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, caption: e.target.value } }))} placeholder="Caption (optional)" className="flex-1" />
      </div>
      <div className="flex items-center gap-4">
        <Checkbox label="Autoplay" checked={data.autoplay} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, autoplay: e.target.checked } }))} />
        <Checkbox label="Loop" checked={data.loop} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, loop: e.target.checked } }))} />
      </div>
    </div>
  );
}

export function EditableEmbed({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { url: string; title: string; provider: string; aspectRatio: string; allowFullscreen: boolean };
  return (
    <div className="space-y-2">
      <Input value={data.title} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Embed title" />
      <div className="flex gap-2">
        <Input value={data.url} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, url: e.target.value } }))} placeholder="Embed URL" className="flex-[2]" />
        <Input value={data.provider} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, provider: e.target.value } }))} placeholder="Provider" className="flex-1" />
      </div>
      <div className="flex items-center gap-3">
        <Select
          value={data.aspectRatio}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, aspectRatio: e.target.value } }))}
          options={[{ value: '16:9', label: '16:9' }, { value: '4:3', label: '4:3' }, { value: '1:1', label: '1:1' }, { value: '21:9', label: '21:9' }]}
        />
        <Checkbox label="Allow fullscreen" checked={data.allowFullscreen} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, allowFullscreen: e.target.checked } }))} />
      </div>
    </div>
  );
}

export function EditableFile({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { name: string; url: string; sizeBytes?: number; mimeType?: string; description?: string; openInNewTab: boolean };
  const [uploading, setUploading] = useState(false);

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

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={data.name} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, name: e.target.value } }))} placeholder="File name" className="flex-1" />
        <Input value={data.url} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, url: e.target.value } }))} placeholder="File URL" className="flex-[2]" />
        <InlineUploadButton uploading={uploading} onUpload={handleUpload} />
      </div>
      <div className="flex gap-2">
        <Input value={data.mimeType || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, mimeType: e.target.value } }))} placeholder="MIME type (optional)" className="flex-1" />
        <Input type="number" value={data.sizeBytes || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, sizeBytes: Number(e.target.value) || undefined } }))} placeholder="Size in bytes" className="w-32" />
      </div>
      <Input value={data.description || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, description: e.target.value } }))} placeholder="Description (optional)" />
      <Checkbox label="Open in new tab" checked={data.openInNewTab} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, openInNewTab: e.target.checked } }))} />
    </div>
  );
}

// ─── Structured data blocks ───

export function EditableTable({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { columns: string[]; rows: string[][]; caption?: string };
  return (
    <div className="space-y-2">
      <Input value={data.caption || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, caption: e.target.value } }))} placeholder="Table caption (optional)" />
      <Section title="Columns">
        <div className="flex flex-wrap gap-2">
          {data.columns.map((col, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input value={col} onChange={(e) => {
                const next = [...data.columns];
                next[i] = e.target.value;
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, columns: next } }));
              }} className="w-28" />
              <button onClick={() => {
                const next = data.columns.filter((_, idx) => idx !== i);
                if (next.length === 0) return;
                const rows = data.rows.map((r) => r.filter((_, idx) => idx !== i));
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, columns: next, rows } }));
              }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, columns: [...data.columns, 'New'], rows: data.rows.map((r) => [...r, '']) } }))} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Column
          </button>
        </div>
      </Section>
      <Section title={`Rows (${data.rows.length})`}>
        <div className="space-y-1">
          {data.rows.map((row, ri) => (
            <div key={ri} className="flex items-center gap-1">
              {row.map((cell, ci) => (
                <Input key={ci} value={cell} onChange={(e) => {
                  const next = data.rows.map((r, rIdx) => rIdx === ri ? r.map((c, cIdx) => cIdx === ci ? e.target.value : c) : r);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rows: next } }));
                }} className="min-w-0 flex-1 text-xs py-1" />
              ))}
              <button onClick={() => {
                const next = data.rows.filter((_, idx) => idx !== ri);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rows: next.length ? next : [data.columns.map(() => '')] } }));
              }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, rows: [...data.rows, data.columns.map(() => '')] } }))} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Row
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditableAlert({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { severity: string; title?: string; message: string; dismissible: boolean; isDismissed: boolean };
  const severityColors: Record<string, string> = {
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };
  return (
    <div className={`space-y-2 rounded-xl border p-3 ${severityColors[data.severity] || severityColors.info}`}>
      <div className="flex items-center gap-2">
        {(['info', 'success', 'warning', 'error'] as const).map((s) => (
          <button key={s} onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, severity: s } }))}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${data.severity === s ? 'bg-white/80 text-[var(--pulse-black)]' : 'bg-white/40 text-current'}`}>
            {s}
          </button>
        ))}
      </div>
      <Input value={data.title || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Alert title (optional)" className="bg-white/60" />
      <TextArea value={data.message} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, message: e.target.value } }))} placeholder="Alert message..." rows={2} className="bg-white/60" />
      <div className="flex gap-4">
        <Checkbox label="Dismissible" checked={data.dismissible} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, dismissible: e.target.checked } }))} />
        <Checkbox label="Dismissed by default" checked={data.isDismissed} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, isDismissed: e.target.checked } }))} />
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
  const data = block.data as { title: string; body: string; mediaUrl?: string; linkUrl?: string; ctaLabel?: string };
  return (
    <div className="space-y-2">
      <Input value={data.title} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Card title" />
      <TextArea value={data.body} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, body: e.target.value } }))} placeholder="Card body text..." rows={2} />
      <div className="flex gap-2">
        <Input value={data.mediaUrl || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, mediaUrl: e.target.value } }))} placeholder="Media URL (optional)" className="flex-1" />
        <Input value={data.linkUrl || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, linkUrl: e.target.value } }))} placeholder="Link URL (optional)" className="flex-1" />
      </div>
      <Input value={data.ctaLabel || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, ctaLabel: e.target.value } }))} placeholder="CTA button label (optional)" />
    </div>
  );
}

export function EditableSpeechBubble({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { speaker: string; text: string; tone: string; align: string };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={data.speaker} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, speaker: e.target.value } }))} placeholder="Speaker name" className="flex-1" />
        <Select value={data.tone} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, tone: e.target.value } }))}
          options={[{ value: 'neutral', label: 'Neutral' }, { value: 'happy', label: 'Happy' }, { value: 'angry', label: 'Angry' }, { value: 'thinking', label: 'Thinking' }]} />
        <Select value={data.align} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, align: e.target.value } }))}
          options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
      </div>
      <TextArea value={data.text} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: e.target.value } }))} placeholder="What does the character say?" rows={2} />
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
  const data = block.data as { question: string; options: { id: string; text: string; isCorrect: boolean; explanation?: string }[]; allowMultiple: boolean; randomizeOptions: boolean; showExplanations: boolean };
  return (
    <div className="space-y-2">
      <TextArea value={data.question} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, question: e.target.value } }))} placeholder="Quiz question..." rows={2} />
      <div className="flex gap-4">
        <Checkbox label="Multiple correct" checked={data.allowMultiple} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, allowMultiple: e.target.checked } }))} />
        <Checkbox label="Randomize" checked={data.randomizeOptions} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, randomizeOptions: e.target.checked } }))} />
        <Checkbox label="Show explanations" checked={data.showExplanations} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, showExplanations: e.target.checked } }))} />
      </div>
      <Section title={`Options (${data.options.length})`}>
        <div className="space-y-1">
          {data.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2 rounded-lg bg-white p-2">
              <Checkbox label="" checked={opt.isCorrect} onChange={(e) => {
                const next = data.options.map((o, idx) => idx === i ? { ...o, isCorrect: e.target.checked } : o);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, options: next } }));
              }} />
              <Input value={opt.text} onChange={(e) => {
                const next = data.options.map((o, idx) => idx === i ? { ...o, text: e.target.value } : o);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, options: next } }));
              }} placeholder="Option text" className="flex-1 text-xs" />
              <Input value={opt.explanation || ''} onChange={(e) => {
                const next = data.options.map((o, idx) => idx === i ? { ...o, explanation: e.target.value } : o);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, options: next } }));
              }} placeholder="Explanation" className="flex-1 text-xs" />
              <button onClick={() => {
                const next = data.options.filter((_, idx) => idx !== i);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, options: next.length >= 2 ? next : data.options } }));
              }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, options: [...data.options, { id: `opt-${Date.now()}`, text: 'New option', isCorrect: false }] } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Option
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditablePoll({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { question: string; options: { id: string; label: string; votes: number }[]; allowMultiple: boolean };
  return (
    <div className="space-y-2">
      <TextArea value={data.question} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, question: e.target.value } }))} placeholder="Poll question..." rows={2} />
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
  const data = block.data as { title?: string; layout: string; columns: number; images: { id: string; src: string; alt: string; caption?: string }[] };
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
      </div>
      <Section title={`Images (${data.images.length})`}>
        <div className="grid grid-cols-2 gap-2">
          {data.images.map((img, i) => (
            <div key={img.id} className="space-y-1 rounded-lg bg-white p-2">
              <div className="flex items-center gap-1">
                <Input value={img.src} onChange={(e) => {
                  const next = data.images.map((im, idx) => idx === i ? { ...im, src: e.target.value } : im);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, images: next } }));
                }} placeholder="Image URL" className="flex-1 text-xs" />
                <button onClick={() => {
                  const next = data.images.filter((_, idx) => idx !== i);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, images: next.length ? next : data.images } }));
                }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
              </div>
              <div className="flex gap-1">
                <Input value={img.alt} onChange={(e) => {
                  const next = data.images.map((im, idx) => idx === i ? { ...im, alt: e.target.value } : im);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, images: next } }));
                }} placeholder="Alt" className="flex-1 text-xs" />
                <Input value={img.caption || ''} onChange={(e) => {
                  const next = data.images.map((im, idx) => idx === i ? { ...im, caption: e.target.value } : im);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, images: next } }));
                }} placeholder="Caption" className="flex-1 text-xs" />
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, images: [...data.images, { id: `gal-${Date.now()}`, src: 'https://example.com/image.jpg', alt: 'Image' }] } }))}
          className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
          <Plus className="h-3 w-3" /> Image
        </button>
      </Section>
    </div>
  );
}

export function EditableCarousel({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { slides: { id: string; title?: string; body?: string; mediaUrl?: string }[]; autoplay: boolean; intervalMs: number; showIndicators: boolean };
  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        <Checkbox label="Autoplay" checked={data.autoplay} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, autoplay: e.target.checked } }))} />
        <Checkbox label="Indicators" checked={data.showIndicators} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, showIndicators: e.target.checked } }))} />
        <div className="flex items-center gap-1">
          <Label>Interval (ms)</Label>
          <Input type="number" min={1000} max={120000} step={1000} value={data.intervalMs} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, intervalMs: Number(e.target.value) || 5000 } }))} className="w-20 text-xs" />
        </div>
      </div>
      <Section title={`Slides (${data.slides.length})`}>
        <div className="space-y-1">
          {data.slides.map((slide, i) => (
            <div key={slide.id} className="space-y-1 rounded-lg bg-white p-2">
              <div className="flex items-center gap-2">
                <Input value={slide.title || ''} onChange={(e) => {
                  const next = data.slides.map((s, idx) => idx === i ? { ...s, title: e.target.value } : s);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, slides: next } }));
                }} placeholder="Slide title" className="flex-1 text-xs" />
                <button onClick={() => {
                  const next = data.slides.filter((_, idx) => idx !== i);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, slides: next.length ? next : data.slides } }));
                }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
              </div>
              <Input value={slide.mediaUrl || ''} onChange={(e) => {
                const next = data.slides.map((s, idx) => idx === i ? { ...s, mediaUrl: e.target.value } : s);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, slides: next } }));
              }} placeholder="Media URL (optional)" className="text-xs" />
              <TextArea value={slide.body || ''} onChange={(e) => {
                const next = data.slides.map((s, idx) => idx === i ? { ...s, body: e.target.value } : s);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, slides: next } }));
              }} placeholder="Body text (optional)" rows={1} className="text-xs" />
            </div>
          ))}
          <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, slides: [...data.slides, { id: `slide-${Date.now()}`, title: 'New slide', body: '' }] } }))}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
            <Plus className="h-3 w-3" /> Slide
          </button>
        </div>
      </Section>
    </div>
  );
}

export function EditableManga({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { title?: string; layout: string; panels: { id: string; imageUrl?: string; caption?: string; dialogue?: string }[]; readingDirection: string };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={data.title || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Manga title (optional)" className="flex-1" />
        <Select value={data.layout} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, layout: e.target.value } }))}
          options={[{ value: 'single', label: 'Single' }, { value: 'two-up', label: 'Two-up' }, { value: 'grid-2x2', label: '2x2 Grid' }, { value: 'strip', label: 'Strip' }]} />
        <Select value={data.readingDirection} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, readingDirection: e.target.value } }))}
          options={[{ value: 'ltr', label: 'LTR' }, { value: 'rtl', label: 'RTL' }]} />
      </div>
      <Section title={`Panels (${data.panels.length})`}>
        <div className="grid grid-cols-2 gap-2">
          {data.panels.map((panel, i) => (
            <div key={panel.id} className="space-y-1 rounded-lg bg-white p-2">
              <div className="flex items-center gap-1">
                <Input value={panel.imageUrl || ''} onChange={(e) => {
                  const next = data.panels.map((p, idx) => idx === i ? { ...p, imageUrl: e.target.value } : p);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
                }} placeholder="Panel image URL" className="flex-1 text-xs" />
                <button onClick={() => {
                  const next = data.panels.filter((_, idx) => idx !== i);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next.length ? next : data.panels } }));
                }} className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"><Trash2 className="h-3 w-3" /></button>
              </div>
              <Input value={panel.caption || ''} onChange={(e) => {
                const next = data.panels.map((p, idx) => idx === i ? { ...p, caption: e.target.value } : p);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
              }} placeholder="Caption" className="text-xs" />
              <TextArea value={panel.dialogue || ''} onChange={(e) => {
                const next = data.panels.map((p, idx) => idx === i ? { ...p, dialogue: e.target.value } : p);
                adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: next } }));
              }} placeholder="Dialogue (optional)" rows={1} className="text-xs" />
            </div>
          ))}
        </div>
        <button onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, panels: [...data.panels, { id: `panel-${Date.now()}`, caption: 'New panel' }] } }))}
          className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]">
          <Plus className="h-3 w-3" /> Panel
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
