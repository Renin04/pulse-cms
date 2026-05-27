'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
// import type { ChangeEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
  Clock3, Eye, FilePenLine, Plus, Save, Send,
  ShieldCheck, Trash2, Tag, Hash, BarChart3, Globe, User,
  FileText, Sparkles, ArrowLeft, ChevronDown, ChevronUp, X,
  PanelLeft, PanelLeftClose, Monitor, Tablet, Smartphone, Focus,
  Columns2, Minimize2, HelpCircle, Image as ImageIcon, Upload, List,
  Search, MessageSquare, BookOpen,
} from 'lucide-react'
import { countWords, formatReadTime } from '../../lib/blog-studio'
import { ToastProvider, useToast } from './ToastProvider'
import { useAuth } from '../../lib/use-api'
import type { EditorStateAdapter } from '@pulse/editor'
import { createEditorStateAdapter, DEFAULT_SHORTCUT_BINDINGS } from '@pulse/editor'
import {
  ALIGNMENT_SHORTCUT_BINDINGS,
  FIND_REPLACE_SHORTCUT_BINDINGS,
  DOCUMENT_STATS_SHORTCUT_BINDINGS,
  IMAGE_METADATA_SHORTCUT_BINDINGS,
  COMMAND_REFERENCE_SHORTCUT_BINDINGS,
  EXTENDED_BLOCK_SHORTCUT_BINDINGS,
  INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS,
  PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS,
} from '@pulse/editor'
import type { EntryStatus } from '@pulse/core'
import { CommentSystem, createCommentSystem } from '@pulse/core'
import {
  BlogStudioWorkspace, renderStudioBlocksHtml,
  type BlogStudioEntry, type BlogStudioSnapshot, type StudioBlock,
} from '../../lib/blog-studio'
import { fetchBackendStudioSnapshot, syncEntryToBackend } from '../../lib/studio-backend-bridge'
import { entries as entriesApi, taxonomies as taxonomiesApi, media as mediaApi } from '../../lib/api-client'
import type { TaxonomyItem, TaxonomyTermItem } from '../../lib/api-client'
import StudioBlockCanvas from './StudioBlockCanvas'
import StudioCommentsPanel from './StudioCommentsPanel'
import StudioNotebookPanel from './StudioNotebookPanel'

/* ─── Types ─── */
type DraftFormState = {
  id: string
  title: string; slug: string; excerpt: string; eyebrow: string
  author: string; tags: string; seoTitle: string; seoDescription: string
  featured: boolean; taxonomyIds: string[]
  featuredImage: string; featuredImageAlt: string
}
type RoleOption = 'author' | 'editor' | 'reviewer' | 'admin'
type DeviceMode = 'desktop' | 'tablet' | 'mobile'

/* ─── Helpers ─── */
function cx(...parts: Array<string | false | null | undefined>) { return parts.filter(Boolean).join(' ') }
function toDraftState(entry: BlogStudioEntry): DraftFormState {
  return {
    id: entry.id ?? '',
    title: entry.title, slug: entry.slug, excerpt: entry.excerpt,
    eyebrow: entry.eyebrow, author: entry.author, tags: entry.tags.join(', '),
    seoTitle: entry.seoTitle, seoDescription: entry.seoDescription,
    featured: entry.featured, taxonomyIds: entry.taxonomyIds ?? [],
    featuredImage: entry.featuredImage ?? '',
    featuredImageAlt: entry.featuredImageAlt ?? '',
  }
}
function parseTags(v: string) { return v.split(',').map(s => s.trim()).filter(Boolean) }
function toDatetimeLocal(v: string | null) {
  if (!v) return ''
  const d = new Date(v)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
function fromDatetimeLocal(v: string) { return new Date(v).toISOString() }

/* ─── Sub-components ─── */
function StatusDot({ status }: { status: EntryStatus }) {
  const map: Record<EntryStatus, string> = {
    draft: 'bg-amber-400', review: 'bg-sky-400',
    scheduled: 'bg-violet-400', published: 'bg-emerald-400', archived: 'bg-neutral-400',
  }
  return <span className={cx('h-1.5 w-1.5 rounded-full', map[status])} />
}

function LiveStats({ editorBlocks, draft, selectedEntry }: { editorBlocks: StudioBlock[]; draft: DraftFormState | null; selectedEntry: BlogStudioEntry | null }) {
  const wordCount = countWords(editorBlocks)
  const readTime = formatReadTime(wordCount)

  const seoScore = useMemo(() => {
    let score = 0
    if (draft?.title?.trim().length) score += 20
    if (draft?.excerpt?.trim().length) score += 20
    if (draft?.featuredImage?.trim().length) score += 20
    if (draft?.tags?.trim().length) score += 10
    if (wordCount > 300) score += 10
    if (draft?.seoTitle?.trim().length) score += 10
    if (draft?.seoDescription?.trim().length) score += 10
    return Math.min(100, score)
  }, [draft, wordCount])

  return (
    <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--neutral-500)]">
      <span>{wordCount} words</span>
      <span>•</span>
      <span>{readTime}</span>
      <span>•</span>
      <span>SEO {seoScore}</span>
    </div>
  )
}

function TermChip({ term, selected, onClick }: { term: TaxonomyTermItem; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx('flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-all duration-200',
        selected
          ? 'border-[var(--pulse-black)] bg-[var(--pulse-black)] text-white shadow-sm'
          : 'border-[var(--neutral-200)] bg-white text-[var(--neutral-600)] hover:border-[var(--neutral-300)] hover:bg-[var(--neutral-50)]')}
    >
      <span className={cx('flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
        selected ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-[var(--neutral-300)] bg-white')}>
        {selected && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span>{term.name}</span>
    </button>
  )
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[var(--neutral-200)]">
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] transition-colors">
        <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{title}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function IconBtn({ onClick, active, title, children }: { onClick?: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      className={cx('rounded-md p-1.5 transition-colors', active ? 'bg-[var(--pulse-black)] text-white' : 'text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]')}>
      {children}
    </button>
  )
}

function ImageSettingsForm({
  pendingImage,
  draftAlt,
  onApply,
  onCancel,
}: {
  pendingImage: { url: string; name: string; width?: number; height?: number }
  draftAlt: string
  onApply: (alt: string, width: string, height: string, rename: string, format: string) => void
  onCancel: () => void
}) {
  const [alt, setAlt] = useState(draftAlt || pendingImage.name)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [rename, setRename] = useState(pendingImage.name)
  const [format, setFormat] = useState('original')
  const origW = pendingImage.width || 0
  const origH = pendingImage.height || 0

  return (
    <div className="p-4 space-y-4">
      {/* Preview */}
      <div className="relative overflow-hidden rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)]">
        <img src={pendingImage.url} alt="Preview" className="h-40 w-full object-contain" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Width (px)</span>
          <input type="number" min={1} value={width} onChange={(e) => setWidth(e.target.value)}
            placeholder={origW ? String(origW) : 'Auto'} className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse-red)]" />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Height (px)</span>
          <input type="number" min={1} value={height} onChange={(e) => setHeight(e.target.value)}
            placeholder={origH ? String(origH) : 'Auto'} className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse-red)]" />
        </label>
      </div>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Rename file</span>
        <input value={rename} onChange={(e) => setRename(e.target.value)}
          placeholder="New file name"
          className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse-red)]" />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Format</span>
        <select value={format} onChange={(e) => setFormat(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse-red)]">
          <option value="original">Original</option>
          <option value="webp">WebP</option>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Alt text</span>
        <input value={alt} onChange={(e) => setAlt(e.target.value)}
          placeholder="Describe the image for accessibility"
          className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse-red)]" />
      </label>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onApply(alt, width, height, rename, format)}
          className="flex-1 rounded-lg bg-[var(--pulse-black)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--pulse-red)] transition-colors">
          Apply
        </button>
        <button onClick={onCancel}
          className="rounded-lg border border-[var(--neutral-200)] bg-white px-4 py-2 text-xs font-bold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

