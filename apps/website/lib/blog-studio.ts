import type { Block, BlockData } from '@pulse/core'
import {
  ContentAdminManager,
  ContentTypeRegistry,
  EntryManager,
  WorkflowEngine,
  type Entry,
  type EntryStatus,
  type WorkflowRole,
} from '@pulse/core'
import {
  PulseRenderer,
  RendererRegistry,
  registerBuiltinRenderers,
} from '@pulse/renderer'
import { BUILTIN_BLOCK_DEFINITIONS, formatReferenceNumber } from '@pulse/blocks'

export interface StudioTextMarks {
  bold: boolean
  italic: boolean
  underline: boolean
  code: boolean
}

export interface StudioTextBlockData extends Record<string, unknown> {
  text: string
  marks: StudioTextMarks
  align?: 'left' | 'center' | 'right' | 'justify'
}

export interface StudioHeadingBlockData extends Record<string, unknown> {
  text: string
  level: 1 | 2 | 3 | 4 | 5 | 6
  anchorId?: string
}

export interface StudioCalloutBlockData extends Record<string, unknown> {
  variant: 'info' | 'tip' | 'warning' | 'success' | 'note'
  title?: string
  body: string
  icon?: string
}

export type StudioBlockData = BlockData

export type StudioBlock = Block<BlockData>

export interface BlogStudioEntrySnapshot {
  id?: string
  slug: string
  title: string
  status: EntryStatus
  excerpt: string
  eyebrow: string
  author: string
  tags: string[]
  featured: boolean
  featuredImage?: string
  featuredImageAlt?: string
  ogImage?: string
  seoTitle?: string
  seoDescription?: string
  blocks: StudioBlock[]
  publishedAt?: string | null
  scheduledAt?: string | null
  createdAt?: string
  updatedAt?: string
  taxonomyIds?: string[]
}

export interface BlogStudioTimelineEvent {
  id: string
  entrySlug: string
  type: 'created' | 'updated' | 'status' | 'scheduled' | 'automation'
  message: string
  at: string
  actorId: string
}

export interface BlogStudioSnapshot {
  entries: BlogStudioEntrySnapshot[]
  timeline: BlogStudioTimelineEvent[]
}

export interface BlogStudioEntry {
  id?: string
  slug: string
  title: string
  status: EntryStatus
  excerpt: string
  eyebrow: string
  author: string
  tags: string[]
  featured: boolean
  featuredImage?: string
  featuredImageAlt?: string
  ogImage?: string
  seoTitle: string
  seoDescription: string
  seoScore: number
  wordCount: number
  readTime: string
  blocks: StudioBlock[]
  html: string
  publishedAt: string | null
  scheduledAt: string | null
  createdAt: string
  updatedAt: string
  taxonomyIds?: string[]
}

export interface BlogStudioListItem {
  slug: string
  title: string
  status: EntryStatus
  updatedAt: string
  seoScore: number
  wordCount: number
}

export interface CreateStudioEntryInput {
  title?: string
  author?: string
}

export interface UpdateStudioEntryInput {
  title?: string
  slug?: string
  excerpt?: string
  eyebrow?: string
  author?: string
  tags?: string[]
  featured?: boolean
  seoTitle?: string
  seoDescription?: string
  blocks?: StudioBlock[]
  taxonomyIds?: string[]
  featuredImage?: string
  featuredImageAlt?: string
}

export interface TransitionStudioEntryInput {
  slug: string
  toStatus: EntryStatus
  actorId: string
  role: WorkflowRole
}

export interface ScheduleStudioEntryInput {
  slug: string
  scheduledAt: string
  actorId: string
  role: WorkflowRole
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

const BLOG_CONTENT_TYPE_ID = 'pulse-blog-post'
export const BLOG_STUDIO_STORAGE_KEY = 'pulse.website.blog-studio'
const VALID_ENTRY_STATUSES: ReadonlySet<EntryStatus> = new Set([
  'draft',
  'review',
  'scheduled',
  'published',
  'archived',
])
const VALID_TIMELINE_EVENT_TYPES: ReadonlySet<BlogStudioTimelineEvent['type']> = new Set([
  'created',
  'updated',
  'status',
  'scheduled',
  'automation',
])
const VALID_STUDIO_BLOCK_TYPES = new Set((BUILTIN_BLOCK_DEFINITIONS as unknown as any[]).map((d) => d.type))

function nowIso(): string {
  return new Date().toISOString()
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function uniqueSlug(base: string, existing: Set<string>): string {
  const seed = slugify(base) || 'untitled-post'

  if (!existing.has(seed)) {
    return seed
  }

  let index = 2
  let next = `${seed}-${index}`
  while (existing.has(next)) {
    index += 1
    next = `${seed}-${index}`
  }

  return next
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeEntryStatus(value: unknown): EntryStatus {
  if (typeof value === 'string' && VALID_ENTRY_STATUSES.has(value as EntryStatus)) {
    return value as EntryStatus
  }

  return 'draft'
}

function getFieldValue<T>(entry: Entry, fieldId: string, fallback: T): T {
  const fieldValue = entry.fieldValues.find((item) => item.fieldId === fieldId)
  return (fieldValue?.value as T | undefined) ?? fallback
}

function setFieldValue(
  fieldMap: Map<string, unknown>,
  fieldId: string,
  value: unknown,
): void {
  fieldMap.set(fieldId, value)
}

function getBlockText(block: StudioBlock): string {
  const data = block.data as Record<string, unknown>
  if (typeof data.text === 'string') return data.text
  if (typeof data.body === 'string') {
    const title = typeof data.title === 'string' ? data.title : ''
    return `${title} ${data.body}`.trim()
  }
  if (typeof data.code === 'string') return data.code
  if (Array.isArray(data.items)) {
    return data.items.filter((i): i is string => typeof i === 'string').join(' ')
  }
  return ''
}

function countWords(blocks: StudioBlock[]): number {
  const text = blocks.map(getBlockText).join(' ').trim()
  if (!text) {
    return 0
  }

  return text.split(/\s+/).filter(Boolean).length
}

function formatReadTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 220))
  return `${minutes} min read`
}

