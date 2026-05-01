import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import {
  BlogStudioWorkspace,
  BLOG_STUDIO_STORAGE_KEY,
  createDefaultBlogStudioSnapshot,
  loadBlogStudioSnapshot,
  sanitizeBlogStudioSnapshot,
} from './blog-studio'

function createStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))

  return {
    getItem(key: string) {
      return store.get(key) ?? null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    removeItem(key: string) {
      store.delete(key)
    },
  }
}

describe('BlogStudioWorkspace', () => {
  it('creates and renders a new studio draft with Pulse blocks', () => {
    const workspace = new BlogStudioWorkspace(createDefaultBlogStudioSnapshot())

    const entry = workspace.createEntry({ title: 'Studio generated article' })

    expect(entry.slug).toBe('studio-generated-article')
    expect(entry.blocks).toHaveLength(3)
    expect(entry.html).toContain('data-block-type="heading"')
    expect(entry.wordCount).toBeGreaterThan(0)
    expect(entry.readTime).toBe('1 min read')
  })

  it('moves a draft through review into published status', () => {
    const workspace = new BlogStudioWorkspace(createDefaultBlogStudioSnapshot())
    const [draft] = workspace.listEntries()

    const review = workspace.transitionEntry({
      slug: draft.slug,
      toStatus: 'review',
      actorId: 'author-1',
      role: 'author',
    })
    const published = workspace.transitionEntry({
      slug: draft.slug,
      toStatus: 'published',
      actorId: 'editor-1',
      role: 'editor',
    })

    expect(review.error).toBeUndefined()
    expect(review.entry?.status).toBe('review')
    expect(published.error).toBeUndefined()
    expect(published.entry?.status).toBe('published')
    expect(workspace.getPublishedEntries()).toHaveLength(1)
  })

  it('schedules and executes a publish action locally', () => {
    const workspace = new BlogStudioWorkspace(createDefaultBlogStudioSnapshot())
    const [draft] = workspace.listEntries()

    workspace.transitionEntry({
      slug: draft.slug,
      toStatus: 'review',
      actorId: 'author-1',
      role: 'author',
    })

    const scheduledAt = '2026-04-12T10:00:00.000Z'
    const scheduled = workspace.scheduleEntry({
      slug: draft.slug,
      scheduledAt,
      actorId: 'editor-1',
      role: 'editor',
    })

    const executed = workspace.runDueActions('2026-04-12T10:05:00.000Z')

    expect(scheduled.error).toBeUndefined()
    expect(scheduled.entry?.status).toBe('scheduled')
    expect(scheduled.entry?.scheduledAt).toBe(scheduledAt)
    expect(executed).toHaveLength(1)
    expect(executed[0].status).toBe('published')
    expect(executed[0].scheduledAt).toBeNull()
  })

  it('returns a checkpoint requirement for direct draft publishing', () => {
    const workspace = new BlogStudioWorkspace(createDefaultBlogStudioSnapshot())
    const [draft] = workspace.listEntries()

    const attempt = workspace.transitionEntry({
      slug: draft.slug,
      toStatus: 'published',
      actorId: 'editor-1',
      role: 'editor',
    })

    expect(attempt.requiresApproval).toBe(true)
    expect(attempt.entry).toBeUndefined()
    expect(attempt.error).toBe('Approval required')
  })

  it('falls back to the default workspace when persisted storage is malformed', () => {
    const storage = createStorage({
      [BLOG_STUDIO_STORAGE_KEY]: JSON.stringify({ entries: [{ slug: '', title: '' }] }),
    })

    const snapshot = loadBlogStudioSnapshot(storage)

    expect(snapshot.entries).toHaveLength(1)
    expect(snapshot.entries[0].slug).toBe('untitled-pulse-story')
    expect(snapshot.entries[0].blocks).toHaveLength(3)
    expect(snapshot.timeline).toHaveLength(1)
  })

  it('sanitizes partially valid persisted entries instead of crashing the studio', () => {
    const storage = createStorage({
      [BLOG_STUDIO_STORAGE_KEY]: JSON.stringify({
        entries: [
          {
            slug: 'kept-entry',
            title: 'Kept entry',
            status: 'published',
            excerpt: 'Recovered from storage.',
            tags: ['PM4', 123, 'Studio'],
            blocks: [
              {
                id: 'heading-1',
                type: 'heading',
                data: { text: 'Recovered heading', level: 1 },
                createdAt: '2026-04-10T10:00:00.000Z',
                updatedAt: '2026-04-10T10:00:00.000Z',
              },
              'bad-block',
            ],
          },
        ],
        timeline: [
          {
            id: 'event-1',
            entrySlug: 'kept-entry',
            type: 'status',
            message: 'Recovered publish state.',
            at: '2026-04-10T10:05:00.000Z',
            actorId: 'system',
          },
          {
            id: 'event-2',
            entrySlug: 'missing-entry',
            type: 'status',
            message: 'Should be discarded.',
            at: '2026-04-10T10:06:00.000Z',
            actorId: 'system',
          },
        ],
      }),
    })

    const snapshot = loadBlogStudioSnapshot(storage)

    expect(snapshot.entries).toHaveLength(1)
    expect(snapshot.entries[0].slug).toBe('kept-entry')
    expect(snapshot.entries[0].tags).toEqual(['PM4', 'Studio'])
    expect(snapshot.entries[0].blocks).toHaveLength(1)
    expect(snapshot.timeline).toHaveLength(1)

    const workspace = new BlogStudioWorkspace(snapshot)
    expect(workspace.getPublishedEntries()).toHaveLength(1)
    expect(workspace.getPublishedEntries()[0].title).toBe('Kept entry')
  })

  it('preserves featured image metadata from recovered entries', () => {
    const storage = createStorage({
      [BLOG_STUDIO_STORAGE_KEY]: JSON.stringify({
        entries: [
          {
            slug: 'visual-entry',
            title: 'Visual entry',
            status: 'published',
            excerpt: 'Recovered image metadata.',
            featuredImage: 'https://images.example.com/featured.jpg',
            featuredImageAlt: 'Pulse dashboard cover',
            ogImage: 'https://images.example.com/social-card.jpg',
            blocks: [
              {
                id: 'heading-1',
                type: 'heading',
                data: { text: 'Visual entry', level: 1 },
                createdAt: '2026-04-10T10:00:00.000Z',
                updatedAt: '2026-04-10T10:00:00.000Z',
              },
            ],
          },
        ],
        timeline: [],
      }),
    })

    const snapshot = loadBlogStudioSnapshot(storage)

    expect(snapshot.entries[0].featuredImage).toBe('https://images.example.com/featured.jpg')
    expect(snapshot.entries[0].featuredImageAlt).toBe('Pulse dashboard cover')
    expect(snapshot.entries[0].ogImage).toBe('https://images.example.com/social-card.jpg')

    const workspace = new BlogStudioWorkspace(snapshot)
    const [entry] = workspace.getPublishedEntries()

    expect(entry.featuredImage).toBe('https://images.example.com/featured.jpg')
    expect(entry.featuredImageAlt).toBe('Pulse dashboard cover')
    expect(entry.ogImage).toBe('https://images.example.com/social-card.jpg')
  })

  it('maps legacy quote blocks to blockquote blocks during snapshot recovery', () => {
    const storage = createStorage({
      [BLOG_STUDIO_STORAGE_KEY]: JSON.stringify({
        entries: [
          {
            slug: 'legacy-quote-entry',
            title: 'Legacy quote entry',
            status: 'published',
            excerpt: 'Recovered quote content.',
            blocks: [
              {
                id: 'quote-1',
                type: 'quote',
                data: {
                  text: 'Legacy quote text.',
                  author: 'Pulse Team',
                },
                createdAt: '2026-04-10T10:00:00.000Z',
                updatedAt: '2026-04-10T10:00:00.000Z',
              },
            ],
          },
        ],
        timeline: [],
      }),
    })

    const snapshot = loadBlogStudioSnapshot(storage)

    expect(snapshot.entries[0].blocks).toHaveLength(1)
    expect(snapshot.entries[0].blocks[0].type).toBe('blockquote')

    const workspace = new BlogStudioWorkspace(snapshot)
    const [entry] = workspace.getPublishedEntries()
    expect(entry.html).toContain('data-block-type="blockquote"')
    expect(entry.html).toContain('Legacy quote text.')
    expect(entry.html).toContain('Pulse Team')
  })

  it('renders every published entry from the public snapshot without schema crashes', () => {
    const rawSnapshot = JSON.parse(
      readFileSync('/mnt/c/Users/z0512/Desktop/pulse/apps/website/public/blog-snapshot.json', 'utf8'),
    )
    const snapshot = sanitizeBlogStudioSnapshot(rawSnapshot)
    const workspace = new BlogStudioWorkspace(snapshot)

    const entries = workspace.getPublishedEntries()

    expect(entries).toHaveLength(11)
    expect(entries.every((entry) => entry.html.length > 0)).toBe(true)
  })
})