function formatShortcutCombo(combo: string, isMac: boolean): string {
  const parts = combo.split('+')
  const modMap: Record<string, string> = isMac
    ? { mod: '⌘', shift: '⇧', alt: '⌥', ctrl: '⌃' }
    : { mod: 'Ctrl', shift: 'Shift', alt: 'Alt', ctrl: 'Ctrl' }
  return parts.map(p => modMap[p] ?? p.toUpperCase()).join(isMac ? '' : '+')
}

const SLASH_COMMANDS = [
  { trigger: 'bold', title: 'Bold', category: 'Formatting' },
  { trigger: 'italic', title: 'Italic', category: 'Formatting' },
  { trigger: 'link', title: 'Link', category: 'Formatting' },
  { trigger: 'code', title: 'Code', category: 'Formatting' },
  { trigger: 'heading', title: 'Heading', category: 'Insert' },
  { trigger: 'save', title: 'Save', category: 'Document' },
  { trigger: 'video', title: 'Video', category: 'Media' },
  { trigger: 'audio', title: 'Audio', category: 'Media' },
  { trigger: 'file', title: 'File', category: 'Media' },
  { trigger: 'table', title: 'Table', category: 'Insert' },
  { trigger: 'embed', title: 'Embed', category: 'Insert' },
  { trigger: 'callout', title: 'Callout', category: 'Insert' },
  { trigger: 'alert', title: 'Alert', category: 'Insert' },
  { trigger: 'image', title: 'Image', category: 'Media' },
  { trigger: 'quote', title: 'Quote', category: 'Insert' },
  { trigger: 'divider', title: 'Divider', category: 'Insert' },
  { trigger: 'quiz', title: 'Quiz', category: 'Interactive' },
  { trigger: 'poll', title: 'Poll', category: 'Interactive' },
  { trigger: 'gallery', title: 'Gallery', category: 'Interactive' },
  { trigger: 'carousel', title: 'Carousel', category: 'Interactive' },
]

function collectShortcutBindings(isMac: boolean): { category: string; items: { keys: string; action: string }[] }[] {
  const toItems = (record: Record<string, { combo: string; description?: string }>) =>
    Object.values(record).map(b => ({ keys: formatShortcutCombo(b.combo, isMac), action: b.description || b.combo }))

  return [
    { category: 'Studio', items: [
      { keys: formatShortcutCombo('mod+\\', isMac), action: 'Toggle sidebar' },
      { keys: formatShortcutCombo('mod+p', isMac), action: 'Toggle preview' },
      { keys: formatShortcutCombo('mod+h', isMac), action: 'Toggle help' },
      { keys: formatShortcutCombo('mod+shift+c', isMac), action: 'Toggle comments' },
      { keys: formatShortcutCombo('mod+alt+n', isMac) + ' / ' + formatShortcutCombo('mod+shift+y', isMac), action: 'Toggle notebook' },
      { keys: formatShortcutCombo('mod+.', isMac), action: 'Focus mode' },
      { keys: 'Esc', action: 'Exit focus mode' },
      { keys: formatShortcutCombo('mod+s', isMac), action: 'Save' },
    ]},
    { category: 'Formatting', items: toItems(DEFAULT_SHORTCUT_BINDINGS) },
    { category: 'Alignment', items: toItems(ALIGNMENT_SHORTCUT_BINDINGS) },
    { category: 'Find & Replace', items: toItems(FIND_REPLACE_SHORTCUT_BINDINGS) },
    { category: 'Document Stats', items: toItems(DOCUMENT_STATS_SHORTCUT_BINDINGS) },
    { category: 'Image Metadata', items: toItems(IMAGE_METADATA_SHORTCUT_BINDINGS) },
    { category: 'Command', items: toItems(COMMAND_REFERENCE_SHORTCUT_BINDINGS) },
    { category: 'Extended Blocks', items: toItems(EXTENDED_BLOCK_SHORTCUT_BINDINGS) },
    { category: 'Interactive', items: toItems(INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS) },
    { category: 'Phase 2 Blocks', items: toItems(PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS) },
  ].filter(s => s.items.length > 0)
}