// ─── Inline link renderers (override built-in) ───

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAndBreaks(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br />');
}

type RefStyle = 'numeric' | 'alphabetic' | 'greek' | 'abjad'

interface InlineRef {
  url: string
  text?: string
  style: RefStyle
}

const INLINE_REF_REGEX = /\[ref\]\(([^)]+)\)(?:\{([^}]*)\})?/g

function extractRefs(text: string): InlineRef[] {
  const refs: InlineRef[] = []
  let match: RegExpExecArray | null
  while ((match = INLINE_REF_REGEX.exec(text)) !== null) {
    const url = match[1]
    const attrs = match[2] || ''
    const textMatch = attrs.match(/text="([^"]*)"/)
    const styleMatch = attrs.match(/style="([^"]*)"/)
    refs.push({
      url,
      text: textMatch ? textMatch[1] : undefined,
      style: (styleMatch ? styleMatch[1] : 'numeric') as RefStyle,
    })
  }
  return refs
}

function renderInlineContent(text: string, refCounter: { value: number }): string {
  const regex = /\[([^\]]+)\]\(([^)]+)\)(?:\{([^}]*)\})?/g
  let result = ''
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    result += escapeAndBreaks(text.slice(lastIndex, match.index))
    const label = match[1]
    const url = match[2]
    const attrs = match[3] || ''

    if (label === 'ref') {
      refCounter.value++
      const textMatch = attrs.match(/text="([^"]*)"/)
      const styleMatch = attrs.match(/style="([^"]*)"/)
      const targetMatch = attrs.match(/target="([^"]*)"/)
      const relMatch = attrs.match(/rel="([^"]*)"/)
      const refText = textMatch ? textMatch[1] : ''
      const style = (styleMatch ? styleMatch[1] : 'numeric') as RefStyle
      const target = targetMatch ? targetMatch[1] : ''
      const rel = relMatch ? relMatch[1] : ''
      const num = formatReferenceNumber(refCounter.value, style)
      const titleAttr = refText ? ` title="${escapeHtml(refText)}"` : ''
      const targetAttr = target ? ` target="${escapeHtml(target)}"` : ''
      const relAttr = rel ? ` rel="${escapeHtml(rel)}"` : ''
      result += `<sup class="pulse-reference"><a href="${escapeHtml(url)}"${titleAttr}${targetAttr}${relAttr}>${num}</a></sup>`
    } else {
      const relMatch = attrs.match(/rel="([^"]*)"/)
      const rel = relMatch ? relMatch[1] : ''
      const targetMatch = attrs.match(/target="([^"]*)"/)
      const target = targetMatch ? targetMatch[1] : ''
      const relAttr = rel ? ` rel="${escapeHtml(rel)}"` : ''
      const targetAttr = target ? ` target="${escapeHtml(target)}"` : ''
      result += `<a href="${escapeHtml(url)}" class="pulse-inline-link"${relAttr}${targetAttr}>${escapeHtml(label)}</a>`
    }
    lastIndex = match.index + match[0].length
  }

  result += escapeAndBreaks(text.slice(lastIndex))
  return result
}

function applyTextMarks(text: string, marks: { bold: boolean; italic: boolean; underline: boolean; code: boolean }, refCounter: { value: number }): string {
  let output = renderInlineContent(text, refCounter)
  if (marks.code) output = `<code>${output}</code>`
  if (marks.bold) output = `<strong>${output}</strong>`
  if (marks.italic) output = `<em>${output}</em>`
  if (marks.underline) output = `<u>${output}</u>`
  return output
}

function toSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function registerCustomRenderers(registry: RendererRegistry, refCounter: { value: number }): void {
  registry.override('text', (block) => {
    const data = block.data as { text: string; marks: { bold: boolean; italic: boolean; underline: boolean; code: boolean }; align?: string }
    const align = data.align ?? 'left'
    const alignAttr = align === 'left' ? '' : ` style="text-align: ${align};"`
    return `<p data-block-type="text"${alignAttr}>${applyTextMarks(data.text, data.marks, refCounter)}</p>`
  })

  registry.override('heading', (block) => {
    const data = block.data as { text: string; level: number; anchorId?: string }
    const tag = `h${data.level}`
    const anchorId = data.anchorId ?? toSlug(data.text)
    return `<${tag} id="${escapeHtml(anchorId)}" data-block-type="heading">${renderInlineContent(data.text, refCounter)}</${tag}>`
  })

  registry.override('blockquote', (block) => {
    const data = block.data as { quote: string; citation?: string }
    const citation = data.citation ? `<cite>${escapeHtml(data.citation)}</cite>` : ''
    return `<blockquote data-block-type="blockquote"><p>${renderInlineContent(data.quote, refCounter)}</p>${citation}</blockquote>`
  })
}