function HelpReference() {
  const isMac = useMemo(() => typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac'), [])
  const [query, setQuery] = useState('')
  const sections = useMemo(() => collectShortcutBindings(isMac), [isMac])

  const filteredSections = useMemo(() => {
    if (!query.trim()) return sections
    const q = query.toLowerCase()
    return sections.map(s => ({
      ...s,
      items: s.items.filter(i => i.action.toLowerCase().includes(q) || i.keys.toLowerCase().includes(q)),
    })).filter(s => s.items.length > 0)
  }, [sections, query])

  const filteredSlash = useMemo(() => {
    if (!query.trim()) return SLASH_COMMANDS
    const q = query.toLowerCase()
    return SLASH_COMMANDS.filter(c => c.trigger.includes(q) || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="sticky top-0 z-10 bg-[var(--neutral-50)] pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--neutral-400)]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search shortcuts & commands..."
            className="w-full rounded-lg border border-[var(--neutral-200)] bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[var(--pulse-red)]"
          />
        </div>
      </div>

      {/* Slash Commands */}
      <div>
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Slash Commands</h3>
        <p className="mb-2 text-[10px] text-[var(--neutral-400)]">Type / in the editor to trigger</p>
        <div className="space-y-1">
          {filteredSlash.map(cmd => (
            <div key={cmd.trigger} className="flex items-center justify-between rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[var(--neutral-100)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--neutral-600)]">/{cmd.trigger}</span>
                <span className="text-xs text-[var(--neutral-700)]">{cmd.title}</span>
              </div>
              <span className="text-[10px] text-[var(--neutral-400)]">{cmd.category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Shortcuts */}
      {filteredSections.map(section => (
        <div key={section.category}>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">{section.category}</h3>
          <div className="space-y-1.5">
            {section.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5">
                <span className="text-xs text-[var(--neutral-700)]">{item.action}</span>
                <kbd className="rounded bg-[var(--neutral-100)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--neutral-600)]">{item.keys}</kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main ─── */
export default function PulseBlogStudio() {
  return (
    <ToastProvider>
      <PulseBlogStudioInner />
    </ToastProvider>
  )
}

function PulseBlogStudioInner() {
  const { showToast } = useToast()
  const { user: _user } = useAuth()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [snapshot, setSnapshot] = useState<BlogStudioSnapshot | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [draft, setDraft] = useState<DraftFormState | null>(null)
  const [editorAdapter, setEditorAdapter] = useState<EditorStateAdapter<StudioBlock> | null>(null)
  const [editorBlocks, setEditorBlocks] = useState<StudioBlock[]>([])

  const [role, setRole] = useState<RoleOption>('author')
  const [scheduleFor, setScheduleFor] = useState('')
  const [notice, setNotice] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  const [taxonomies, setTaxonomies] = useState<TaxonomyItem[]>([])
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(true)

  /* Layout state */
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [notebookOpen, setNotebookOpen] = useState(false)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [focusMode, setFocusMode] = useState(false)
  const sidebarOpenBeforeFocusRef = useRef(true)
  const [previewMode, setPreviewMode] = useState<'article' | 'list'>('article')
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewZoom, setPreviewZoom] = useState(1)

  /* Preview zoom: scale down desktop layout so it fits without horizontal scroll */
  useEffect(() => {
    const el = previewContainerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      const targetWidth = parseInt(deviceWidth)
      const zoom = Math.min(1, (rect.width - 32) / targetWidth)
      setPreviewZoom(zoom)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [deviceWidth])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageSettingsOpen, setImageSettingsOpen] = useState(false)
  const [pendingImage, setPendingImage] = useState<{ url: string; name: string; width?: number; height?: number } | null>(null)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [pulseBlockId, setPulseBlockId] = useState<string | null>(null)

  /* Load snapshot */
  useEffect(() => {
    let active = true
    fetchBackendStudioSnapshot().then(snap => {
      if (!active) return
      setSnapshot(snap)
      if (editId) {
        const found = snap.entries.find((e: any) => (e as any).id === editId || e.slug === editId)
        setSelectedSlug(found?.slug ?? '')
      }
    })
    return () => { active = false }
  }, [editId])

  /* Load taxonomies */
  useEffect(() => {
    let active = true
    setLoadingTaxonomies(true)
    taxonomiesApi.list().then(data => { if (active) setTaxonomies(data) }).catch(() => setTaxonomies([])).finally(() => setLoadingTaxonomies(false))
    return () => { active = false }
  }, [])

  /* Auto-sync: silently push to backend every 30s when dirty */
  useEffect(() => {
    if (!snapshot || !isDirty) return
    const selected = snapshot.entries.find(e => e.slug === selectedSlug)
    if (!selected) return
    const t = setTimeout(() => {
      syncEntryToBackend({ ...selected, taxonomyIds: (selected as any).taxonomyIds }).catch(() => {})
    }, 30000)
    return () => clearTimeout(t)
  }, [snapshot, selectedSlug, isDirty])

  /* Keyboard shortcuts — capture phase to intercept browser defaults */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) { setFocusMode(false); setSidebarOpen(sidebarOpenBeforeFocusRef.current); e.preventDefault(); return }

      if ((e.metaKey || e.ctrlKey) && (e.key === '\\' || e.code === 'Backslash')) {
        setSidebarOpen(s => !s)
        e.preventDefault(); return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        setPreviewOpen(p => !p); setHelpOpen(false)
        e.preventDefault(); return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'h') {
        setHelpOpen(h => !h); setPreviewOpen(false)
        e.preventDefault(); return
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === '.' || e.code === 'Period')) {
        e.preventDefault()
        if (focusMode) {
          setFocusMode(false)
          setSidebarOpen(sidebarOpenBeforeFocusRef.current)
        } else {
          sidebarOpenBeforeFocusRef.current = sidebarOpen
          setSidebarOpen(false)
          setFocusMode(true)
        }
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        handleSave()
        e.preventDefault(); return
      }
      // Comments panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        setCommentsOpen((o) => !o)
        setNotebookOpen(false)
        setPreviewOpen(false)
        setHelpOpen(false)
        return
      }
      // Notebook panel — Ctrl+Alt+N primary, Ctrl+Shift+Y fallback
      if ((e.metaKey || e.ctrlKey) && ((e.altKey && e.key.toLowerCase() === 'n') || (e.shiftKey && e.key.toLowerCase() === 'y'))) {
        e.preventDefault()
        e.stopPropagation()
        setNotebookOpen((o) => !o)
        setCommentsOpen(false)
        setPreviewOpen(false)
        setHelpOpen(false)
        return
      }
      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        editorAdapter?.undo()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        editorAdapter?.redo()
        return
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        editorAdapter?.redo()
        return
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [focusMode, handleSave, editorAdapter])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pulse-focus-mode', { detail: { active: focusMode } }))
  }, [focusMode])

  const workspace = useMemo(() => snapshot ? new BlogStudioWorkspace(snapshot) : null, [snapshot])
  const entries = useMemo(() => workspace?.listEntries() ?? [], [workspace])

  const selectedEntry = useMemo(() => {
    if (!workspace || !selectedSlug) return null
    try { return workspace.getEntry(selectedSlug) } catch { return null }
  }, [selectedSlug, workspace])

  /* Comment system */
  const [commentSystem, setCommentSystem] = useState<CommentSystem>(() => createCommentSystem())
  const [, commentTick] = useState(0)

  // Load comments when entry changes
  useEffect(() => {
    if (!selectedEntry) return
    const key = `pulse-comments-${selectedEntry.id || selectedEntry.slug}`
    const raw = localStorage.getItem(key)
    const cs = createCommentSystem()
    if (raw) {
      try {
        const data = JSON.parse(raw)
        cs.import(data)
      } catch { /* ignore */ }
    }
    setCommentSystem(cs)
    setCommentsOpen(false)
    setNotebookOpen(false)
  }, [selectedEntry?.id, selectedEntry?.slug])

  // Persist comments
  useEffect(() => {
    if (!selectedEntry) return
    const key = `pulse-comments-${selectedEntry.id || selectedEntry.slug}`
    const data = commentSystem.export()
    localStorage.setItem(key, JSON.stringify(data))
  }, [commentSystem, selectedEntry?.id, selectedEntry?.slug])

  // Compute block comment counts (total + active only)
  const { blockCommentCounts, blockActiveCommentCounts } = useMemo(() => {
    const counts: Record<string, number> = {}
    const activeCounts: Record<string, number> = {}
    const threads = commentSystem.getThreads()
    for (const thread of threads) {
      const bid = thread.comment.range?.blockId
      if (bid) {
        counts[bid] = (counts[bid] || 0) + 1
        if (thread.comment.status === 'active') {
          activeCounts[bid] = (activeCounts[bid] || 0) + 1
        }
      }
    }
    return { blockCommentCounts: counts, blockActiveCommentCounts: activeCounts }
  }, [commentSystem, commentTick])

  useEffect(() => {
    if (!selectedEntry) return
    setDraft(toDraftState(selectedEntry as any))
    setScheduleFor(toDatetimeLocal(selectedEntry.scheduledAt))
    setIsDirty(false); setNotice('')

    const adapter = createEditorStateAdapter<StudioBlock>({
      document: { id: selectedEntry.slug, metadata: { title: selectedEntry.title }, blocks: selectedEntry.blocks },
    })
    adapter.enableHistory(50)
    const sync = () => { setEditorBlocks(adapter.getSnapshot().document.blocks) }
    sync()
    const unsub = adapter.subscribe(() => { sync(); setIsDirty(true) })
    setEditorAdapter(adapter)
    return () => { unsub() }
  }, [selectedEntry?.slug, selectedEntry?.updatedAt])

  const previewHtml = useMemo(() => renderStudioBlocksHtml(editorBlocks), [editorBlocks])

  // Hydrate interactive blocks after preview renders (React strips inline scripts from dangerouslySetInnerHTML)
  useEffect(() => {
    const t = setTimeout(() => {
      const preview = document.querySelector('[class*="prose prose-sm"]') || document.querySelector('[class*="mt-6"]');
      if (!preview) return;

      // --- Quiz ---
      preview.querySelectorAll('.pulse-quiz').forEach((quiz) => {
        if ((quiz as any).__hydrated) return;
        (quiz as any).__hydrated = true;
        const opts = quiz.querySelectorAll('.pulse-quiz-option');
        const res = quiz.querySelector('.pulse-quiz-result') as HTMLElement | null;
        opts.forEach((l) => {
          l.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).tagName === 'INPUT') {
              opts.forEach((o) => {
                (o as HTMLElement).style.borderColor = 'var(--neutral-200)';
                (o as HTMLElement).style.background = 'transparent';
                const ex = o.parentElement?.querySelector('.pulse-quiz-explanation') as HTMLElement | null;
                if (ex) ex.style.display = 'none';
              });
              const selected = quiz.querySelectorAll('input:checked');
              let allCorrect = true;
              let anySelected = false;
              selected.forEach((s) => {
                anySelected = true;
                const li = s.closest('li');
                const isCorrect = li?.getAttribute('data-correct') === 'true';
                const label = s.closest('label') as HTMLElement;
                if (isCorrect) {
                  label.style.borderColor = '#059669';
                  label.style.background = '#ecfdf5';
                  const ex = li?.querySelector('.pulse-quiz-explanation') as HTMLElement | null;
                  if (ex) ex.style.display = 'block';
                } else {
                  label.style.borderColor = '#dc2626';
                  label.style.background = '#fef2f2';
                  allCorrect = false;
                }
              });
              if (anySelected && res) {
                const correctCount = quiz.querySelectorAll('li[data-correct="true"]').length;
                if (allCorrect && selected.length === correctCount) {
                  res.textContent = '✅ Correct!';
                  res.style.color = '#059669';
                } else {
                  res.textContent = '❌ Some answers are incorrect. Try again.';
                  res.style.color = '#dc2626';
                }
                res.style.display = 'block';
              }
            }
          });
        });
      });

      // --- Poll ---
      preview.querySelectorAll('.pulse-poll').forEach((poll) => {
        if ((poll as any).__hydrated) return;
        (poll as any).__hydrated = true;
        const btns = poll.querySelectorAll('.pulse-poll-btn');
        let voted = false;
        btns.forEach((btn) => {
          btn.addEventListener('click', () => {
            if (voted) return;
            voted = true;
            const li = btn.closest('li');
            const clickedId = li?.getAttribute('data-option-id');
            const lis = Array.from(poll.querySelectorAll('li'));
            let total = 0;
            lis.forEach((l) => {
              let v = parseInt(l.getAttribute('data-votes') || '0', 10);
              if (l.getAttribute('data-option-id') === clickedId) v += 1;
              l.setAttribute('data-votes', String(v));
              total += v;
            });
            lis.forEach((l) => {
              const v = parseInt(l.getAttribute('data-votes') || '0', 10);
              const pct = total > 0 ? Math.round((v / total) * 100) : 0;
              const bar = l.querySelector('.pulse-poll-bar') as HTMLElement | null;
              const pctLabel = l.querySelector('.pulse-poll-pct') as HTMLElement | null;
              if (bar) bar.style.width = pct + '%';
              if (pctLabel) pctLabel.textContent = pct + '%';
              (l.querySelector('button') as HTMLElement).style.cursor = 'default';
            });
            (btn as HTMLElement).style.borderColor = 'var(--pulse-red)';
            (btn as HTMLElement).style.background = '#fff1f2';
          });
        });
      });

      // --- Tabs ---
      preview.querySelectorAll('.pulse-tabs').forEach((sec) => {
        if ((sec as any).__hydrated) return;
        (sec as any).__hydrated = true;
        const btns = sec.querySelectorAll('.pulse-tab-btn');
        const panels = sec.querySelectorAll('[data-tab-panel]');
        btns.forEach((btn) => {
          btn.addEventListener('click', () => {
            const tid = btn.getAttribute('data-tab-id');
            btns.forEach((b) => {
              (b as HTMLElement).style.background = 'var(--neutral-50)';
              (b as HTMLElement).style.fontWeight = '400';
              (b as HTMLElement).style.color = 'var(--neutral-500)';
            });
            (btn as HTMLElement).style.background = '#fff';
            (btn as HTMLElement).style.fontWeight = '600';
            (btn as HTMLElement).style.color = 'var(--pulse-black)';
            panels.forEach((p) => {
              (p as HTMLElement).style.display = p.getAttribute('data-tab-panel') === tid ? 'block' : 'none';
            });
          });
        });
      });

      // --- Spoiler ---
      preview.querySelectorAll('.pulse-spoiler').forEach((sec) => {
        if ((sec as any).__hydrated) return;
        (sec as any).__hydrated = true;
        const btn = sec.querySelector('.pulse-spoiler-btn') as HTMLElement | null;
        const content = sec.querySelector('.pulse-spoiler-content') as HTMLElement | null;
        const icon = sec.querySelector('.pulse-spoiler-icon') as HTMLElement | null;
        if (!btn || !content || !icon) return;
        let revealed = sec.getAttribute('data-revealed') === 'true';
        btn.addEventListener('click', () => {
          revealed = !revealed;
          content.style.display = revealed ? 'block' : 'none';
          icon.style.transform = revealed ? 'rotate(90deg)' : 'rotate(0deg)';
          sec.setAttribute('data-revealed', String(revealed));
        });
      });

      // --- Survey ---
      preview.querySelectorAll('.pulse-survey form').forEach((form) => {
        if ((form as any).__hydrated) return;
        (form as any).__hydrated = true;
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const btn = form.querySelector('button[type="submit"]') as HTMLElement | null;
          if (btn) {
            btn.textContent = '✅ Submitted!';
            btn.setAttribute('disabled', 'true');
            btn.style.opacity = '0.6';
            btn.style.cursor = 'default';
          }
        });
      });
    }, 300);
    return () => clearTimeout(t);
  }, [previewHtml]);

  const currentStatus = selectedEntry?.status ?? 'draft'

  function updateDraft<K extends keyof DraftFormState>(field: K, value: DraftFormState[K]) {
    setDraft(d => d ? { ...d, [field]: value } : d)
    setIsDirty(true)
  }
  function toggleTerm(id: string) {
    if (!draft) return
    updateDraft('taxonomyIds', draft.taxonomyIds.includes(id) ? draft.taxonomyIds.filter(x => x !== id) : [...draft.taxonomyIds, id])
  }

  async function runMutation(
    action: (w: BlogStudioWorkspace, slug: string) => { nextSlug?: string; message?: string; error?: string },
    opts: { persistDraft?: boolean } = { persistDraft: true }
  ) {
    if (!snapshot || !selectedSlug || !draft) return
    const w = new BlogStudioWorkspace(snapshot)
    let active = selectedSlug
    if (opts.persistDraft !== false) {
      const saved = w.updateEntry(active, {
        title: draft.title, slug: draft.slug, excerpt: draft.excerpt,
        eyebrow: draft.eyebrow, author: draft.author, tags: parseTags(draft.tags),
        featured: draft.featured, seoTitle: draft.seoTitle, seoDescription: draft.seoDescription,
        blocks: editorBlocks,
        taxonomyIds: draft.taxonomyIds,
        featuredImage: draft.featuredImage || undefined,
        featuredImageAlt: draft.featuredImageAlt || undefined,
      })
      active = saved.slug
    }
    const res = action(w, active)
    const next = w.toSnapshot()
    const updated = next.entries.find(e => e.slug === (res.nextSlug ?? active))
    if (updated) updated.taxonomyIds = draft.taxonomyIds
    setSnapshot(next)
    setSelectedSlug(res.nextSlug ?? active)

    // Sync to backend immediately
    if (updated && !res.error) {
      try {
        await syncEntryToBackend({ ...updated, taxonomyIds: draft.taxonomyIds })
        showToast(res.message ?? 'Saved', 'success')
        setIsDirty(false)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Sync failed', 'error')
        setIsDirty(true)
      }
    } else {
      setNotice(res.error ?? res.message ?? '')
      setIsDirty(Boolean(res.error))
    }
  }

  async function handleCreate() {
    if (!snapshot) return
    try {
      const newEntry = await entriesApi.create({
        contentTypeId: 'blog_post', title: 'Untitled Story', slug: `untitled-${Date.now()}`, status: 'draft',
        fieldValues: [
          { fieldId: 'excerpt', value: '' }, { fieldId: 'eyebrow', value: 'New' },
          { fieldId: 'author', value: 'Pulse Team' }, { fieldId: 'tags', value: [] },
          { fieldId: 'featured', value: false },
        ],
        blocks: [
          { id: `b-${Date.now()}-1`, type: 'heading', data: { text: 'Untitled Story', level: 1, anchorId: 'untitled' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: `b-${Date.now()}-2`, type: 'text', data: { text: 'Start writing...', marks: { bold: false, italic: false, underline: false, code: false }, align: 'left' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ],
      })
      const snap = await fetchBackendStudioSnapshot()
      setSnapshot(snap)
      setSelectedSlug(newEntry.slug)
      showToast('Created new draft', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create'
      showToast(msg, 'error')
      console.error('Create entry failed:', err)
    }
  }

  async function handleSave() {
    await runMutation(() => ({ message: 'Saved' }))
  }
  async function handlePublish() {
    if (!selectedSlug) return
    try {
      const e = await entriesApi.getBySlug(selectedSlug)
      if (!e) { showToast('Entry not found', 'error'); return }
      await entriesApi.publish(e.id)
      setSnapshot(await fetchBackendStudioSnapshot())
      showToast('Published successfully', 'success')
    } catch (err) { showToast(err instanceof Error ? err.message : 'Publish failed', 'error') }
  }
  async function handleSubmit() {
    if (!selectedSlug) return
    try {
      const e = await entriesApi.getBySlug(selectedSlug)
      if (!e) { showToast('Entry not found', 'error'); return }
      await entriesApi.submitReview(e.id)
      setSnapshot(await fetchBackendStudioSnapshot())
      showToast('Submitted for review', 'success')
    } catch (err) { showToast(err instanceof Error ? err.message : 'Submit failed', 'error') }
  }
  async function handleReturnToDraft() {
    if (!selectedSlug) return
    try {
      const e = await entriesApi.getBySlug(selectedSlug)
      if (!e) { showToast('Entry not found', 'error'); return }
      await entriesApi.unpublish(e.id)
      setSnapshot(await fetchBackendStudioSnapshot())
      showToast('Returned to draft', 'success')
    } catch (err) { showToast(err instanceof Error ? err.message : 'Unpublish failed', 'error') }
  }
  async function handleArchive() {
    if (!selectedSlug) return
    try {
      const e = await entriesApi.getBySlug(selectedSlug)
      if (!e) { showToast('Entry not found', 'error'); return }
      await entriesApi.archive(e.id)
      setSnapshot(await fetchBackendStudioSnapshot())
      showToast('Archived', 'success')
    } catch (err) { showToast(err instanceof Error ? err.message : 'Archive failed', 'error') }
  }
  async function handleSchedule() {
    if (!scheduleFor) { showToast('Pick a date/time', 'info'); return }
    if (!selectedSlug) return
    try {
      const e = await entriesApi.getBySlug(selectedSlug)
      if (!e) { showToast('Entry not found', 'error'); return }
      await entriesApi.schedule(e.id, fromDatetimeLocal(scheduleFor))
      setSnapshot(await fetchBackendStudioSnapshot())
      showToast('Scheduled', 'success')
    } catch (err) { showToast(err instanceof Error ? err.message : 'Schedule failed', 'error') }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !draft) return
    setUploadingImage(true)
    try {
      const result = await mediaApi.upload(file)
      setPendingImage({
        url: result.url,
        name: file.name.replace(/\.[^/.]+$/, ''),
        width: result.width,
        height: result.height,
      })
      setImageSettingsOpen(true)
      setNotice('Image uploaded')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  function applyImageSettings(alt: string, width: string, height: string, rename: string, format: string) {
    if (!pendingImage) return
    let url = pendingImage.url
    const params = new URLSearchParams()
    if (width) params.set('w', width)
    if (height) params.set('h', height)
    if (format && format !== 'original') params.set('fmt', format)
    if (rename && rename !== pendingImage.name) params.set('name', rename)
    const paramStr = params.toString()
    if (paramStr) url = `${url}?${paramStr}`
    updateDraft('featuredImage', url)
    updateDraft('featuredImageAlt', alt || rename || pendingImage.name)
    setImageSettingsOpen(false)
    setPendingImage(null)
  }

  /* Device preview widths */
  const deviceWidth = { desktop: '1200px', tablet: '768px', mobile: '375px' }[deviceMode]
  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--neutral-50)]">
        <div className="text-center">
          <Sparkles className="mx-auto h-8 w-8 text-[var(--pulse-red)]" />
          <p className="mt-3 text-sm font-bold text-[var(--pulse-black)]">Loading editor…</p>
        </div>
      </div>
    )
  }

  if (!selectedEntry || !draft) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--neutral-50)]">
        <div className="text-center max-w-md px-6">
          <Sparkles className="mx-auto h-10 w-10 text-[var(--pulse-red)]" />
          <h2 className="mt-4 text-lg font-bold text-[var(--pulse-black)]">Welcome to Pulse Studio</h2>
          <p className="mt-2 text-sm text-[var(--neutral-500)]">
            {snapshot.entries.length > 0
              ? 'Select an entry from the sidebar or create a new one to start writing.'
              : 'Create your first entry to start writing.'}
          </p>
          <button
            onClick={handleCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--pulse-black)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--pulse-red)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Entry
          </button>
        </div>
      </div>
    )
  }

return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* Top bar — swaps between normal and focus */}
      <AnimatePresence mode="wait">
        {focusMode ? (
          <motion.header
            key="focus-topbar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--neutral-200)] bg-white/90 px-3 backdrop-blur"
          >
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => { setFocusMode(false); setSidebarOpen(sidebarOpenBeforeFocusRef.current) }} className="rounded p-1 text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] transition-colors" title="Exit focus (Esc)">
                <Minimize2 className="h-4 w-4" />
              </button>
              <span className="truncate text-xs font-semibold text-[var(--pulse-black)] max-w-[200px]">{draft.title || 'Untitled'}</span>
              {isDirty && <span className="text-[10px] font-bold text-amber-600">• Unsaved</span>}
            </div>
            <div className="flex items-center gap-1">
              <IconBtn onClick={handleSave} active={isDirty} title="Save (Ctrl+S)"> <Save className="h-4 w-4" /> </IconBtn>
              <IconBtn onClick={() => { setPreviewOpen(p => !p); setHelpOpen(false); setCommentsOpen(false); setNotebookOpen(false) }} active={previewOpen} title="Toggle preview (Ctrl+P)"> <Columns2 className="h-4 w-4" /> </IconBtn>
              <IconBtn onClick={() => { setHelpOpen(h => !h); setPreviewOpen(false); setCommentsOpen(false); setNotebookOpen(false) }} active={helpOpen} title="Help (Ctrl+H)"> <HelpCircle className="h-4 w-4" /> </IconBtn>
              <IconBtn onClick={() => { setCommentsOpen(c => !c); setNotebookOpen(false); setPreviewOpen(false); setHelpOpen(false) }} active={commentsOpen} title="Comments (Ctrl+Shift+C)">
                <MessageSquare className="h-4 w-4" />
              </IconBtn>
              <IconBtn onClick={() => { setNotebookOpen(n => !n); setCommentsOpen(false); setPreviewOpen(false); setHelpOpen(false) }} active={notebookOpen} title="Notebook (Ctrl+Alt+N or Ctrl+Shift+Y)">
                <BookOpen className="h-4 w-4" />
              </IconBtn>
              <button onClick={handlePublish} className="ml-1 rounded-md bg-[var(--pulse-black)] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[var(--pulse-red)] transition-colors">Publish</button>
            </div>
          </motion.header>
        ) : (
          <motion.header
            key="normal-topbar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--neutral-200)] bg-white px-3"
          >
            {/* Left */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Link href="/admin/content" className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] transition-colors" title="Back to Content Library">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <IconBtn onClick={() => setSidebarOpen(!sidebarOpen)} active={sidebarOpen} title={sidebarOpen ? 'Hide sidebar (Ctrl+\\)' : 'Show sidebar (Ctrl+\\)'}>
                {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </IconBtn>
              <IconBtn onClick={() => { sidebarOpenBeforeFocusRef.current = sidebarOpen; setSidebarOpen(false); setFocusMode(true) }} title="Focus mode (Ctrl+.)">
                <Focus className="h-4 w-4" />
              </IconBtn>
              <div className="mx-1.5 h-4 w-px bg-[var(--neutral-200)]" />
              <span className="truncate text-xs font-semibold text-[var(--pulse-black)] max-w-[200px] sm:max-w-xs" title={draft.title}>{draft.title || 'Untitled'}</span>
              <span className="hidden sm:flex items-center gap-1 rounded-full border border-[var(--neutral-200)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                <StatusDot status={currentStatus} />{currentStatus}
              </span>
              {isDirty && <span className="hidden sm:inline text-[10px] font-bold text-amber-600">• Unsaved</span>}
            </div>

            {/* Right */}
            <div className="flex items-center gap-1">
              <label className="hidden md:flex items-center gap-1 rounded-md border border-[var(--neutral-200)] px-2 py-0.5 text-[10px] text-[var(--neutral-600)]">
                <ShieldCheck className="h-3 w-3 text-[var(--pulse-red)]" />
                <select value={role} onChange={e => setRole(e.target.value as RoleOption)} className="bg-transparent font-semibold text-[var(--pulse-black)] outline-none">
                  <option value="author">Author</option><option value="editor">Editor</option>
                  <option value="reviewer">Reviewer</option><option value="admin">Admin</option>
                </select>
              </label>
              <IconBtn onClick={handleSave} active={isDirty} title="Save (Ctrl+S)">
                <Save className="h-4 w-4" />
              </IconBtn>
              <IconBtn onClick={() => { setPreviewOpen(p => !p); setHelpOpen(false) }} active={previewOpen} title="Toggle preview (Ctrl+P)">
                <Columns2 className="h-4 w-4" />
              </IconBtn>
              <IconBtn onClick={() => { setHelpOpen(h => !h); setPreviewOpen(false); setCommentsOpen(false); setNotebookOpen(false) }} active={helpOpen} title="Help (Ctrl+H)">
                <HelpCircle className="h-4 w-4" />
              </IconBtn>
              <IconBtn onClick={() => { setCommentsOpen(c => !c); setNotebookOpen(false); setPreviewOpen(false); setHelpOpen(false) }} active={commentsOpen} title="Comments (Ctrl+Shift+C)">
                <MessageSquare className="h-4 w-4" />
                {Object.keys(blockCommentCounts).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--pulse-red)] text-[7px] font-bold text-white">
                    {Object.keys(blockCommentCounts).length}
                  </span>
                )}
              </IconBtn>
              <IconBtn onClick={() => { setNotebookOpen(n => !n); setCommentsOpen(false); setPreviewOpen(false); setHelpOpen(false) }} active={notebookOpen} title="Notebook (Ctrl+Shift+N)">
                <BookOpen className="h-4 w-4" />
              </IconBtn>
              <Link href={`/blog/preview?slug=${selectedEntry.slug}`} target="_blank" className="rounded p-1 text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] transition-colors" title="Open preview in new tab">
                <Eye className="h-4 w-4" />
              </Link>
              <button onClick={handleCreate} className="rounded p-1 text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] transition-colors" title="New entry">
                <Plus className="h-4 w-4" />
              </button>
              <button onClick={handlePublish} className="ml-1 rounded-md bg-[var(--pulse-black)] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[var(--pulse-red)] transition-colors">
                Publish
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ═══ Main ═══ */}
      <div className="flex flex-1 overflow-hidden">
       {/* ── Sidebar ── */}
       <motion.aside
         initial={false}
         animate={{ width: sidebarOpen ? 280 : 0 }}
         transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 flex-shrink-0 overflow-hidden border-r border-[var(--neutral-200)] bg-[var(--neutral-50)]"
        >
          <div className="w-[280px] h-full overflow-y-auto">
            {notice && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className={cx('mx-3 mt-3 rounded-lg border px-3 py-2 text-xs',
                  notice.includes('failed') || notice.includes('error') || notice.includes('Not found')
                    ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
                {notice}
              </motion.div>
            )}

            <Section title="Details" icon={FileText}>
              <div className="space-y-3">
                <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Slug</span>
                  <input value={draft.slug} onChange={e => updateDraft('slug', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 font-mono text-xs outline-none focus:border-[var(--pulse-red)] focus:ring-1 focus:ring-[var(--pulse-red)]/20" />
                </label>
                <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Eyebrow</span>
                  <input value={draft.eyebrow} onChange={e => updateDraft('eyebrow', e.target.value)}
                    placeholder="e.g. Featured Story, Studio Draft"
                    className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse-red)]" />
                  <p className="mt-1 text-[10px] text-[var(--neutral-400)]">A small label shown above the article title.</p>
                </label>
                <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Author</span>
                  <div className="relative mt-1">
                    <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--neutral-400)]" />
                    <input value={draft.author} onChange={e => updateDraft('author', e.target.value)}
                      className="w-full rounded-lg border border-[var(--neutral-200)] bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[var(--pulse-red)]" />
                  </div>
                </label>
                <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Excerpt</span>
                  <textarea value={draft.excerpt} onChange={e => updateDraft('excerpt', e.target.value)} rows={3}
                    className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse-red)] resize-none" />
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 cursor-pointer">
                  <input type="checkbox" checked={draft.featured} onChange={e => updateDraft('featured', e.target.checked)} className="h-4 w-4 accent-[var(--pulse-red)]" />
                  <span className="text-xs font-semibold text-[var(--pulse-black)]">Featured post</span>
                </label>
                <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Featured image</span>
                  <div className="relative mt-1">
                    <ImageIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--neutral-400)]" />
                    <input value={draft.featuredImage} onChange={e => updateDraft('featuredImage', e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-[var(--neutral-200)] bg-white py-1.5 pl-8 pr-3 font-mono text-xs outline-none focus:border-[var(--pulse-red)]" />
                  </div>
                  <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--neutral-300)] bg-white px-3 py-2 text-xs font-semibold text-[var(--neutral-600)] hover:border-[var(--pulse-red)] hover:text-[var(--pulse-red)] transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingImage ? 'Uploading…' : 'Upload image'}
                    <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                  {draft.featuredImage && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-[var(--neutral-200)]">
                      <img src={draft.featuredImage} alt={draft.featuredImageAlt || ''} className="h-24 w-full object-cover" />
                    </div>
                  )}
                </label>
                <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Featured image alt</span>
                  <input value={draft.featuredImageAlt} onChange={e => updateDraft('featuredImageAlt', e.target.value)}
                    placeholder="Descriptive alt text"
                    className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse-red)]" />
                </label>
              </div>
            </Section>

            <Section title="Taxonomies" icon={Hash}>
              {loadingTaxonomies ? <p className="text-xs text-[var(--neutral-500)]">Loading…</p> :
               taxonomies.length === 0 ? <p className="text-xs text-[var(--neutral-500)]">No taxonomies yet.</p> :
               <div className="space-y-3">
                 {taxonomies.map(t => (
                   <div key={t.id}>
                     <div className="mb-1.5 flex items-center gap-1.5">
                       <span className="text-[10px] font-bold text-[var(--pulse-black)]">{t.name}</span>
                       {t.config.allowMultiple && <span className="rounded bg-[var(--neutral-100)] px-1 text-[9px] text-[var(--neutral-500)]">Multi</span>}
                       {t.config.required && <span className="rounded bg-[var(--pulse-jasmine)]/40 px-1 text-[9px] font-bold">Req</span>}
                     </div>
                     <div className="flex flex-wrap gap-1.5">
                       {(t.terms || []).map(term => (
                         <TermChip key={term.id} term={term} selected={draft.taxonomyIds.includes(term.id)} onClick={() => toggleTerm(term.id)} />
                       ))}
                     </div>
                   </div>
                 ))}
               </div>}
            </Section>

            <Section title="Tags" icon={Tag}>
              <input value={draft.tags} onChange={e => updateDraft('tags', e.target.value)}
                placeholder="comma, separated"
                className="w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse-red)]" />
              <p className="mt-1.5 text-[10px] text-[var(--neutral-400)]">
                Free-form keywords. Taxonomies (above) are structured categories managed by admins.
              </p>
            </Section>

            <Section title="SEO" icon={BarChart3}>
              <div className="space-y-3">
                <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Title</span>
                  <input value={draft.seoTitle} onChange={e => updateDraft('seoTitle', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse-red)]" />
                </label>
                <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Description</span>
                  <textarea value={draft.seoDescription} onChange={e => updateDraft('seoDescription', e.target.value)} rows={2}
                    className="mt-1 w-full rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--pulse-red)] resize-none" />
                </label>
              </div>
            </Section>

            <Section title="Workflow" icon={Globe}>
              <div className="space-y-2">
                <button onClick={handleSubmit} className="flex w-full items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-xs font-semibold text-[var(--pulse-black)] hover:bg-[var(--neutral-100)] transition-colors">
                  <Send className="h-3.5 w-3.5" />Submit for Review
                </button>
                <button onClick={handleReturnToDraft} className="flex w-full items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-xs font-semibold text-[var(--pulse-black)] hover:bg-[var(--neutral-100)] transition-colors">
                  <FilePenLine className="h-3.5 w-3.5" />Return to Draft
                </button>
                <button onClick={handleArchive} className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />Archive
                </button>
                <div className="rounded-lg border border-[var(--neutral-200)] bg-white p-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Schedule</span>
                  <input type="datetime-local" value={scheduleFor} onChange={e => setScheduleFor(e.target.value)}
                    className="mt-1 w-full rounded-md border border-[var(--neutral-200)] px-2 py-1 text-xs outline-none" />
                  <button onClick={handleSchedule} className="btn btn-outline mt-2 w-full justify-center px-3 py-1.5 text-xs">
                    <Clock3 className="h-3.5 w-3.5" />Queue
                  </button>
                </div>
              </div>
            </Section>

            {entries.length > 1 && (
              <Section title="Entries" icon={FileText} defaultOpen={false}>
                <div className="space-y-1">
                  {entries.map(e => (
                    <button key={e.slug} onClick={() => setSelectedSlug(e.slug)}
                      className={cx('w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                        e.slug === selectedSlug ? 'bg-[var(--pulse-red)]/10 font-bold text-[var(--pulse-red)]' : 'text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]')}>
                      <span className="block truncate">{e.title}</span>
                      <span className="text-[10px] text-[var(--neutral-400)]">{e.status}</span>
                    </button>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </motion.aside>

       {/* ── Editor + Preview ── */}
        <div className="flex flex-1 overflow-hidden">
         {/* Editor */}
         <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-6 py-8 md:px-10 md:py-10">
              <input value={draft.title} onChange={e => updateDraft('title', e.target.value)}
                className="w-full bg-transparent text-3xl font-bold leading-tight text-[var(--pulse-black)] outline-none placeholder:text-[var(--neutral-300)] md:text-4xl"
                placeholder="Article title" />
              <LiveStats editorBlocks={editorBlocks} draft={draft} selectedEntry={selectedEntry} />
              <div className="mt-8">
                <StudioBlockCanvas
                  adapter={editorAdapter}
                  blocks={editorBlocks}
                  blockCommentCounts={blockCommentCounts}
                  blockActiveCommentCounts={blockActiveCommentCounts}
                  pulseBlockId={pulseBlockId}
                  onBlockCommentClick={(blockId) => {
                    setActiveBlockId(blockId)
                    setCommentsOpen(true)
                    setNotebookOpen(false)
                    setPreviewOpen(false)
                    setHelpOpen(false)
                  }}
                  onAddBlockComment={(blockId) => {
                    setActiveBlockId(blockId)
                    setCommentsOpen(true)
                    setNotebookOpen(false)
                    setPreviewOpen(false)
                    setHelpOpen(false)
                  }}
                />
              </div>
            </div>
          </div>

          {/* Preview panel */}
          <AnimatePresence>
            {previewOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '45%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex-shrink-0 overflow-hidden border-l border-[var(--neutral-200)] bg-[var(--neutral-50)]"
              >
                <div className="flex h-full flex-col">
                  {/* Preview toolbar */}
                  <div className="flex items-center justify-between border-b border-[var(--neutral-200)] bg-white px-3 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Preview</span>
                    <div className="flex items-center gap-0.5">
                      <div className="mr-1 flex items-center gap-0.5 rounded-md border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-0.5">
                        <button onClick={() => setPreviewMode('article')} className={cx('rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors', previewMode === 'article' ? 'bg-white text-[var(--pulse-black)] shadow-sm' : 'text-[var(--neutral-500)] hover:text-[var(--pulse-black)]')} title="Article view">
                          <FileText className="h-3 w-3" />
                        </button>
                        <button onClick={() => setPreviewMode('list')} className={cx('rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors', previewMode === 'list' ? 'bg-white text-[var(--pulse-black)] shadow-sm' : 'text-[var(--neutral-500)] hover:text-[var(--pulse-black)]')} title="List card view">
                          <List className="h-3 w-3" />
                        </button>
                      </div>
                      <IconBtn onClick={() => setDeviceMode('desktop')} active={deviceMode === 'desktop'} title="Desktop">
                        <Monitor className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn onClick={() => setDeviceMode('tablet')} active={deviceMode === 'tablet'} title="Tablet">
                        <Tablet className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn onClick={() => setDeviceMode('mobile')} active={deviceMode === 'mobile'} title="Mobile">
                        <Smartphone className="h-3.5 w-3.5" />
                      </IconBtn>
                      <div className="mx-1 h-3 w-px bg-[var(--neutral-200)]" />
                      <button onClick={() => setPreviewOpen(false)} className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] transition-colors" title="Close preview">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Preview content */}
                  <div ref={previewContainerRef} className="flex-1 overflow-y-auto p-4">
                    <div className="mx-auto transition-all duration-300" style={{ width: deviceWidth, zoom: previewZoom }} data-device-mode={deviceMode}>
                      {previewMode === 'article' ? (
                        <div className="rounded-xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
                          {draft.featuredImage && (
                            <div className="mb-4 overflow-hidden rounded-lg">
                              <img src={draft.featuredImage} alt={draft.featuredImageAlt || draft.title} className="w-full object-cover max-h-48" />
                            </div>
                          )}
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-red)]">{draft.eyebrow}</p>
                          <h1 className="mt-1 text-2xl font-bold text-[var(--pulse-black)]">{draft.title}</h1>
                          <p className="mt-3 text-sm leading-relaxed text-[var(--neutral-600)]">{draft.excerpt}</p>
                          <div className="studio-rendered mt-6" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </div>
                      ) : (
                        <div className="rounded-xl border border-[var(--neutral-200)] bg-white shadow-sm overflow-hidden">
                          {draft.featuredImage && (
                            <div className="aspect-[16/9] overflow-hidden bg-[var(--neutral-100)]">
                              <img src={draft.featuredImage} alt={draft.featuredImageAlt || draft.title} className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-[var(--pulse-red)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">{draft.eyebrow || 'Post'}</span>
                              <span className="text-[10px] text-[var(--neutral-400)]">{formatReadTime(countWords(editorBlocks))}</span>
                            </div>
                            <h3 className="mt-2 text-base font-bold text-[var(--pulse-black)] leading-snug line-clamp-2">{draft.title}</h3>
                            <p className="mt-1.5 text-xs leading-relaxed text-[var(--neutral-600)] line-clamp-3">{draft.excerpt}</p>
                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--neutral-200)] text-[8px] font-bold text-[var(--neutral-600)]">{draft.author?.charAt(0)?.toUpperCase() || 'A'}</div>
                              <span className="text-[10px] font-semibold text-[var(--neutral-500)]">{draft.author || 'Anonymous'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help panel */}
          <AnimatePresence>
            {helpOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '45%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex-shrink-0 overflow-hidden border-l border-[var(--neutral-200)] bg-[var(--neutral-50)]"
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-[var(--neutral-200)] bg-white px-3 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">Help</span>
                    <button onClick={() => setHelpOpen(false)} className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] transition-colors" title="Close help">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <HelpReference />
                  </div>
                </div>
              </motion.div>
            )}
         </AnimatePresence>

          {/* Comments panel */}
          <AnimatePresence>
            {commentsOpen && selectedEntry && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 380, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex-shrink-0 overflow-hidden border-l border-[var(--neutral-200)]"
              >
                <StudioCommentsPanel
                  commentSystem={commentSystem}
                  entryId={selectedEntry.id || selectedEntry.slug}
                  activeBlockId={activeBlockId}
                  blocks={editorBlocks}
                  onSelectBlock={(blockId) => {
                    setActiveBlockId(blockId)
                    setPulseBlockId(blockId)
                    setTimeout(() => setPulseBlockId(null), 2200)
                    // Wait for panel animation (300ms) then smooth-scroll block into center view
                    setTimeout(() => {
                      const el = document.querySelector(`[data-block-id="${blockId}"]`)
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }, 350)
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notebook panel */}
          <AnimatePresence>
            {notebookOpen && selectedEntry && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex-shrink-0 overflow-hidden border-l border-[var(--neutral-200)]"
              >
                <StudioNotebookPanel
                  entryId={selectedEntry.id || selectedEntry.slug}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
     </div>

      {/* Image Settings Modal */}
      <AnimatePresence>
        {imageSettingsOpen && pendingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => { setImageSettingsOpen(false); setPendingImage(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--neutral-200)] px-4 py-3">
                <span className="text-sm font-bold text-[var(--pulse-black)]">Image Settings</span>
                <button onClick={() => { setImageSettingsOpen(false); setPendingImage(null); }} className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ImageSettingsForm
                pendingImage={pendingImage}
                draftAlt={draft?.featuredImageAlt || ''}
                onApply={applyImageSettings}
                onCancel={() => { setImageSettingsOpen(false); setPendingImage(null); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