function ensureRendererReady(): void {
  registerBuiltinRenderers(RendererRegistry.getInstance())
}

export function renderStudioBlocksHtml(blocks: StudioBlock[]): string {
  ensureRendererReady()
  const renderer = new PulseRenderer()

  // First pass: collect all inline refs from text/heading/blockquote blocks
  const allRefs: InlineRef[] = []
  for (const block of blocks) {
    if (block.type === 'text' || block.type === 'heading' || block.type === 'blockquote') {
      const data = block.data as Record<string, unknown>
      const text =
        typeof data.text === 'string'
          ? data.text
          : typeof data.quote === 'string'
            ? data.quote
            : ''
      allRefs.push(...extractRefs(text))
    }
  }

  // Override renderers with shared ref counter for global numbering
  const refCounter = { value: 0 }
  registerCustomRenderers(RendererRegistry.getInstance(), refCounter)

  const html = renderer.renderDocument(blocks).html

  // Add footnotes section for references that have text or url
  const footnotes = allRefs.filter((r) => r.text || r.url)
  if (footnotes.length > 0) {
    const footnotesHtml = footnotes
      .map((ref, index) => {
        const num = formatReferenceNumber(index + 1, ref.style)
        const content = ref.text || ref.url || ''
        const link = ref.url
          ? `<a href="${escapeHtml(ref.url)}">${escapeHtml(ref.text || ref.url)}</a>`
          : escapeHtml(content)
        return `<li id="ref-${index + 1}"><span class="pulse-ref-marker">${num}.</span> ${link}</li>`
      })
      .join('')
    return `${html}\n<section class="pulse-references"><h3>References</h3><ol>${footnotesHtml}</ol></section>`
  }

  return html
}

export function createStudioHeadingBlock(text: string, level: StudioHeadingBlockData['level'] = 2): StudioBlock {
  const timestamp = nowIso()

  return {
    id: createId('block'),
    type: 'heading',
    data: {
      text,
      level,
      anchorId: slugify(text),
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createStudioTextBlock(text: string): StudioBlock {
  const timestamp = nowIso()

  return {
    id: createId('block'),
    type: 'text',
    data: {
      text,
      marks: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
      },
      align: 'left',
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createStudioCalloutBlock(title: string, body: string): StudioBlock {
  const timestamp = nowIso()

  return {
    id: createId('block'),
    type: 'callout',
    data: {
      variant: 'note',
      title,
      body,
      icon: 'i',
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createStudioStarterBlocks(title: string): StudioBlock[] {
  return [
    createStudioHeadingBlock(title, 1),
    createStudioTextBlock(
      'Pulse turns articles into structured, block-first documents so editing, review, and publishing stay connected.',
    ),
    createStudioCalloutBlock(
      'Workflow note',
      'Use this post to test draft, review, scheduling, and publish transitions inside the website.',
    ),
  ]
}

export function createDefaultBlogStudioSnapshot(): BlogStudioSnapshot {
  const timestamp = nowIso()
  const title = 'Pulse dogfooding starts in the studio'
  const blocks = createStudioStarterBlocks(title)

  return {
    entries: [
      {
        slug: 'pulse-dogfooding-starts-in-the-studio',
        title,
        status: 'draft',
        excerpt:
          'A local Pulse-powered article used to validate the create, review, and publish loop before Phase 4 begins.',
        eyebrow: 'Studio Draft',
        author: 'Pulse Team',
        tags: ['Dogfooding', 'CMS'],
        featured: false,
        seoTitle: title,
        seoDescription:
          'A local draft that exercises Pulse blog authoring, editorial review, scheduling, and publishing workflows.',
        blocks,
        publishedAt: null,
        scheduledAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    timeline: [
      {
        id: createId('timeline'),
        entrySlug: 'pulse-dogfooding-starts-in-the-studio',
        type: 'created',
        message: 'Seeded the first local studio draft.',
        at: timestamp,
        actorId: 'system',
      },
    ],
  }
}

export function isBootstrapBlogStudioSnapshot(snapshot: BlogStudioSnapshot): boolean {
  if (snapshot.entries.length !== 1) {
    return false
  }

  const [entry] = snapshot.entries

  const isSeedDraft =
    entry.slug === 'pulse-dogfooding-starts-in-the-studio' &&
    entry.title === 'Pulse dogfooding starts in the studio' &&
    entry.status === 'draft'

  if (isSeedDraft) {
    return true
  }

  const isLegacySample =
    entry.slug === 'comprehensive-guide-to-modern-web-development' &&
    entry.title === 'A Comprehensive Guide to Modern Web Development in 2025' &&
    entry.status === 'published' &&
    entry.featured &&
    entry.author === 'Sarah Chen' &&
    entry.excerpt ===
      'Explore the latest trends, tools, and best practices shaping web development today. From performance optimization to accessibility, learn what it takes to build exceptional web experiences.' &&
    entry.tags.includes('Web Development') &&
    entry.tags.includes('Best Practices')

  return isLegacySample
}

function defaultBlockData(type: string): Record<string, unknown> {
  const def = (BUILTIN_BLOCK_DEFINITIONS as unknown as any[]).find((d) => d.type === type)
  if (def && typeof def.defaultData === 'function') {
    return def.defaultData() as Record<string, unknown>
  }
  if (def && def.defaultData) {
    return { ...def.defaultData } as Record<string, unknown>
  }
  return {
    text: '',
    marks: {
      bold: false,
      italic: false,
      underline: false,
      code: false,
    },
    align: 'left',
  }
}

function normalizeLegacyStudioBlockData(
  type: string,
  data: unknown,
): StudioBlockData {
  if (!isRecord(data) && !Array.isArray(data)) {
    return defaultBlockData(type) as StudioBlockData
  }

  if (type === 'blockquote' && isRecord(data)) {
    const quote = asOptionalString(data.quote) ?? asOptionalString(data.text) ?? 'Quote'
    const citation = asOptionalString(data.citation) ?? asOptionalString(data.author)

    return {
      quote,
      ...(citation ? { citation } : {}),
    } as StudioBlockData
  }

  return JSON.parse(JSON.stringify(data)) as StudioBlockData
}

function normalizeStudioBlock(value: unknown): StudioBlock | null {
  if (!isRecord(value)) {
    return null
  }

  const rawType = asOptionalString(value.type)
  const type =
    rawType === 'quote'
      ? 'blockquote'
      : rawType && VALID_STUDIO_BLOCK_TYPES.has(rawType)
        ? rawType
        : 'text'
  const timestamp = nowIso()
  const data =
    isRecord(value.data) || Array.isArray(value.data)
      ? normalizeLegacyStudioBlockData(type, value.data)
      : (defaultBlockData(type) as StudioBlockData)

  return {
    id: asOptionalString(value.id) ?? createId('block'),
    parentId: typeof value.parentId === 'string' ? value.parentId : undefined,
    type,
    data,
    createdAt: asOptionalString(value.createdAt) ?? timestamp,
    updatedAt: asOptionalString(value.updatedAt) ?? timestamp,
  }
}

function normalizeSnapshotEntry(
  value: unknown,
  existingSlugs: Set<string>,
): BlogStudioEntrySnapshot | null {
  if (!isRecord(value)) {
    return null
  }

  const id = asOptionalString(value.id)
  const title = asOptionalString(value.title) ?? 'Untitled Pulse Story'
  const slug = uniqueSlug(asOptionalString(value.slug) ?? title, existingSlugs)
  existingSlugs.add(slug)

  const status = normalizeEntryStatus(value.status)
  const normalizedBlocks = Array.isArray(value.blocks)
    ? value.blocks
        .map((block) => normalizeStudioBlock(block))
        .filter((block): block is StudioBlock => block !== null)
    : []
  const blocks = normalizedBlocks.length ? normalizedBlocks : createStudioStarterBlocks(title)
  const excerpt =
    asOptionalString(value.excerpt) ??
    'A recovered local Pulse draft ready for review, scheduling, and publish validation.'
  const createdAt = asOptionalString(value.createdAt) ?? nowIso()
  const featuredImage =
    asOptionalString(value.featuredImage) ??
    asOptionalString(value.featuredImageUrl) ??
    asOptionalString(value.coverImage) ??
    asOptionalString(value.coverImageUrl) ??
    asOptionalString(value.heroImage) ??
    asOptionalString(value.heroImageUrl)
  const featuredImageAlt =
    asOptionalString(value.featuredImageAlt) ??
    asOptionalString(value.coverImageAlt) ??
    asOptionalString(value.heroImageAlt)
  const ogImage = asOptionalString(value.ogImage) ?? featuredImage

  return {
    ...(id ? { id } : {}),
    slug,
    title,
    status,
    excerpt,
    eyebrow: asOptionalString(value.eyebrow) ?? 'Studio Draft',
    author: asOptionalString(value.author) ?? 'Pulse Team',
    tags: asStringArray(value.tags),
    featured: value.featured === true,
    featuredImage,
    featuredImageAlt,
    ogImage,
    seoTitle: asOptionalString(value.seoTitle) ?? title,
    seoDescription: asOptionalString(value.seoDescription) ?? excerpt,
    blocks,
    publishedAt: asNullableString(value.publishedAt),
    scheduledAt: status === 'scheduled' ? asNullableString(value.scheduledAt) : null,
    createdAt,
    updatedAt: asOptionalString(value.updatedAt) ?? createdAt,
  }
}

function normalizeTimelineEvent(
  value: unknown,
  validSlugs: Set<string>,
): BlogStudioTimelineEvent | null {
  if (!isRecord(value)) {
    return null
  }

  const entrySlug = asOptionalString(value.entrySlug)
  if (!entrySlug || !validSlugs.has(entrySlug)) {
    return null
  }

  const type = asOptionalString(value.type)
  const eventType = type && VALID_TIMELINE_EVENT_TYPES.has(type as BlogStudioTimelineEvent['type'])
    ? (type as BlogStudioTimelineEvent['type'])
    : 'updated'

  return {
    id: asOptionalString(value.id) ?? createId('timeline'),
    entrySlug,
    type: eventType,
    message: asOptionalString(value.message) ?? 'Recovered local studio activity.',
    at: asOptionalString(value.at) ?? nowIso(),
    actorId: asOptionalString(value.actorId) ?? 'system',
  }
}

export function sanitizeBlogStudioSnapshot(snapshot: unknown): BlogStudioSnapshot {
  if (!isRecord(snapshot)) {
    return createDefaultBlogStudioSnapshot()
  }

  const existingSlugs = new Set<string>()
  const entries = Array.isArray(snapshot.entries)
    ? snapshot.entries
        .map((entry) => normalizeSnapshotEntry(entry, existingSlugs))
        .filter((entry): entry is BlogStudioEntrySnapshot => entry !== null)
    : []

  if (!entries.length) {
    return createDefaultBlogStudioSnapshot()
  }

  const validSlugs = new Set(entries.map((entry) => entry.slug))
  const timeline = Array.isArray(snapshot.timeline)
    ? snapshot.timeline
        .map((event) => normalizeTimelineEvent(event, validSlugs))
        .filter((event): event is BlogStudioTimelineEvent => event !== null)
    : []

  if (!timeline.length) {
    timeline.push(
      createTimelineEvent(
        entries[0].slug,
        'updated',
        'Recovered the local studio snapshot after validating browser storage.',
        'system',
      ),
    )
  }

  return {
    entries,
    timeline,
  }
}

function cloneBlocks(blocks: StudioBlock[]): StudioBlock[] {
  return JSON.parse(JSON.stringify(blocks)) as StudioBlock[]
}

function toSnapshotEntry(entry: Entry): BlogStudioEntrySnapshot {
  const featuredImage = asOptionalString(getFieldValue(entry, 'featuredImage', ''))
  const featuredImageAlt = asOptionalString(getFieldValue(entry, 'featuredImageAlt', ''))

  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    status: entry.status,
    excerpt: getFieldValue(entry, 'excerpt', ''),
    eyebrow: getFieldValue(entry, 'eyebrow', 'Studio Draft'),
    author: getFieldValue(entry, 'author', 'Pulse Team'),
    tags: getFieldValue(entry, 'tags', [] as string[]),
    featured: getFieldValue(entry, 'featured', false),
    featuredImage,
    featuredImageAlt,
    ogImage: asOptionalString(entry.metadata?.ogImage) ?? featuredImage,
    seoTitle: entry.metadata?.seoTitle ?? entry.title,
    seoDescription: entry.metadata?.seoDescription ?? '',
    blocks: cloneBlocks((entry.blocks as StudioBlock[] | undefined) ?? []),
    publishedAt: entry.publishedAt ?? null,
    scheduledAt: entry.scheduledAt ?? null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    taxonomyIds: asStringArray(entry.taxonomyIds),
  }
}

function createTimelineEvent(
  entrySlug: string,
  type: BlogStudioTimelineEvent['type'],
  message: string,
  actorId: string,
): BlogStudioTimelineEvent {
  return {
    id: createId('timeline'),
    entrySlug,
    type,
    message,
    at: nowIso(),
    actorId,
  }
}

export class BlogStudioWorkspace {
  private readonly contentTypeRegistry: ContentTypeRegistry
  private readonly entryManager: EntryManager
  private readonly workflowEngine: WorkflowEngine
  private readonly adminManager: ContentAdminManager
  private readonly timeline: BlogStudioTimelineEvent[]

  constructor(snapshot: BlogStudioSnapshot = createDefaultBlogStudioSnapshot()) {
    this.contentTypeRegistry = new ContentTypeRegistry()
    this.registerContentType()
    this.entryManager = new EntryManager({
      contentTypeRegistry: this.contentTypeRegistry,
      defaultStatus: 'draft',
    })
    this.workflowEngine = new WorkflowEngine()
    this.adminManager = new ContentAdminManager({
      entryManager: this.entryManager,
      contentTypeRegistry: this.contentTypeRegistry,
    })
    this.timeline = [...snapshot.timeline]

    for (const entry of snapshot.entries) {
      const restored = this.entryManager.create(BLOG_CONTENT_TYPE_ID, {
        title: entry.title,
        slug: entry.slug,
        status: entry.status,
        blocks: cloneBlocks(entry.blocks),
        fieldValues: [
          { fieldId: 'excerpt', value: entry.excerpt },
          { fieldId: 'eyebrow', value: entry.eyebrow },
          { fieldId: 'author', value: entry.author },
          { fieldId: 'tags', value: [...entry.tags] },
          { fieldId: 'featured', value: entry.featured },
          ...(entry.featuredImage
            ? [{ fieldId: 'featuredImage', value: entry.featuredImage }]
            : []),
          ...(entry.featuredImageAlt
            ? [{ fieldId: 'featuredImageAlt', value: entry.featuredImageAlt }]
            : []),
        ],
        metadata: {
          seoTitle: entry.seoTitle ?? entry.title,
          seoDescription: entry.seoDescription ?? entry.excerpt,
          seoKeywords: [...entry.tags],
          ...(entry.ogImage ? { ogImage: entry.ogImage } : {}),
        },
        taxonomyIds: entry.taxonomyIds,
      })

      if (entry.id) {
        const internalEntries = (this.entryManager as any).entries as Map<string, Entry>
        internalEntries.delete(restored.id)
        ;(restored as any).id = entry.id
        internalEntries.set(restored.id, restored)
      }
      restored.createdAt = entry.createdAt ?? restored.createdAt
      restored.updatedAt = entry.updatedAt ?? restored.updatedAt
      restored.publishedAt = entry.publishedAt ?? null
      restored.scheduledAt = entry.scheduledAt ?? null

      const wordCount = countWords((restored.blocks as StudioBlock[] | undefined) ?? [])
      const seoCheck = this.workflowEngine.checkSEOGaps(restored)
      restored.metadata = {
        ...restored.metadata,
        seoScore: seoCheck.score,
        wordCount,
        hasAltText: true,
      }

      if (restored.status === 'scheduled' && restored.scheduledAt) {
        this.workflowEngine.scheduleAction(
          restored.id,
          'publish',
          restored.scheduledAt,
          'system',
        )
      }
    }
  }

  private registerContentType(): void {
    this.contentTypeRegistry.register({
      id: BLOG_CONTENT_TYPE_ID,
      name: 'Pulse Blog Post',
      slug: 'pulse-blog-post',
      description: 'Dogfooding article model for the Pulse website studio.',
      fields: [
        { id: 'excerpt', type: 'textarea', config: { label: 'Excerpt' } },
        { id: 'eyebrow', type: 'text', config: { label: 'Eyebrow' } },
        { id: 'author', type: 'text', config: { label: 'Author', defaultValue: 'Pulse Team' } },
        { id: 'tags', type: 'multiselect', config: { label: 'Tags' } },
        { id: 'featured', type: 'boolean', config: { label: 'Featured', defaultValue: false } },
        {
          id: 'featuredImage',
          type: 'url',
          config: { label: 'Featured image', hidden: true },
        },
        {
          id: 'featuredImageAlt',
          type: 'text',
          config: { label: 'Featured image alt', hidden: true },
        },
        { id: 'body', type: 'blocks', config: { label: 'Body' } },
      ],
    })
  }

  private getEntryBySlug(slug: string): Entry {
    const entry = this.entryManager.getBySlug(slug, BLOG_CONTENT_TYPE_ID)
    if (!entry) {
      throw new Error(`Studio entry with slug "${slug}" was not found`)
    }
    return entry
  }

  private buildMetadata(entry: Entry, updates: UpdateStudioEntryInput = {}): Entry['metadata'] {
    const title = updates.title ?? entry.title
    const excerpt = updates.excerpt ?? getFieldValue(entry, 'excerpt', '')
    const tags = updates.tags ?? getFieldValue(entry, 'tags', [] as string[])
    const blocks = updates.blocks ?? ((entry.blocks as StudioBlock[] | undefined) ?? [])
    const wordCount = countWords(blocks)
    const featuredImage = asOptionalString(getFieldValue(entry, 'featuredImage', ''))
    const ogImage = asOptionalString(entry.metadata?.ogImage) ?? featuredImage

    const metadata: Entry['metadata'] = {
      ...entry.metadata,
      seoTitle: updates.seoTitle ?? entry.metadata?.seoTitle ?? title,
      seoDescription:
        updates.seoDescription ??
        entry.metadata?.seoDescription ??
        excerpt,
      seoKeywords: tags,
      wordCount,
      hasAltText: true,
      ...(ogImage ? { ogImage } : {}),
      ...(updates.taxonomyIds ? { taxonomyIds: updates.taxonomyIds } : {}),
    }

    const candidate: Entry = {
      ...entry,
      title,
      slug: updates.slug ?? entry.slug,
      blocks,
      metadata,
    }
    metadata.seoScore = this.workflowEngine.checkSEOGaps(candidate).score

    return metadata
  }

  private buildFieldValues(entry: Entry, updates: UpdateStudioEntryInput = {}) {
    const fieldMap = new Map<string, unknown>()

    for (const fieldValue of entry.fieldValues) {
      fieldMap.set(fieldValue.fieldId, fieldValue.value)
    }

    setFieldValue(fieldMap, 'excerpt', updates.excerpt ?? getFieldValue(entry, 'excerpt', ''))
    setFieldValue(fieldMap, 'eyebrow', updates.eyebrow ?? getFieldValue(entry, 'eyebrow', 'Studio Draft'))
    setFieldValue(fieldMap, 'author', updates.author ?? getFieldValue(entry, 'author', 'Pulse Team'))
    setFieldValue(fieldMap, 'tags', updates.tags ?? getFieldValue(entry, 'tags', [] as string[]))
    setFieldValue(fieldMap, 'featured', updates.featured ?? getFieldValue(entry, 'featured', false))
    setFieldValue(fieldMap, 'featuredImage', updates.featuredImage ?? getFieldValue(entry, 'featuredImage', ''))
    setFieldValue(fieldMap, 'featuredImageAlt', updates.featuredImageAlt ?? getFieldValue(entry, 'featuredImageAlt', ''))

    return Array.from(fieldMap.entries()).map(([fieldId, value]) => ({ fieldId, value }))
  }

  createEntry(input: CreateStudioEntryInput = {}): BlogStudioEntry {
    const title = input.title?.trim() || 'Untitled Pulse Story'
    const existingSlugs = new Set(this.entryManager.list().map((entry) => entry.slug))
    const slug = uniqueSlug(title, existingSlugs)
    const blocks = createStudioStarterBlocks(title)
    const entry = this.entryManager.create(BLOG_CONTENT_TYPE_ID, {
      title,
      slug,
      status: 'draft',
      blocks,
      fieldValues: [
        {
          fieldId: 'excerpt',
          value: 'A fresh Pulse draft ready for block editing, review, and publish testing.',
        },
        { fieldId: 'eyebrow', value: 'New Draft' },
        { fieldId: 'author', value: input.author?.trim() || 'Pulse Team' },
        { fieldId: 'tags', value: ['Draft'] },
        { fieldId: 'featured', value: false },
      ],
    })

    entry.metadata = this.buildMetadata(entry, {
      excerpt: getFieldValue(entry, 'excerpt', ''),
      author: getFieldValue(entry, 'author', 'Pulse Team'),
      tags: getFieldValue(entry, 'tags', [] as string[]),
      blocks,
    })

    this.timeline.unshift(
      createTimelineEvent(entry.slug, 'created', 'Created a new studio draft.', 'author'),
    )

    return this.getEntry(entry.slug)
  }

  updateEntry(slug: string, updates: UpdateStudioEntryInput): BlogStudioEntry {
    const entry = this.getEntryBySlug(slug)
    const nextMetadata = this.buildMetadata(entry, updates)
    const updated = this.entryManager.update(entry.id, {
      title: updates.title,
      slug: updates.slug,
      blocks: updates.blocks ? cloneBlocks(updates.blocks) : undefined,
      fieldValues: this.buildFieldValues(entry, updates),
      metadata: nextMetadata,
      ...(updates.taxonomyIds !== undefined ? { taxonomyIds: updates.taxonomyIds } : {}),
    })

    this.timeline.unshift(
      createTimelineEvent(updated.slug, 'updated', 'Saved changes in the Pulse studio.', 'author'),
    )

    return this.getEntry(updated.slug)
  }

  transitionEntry(input: TransitionStudioEntryInput): {
    entry?: BlogStudioEntry
    requiresApproval: boolean
    error?: string
  } {
    const entry = this.getEntryBySlug(input.slug)
    const result = this.workflowEngine.transition(entry, input.toStatus, input.actorId, input.role)

    if (!result.success) {
      return {
        requiresApproval: Boolean(result.checkpoint),
        error: result.error,
      }
    }

    const updatedEntry = this.entryManager.update(entry.id, {
      status: result.entry?.status,
      publishedAt: result.entry?.publishedAt,
      scheduledAt: result.entry?.scheduledAt ?? null,
      metadata: this.buildMetadata(result.entry ?? entry),
    })

    this.timeline.unshift(
      createTimelineEvent(
        updatedEntry.slug,
        'status',
        `Moved article to ${updatedEntry.status}.`,
        input.actorId,
      ),
    )

    return {
      entry: this.getEntry(updatedEntry.slug),
      requiresApproval: false,
    }
  }

  scheduleEntry(input: ScheduleStudioEntryInput): {
    entry?: BlogStudioEntry
    error?: string
  } {
    const transition = this.transitionEntry({
      slug: input.slug,
      toStatus: 'scheduled',
      actorId: input.actorId,
      role: input.role,
    })

    if (!transition.entry) {
      return { error: transition.error }
    }

    const scheduledCoreEntry = this.getEntryBySlug(transition.entry.slug)
    this.workflowEngine.scheduleAction(
      scheduledCoreEntry.id,
      'publish',
      input.scheduledAt,
      input.actorId,
    )

    const updated = this.entryManager.update(scheduledCoreEntry.id, {
      scheduledAt: input.scheduledAt,
      metadata: this.buildMetadata(scheduledCoreEntry),
    })

    this.timeline.unshift(
      createTimelineEvent(
        updated.slug,
        'scheduled',
        `Scheduled publish for ${input.scheduledAt}.`,
        input.actorId,
      ),
    )

    return {
      entry: this.getEntry(updated.slug),
    }
  }

  runDueActions(currentTime: string = nowIso()): BlogStudioEntry[] {
    const results = this.workflowEngine.executeDueActions(currentTime)
    const publishedEntries: BlogStudioEntry[] = []

    for (const result of results) {
      if (!result.result.success || result.action.action !== 'publish') {
        continue
      }

      const entry = this.entryManager.get(result.action.entryId)
      if (!entry) {
        continue
      }

      const published = this.entryManager.update(entry.id, {
        status: 'published',
        publishedAt: currentTime,
        scheduledAt: null,
        metadata: this.buildMetadata(entry),
      })

      this.timeline.unshift(
        createTimelineEvent(
          published.slug,
          'automation',
          'Executed scheduled publish action.',
          'system',
        ),
      )

      publishedEntries.push(this.getEntry(published.slug))
    }

    return publishedEntries
  }

  getEntry(slug: string): BlogStudioEntry {
    const entry = this.getEntryBySlug(slug)
    const blocks = cloneBlocks((entry.blocks as StudioBlock[] | undefined) ?? [])
    const wordCount = countWords(blocks)
    const seoScore = entry.metadata?.seoScore ?? this.workflowEngine.checkSEOGaps(entry).score

    return {
      id: entry.id,
      slug: entry.slug,
      title: entry.title,
      status: entry.status,
      excerpt: getFieldValue(entry, 'excerpt', ''),
      eyebrow: getFieldValue(entry, 'eyebrow', 'Studio Draft'),
      author: getFieldValue(entry, 'author', 'Pulse Team'),
      tags: getFieldValue(entry, 'tags', [] as string[]),
      featured: getFieldValue(entry, 'featured', false),
      featuredImage: asOptionalString(getFieldValue(entry, 'featuredImage', '')),
      featuredImageAlt: asOptionalString(getFieldValue(entry, 'featuredImageAlt', '')),
      ogImage:
        asOptionalString(entry.metadata?.ogImage) ??
        asOptionalString(getFieldValue(entry, 'featuredImage', '')),
      seoTitle: entry.metadata?.seoTitle ?? entry.title,
      seoDescription: entry.metadata?.seoDescription ?? '',
      seoScore,
      wordCount,
      readTime: formatReadTime(wordCount),
      blocks,
      html: renderStudioBlocksHtml(blocks),
      publishedAt: entry.publishedAt ?? null,
      scheduledAt: entry.scheduledAt ?? null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      taxonomyIds: asStringArray(entry.taxonomyIds),
    }
  }

  listEntries(): BlogStudioListItem[] {
    return this.entryManager
      .list()
      .map((entry) => ({
        slug: entry.slug,
        title: entry.title,
        status: entry.status,
        updatedAt: entry.updatedAt,
        seoScore: entry.metadata?.seoScore ?? 0,
        wordCount: entry.metadata?.wordCount ?? 0,
      }))
  }

  getPublishedEntries(): BlogStudioEntry[] {
    return this.entryManager
      .query({
        contentTypeId: BLOG_CONTENT_TYPE_ID,
        status: 'published',
        sort: { field: 'publishedAt', direction: 'desc' },
      })
      .entries
      .map((entry) => this.getEntry(entry.slug))
  }

  async getAdminList(): Promise<BlogStudioListItem[]> {
    const list = await this.adminManager.getContentList({
      filters: { contentTypeId: BLOG_CONTENT_TYPE_ID },
      sort: { field: 'updatedAt', direction: 'desc' },
    })

    return list.items.map((item) => {
      const entry = this.getEntry(item.slug)
      return {
        slug: entry.slug,
        title: item.title,
        status: item.status,
        updatedAt: item.updatedAt,
        seoScore: item.metadata?.seoScore ?? 0,
        wordCount: item.metadata?.wordCount ?? 0,
      }
    })
  }

  getTimeline(entrySlug?: string): BlogStudioTimelineEvent[] {
    return this.timeline.filter((event) => !entrySlug || event.entrySlug === entrySlug)
  }

  toSnapshot(): BlogStudioSnapshot {
    return {
      entries: this.entryManager
        .list()
        .map((entry) => toSnapshotEntry(entry))
        .sort((left, right) => left.title.localeCompare(right.title)),
      timeline: [...this.timeline],
    }
  }
}

export function loadBlogStudioSnapshot(storage?: StorageLike): BlogStudioSnapshot {
  if (!storage) {
    return createDefaultBlogStudioSnapshot()
  }

  const raw = storage.getItem(BLOG_STUDIO_STORAGE_KEY)
  if (!raw) {
    return createDefaultBlogStudioSnapshot()
  }

  try {
    return sanitizeBlogStudioSnapshot(JSON.parse(raw))
  } catch {
    return createDefaultBlogStudioSnapshot()
  }
}

export function saveBlogStudioSnapshot(
  snapshot: BlogStudioSnapshot,
  storage?: StorageLike,
): void {
  storage?.setItem(BLOG_STUDIO_STORAGE_KEY, JSON.stringify(snapshot))
}

export function clearBlogStudioSnapshot(storage?: StorageLike): void {
  if (!storage?.removeItem) {
    return
  }

  storage.removeItem(BLOG_STUDIO_STORAGE_KEY)
}

export function getStudioEntryFromSnapshot(snapshot: BlogStudioSnapshot, slug: string) {
  return new BlogStudioWorkspace(snapshot).getEntry(slug)
}

export function getPublishedStudioEntriesFromSnapshot(snapshot: BlogStudioSnapshot) {
  return new BlogStudioWorkspace(snapshot).getPublishedEntries()
}
