'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Clock3, Tag } from 'lucide-react'
import { useEntry } from '../../lib/use-api'
import { adaptEntryDetail } from '../../lib/entry-adapter'
import { formatDisplayDate } from '../../lib/site-content'

export default function StudioBlogPreview() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug') ?? ''
  const { data: apiEntry, loading } = useEntry(slug || null)

  const entry = useMemo(() => {
    if (!apiEntry) return null
    return adaptEntryDetail(apiEntry)
  }, [apiEntry])

  if (loading) {
    return (
      <section className="section bg-white">
        <div className="container">
          <div className="rounded-[2rem] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-10 text-center shadow-sm">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--neutral-500)]">Loading preview...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!slug) {
    return (
      <section className="section bg-white">
        <div className="container">
          <div className="rounded-[2rem] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-10 text-center shadow-sm">
            <h1 className="text-4xl text-[var(--pulse-black)]">Pick a local article to preview</h1>
            <p className="mt-4 text-[var(--neutral-600)]">Open the Pulse studio first, then use a preview link from a draft or published entry.</p>
            <Link href="/studio" className="btn btn-primary mt-6 px-5 py-3 text-sm">
              Open Studio
            </Link>
          </div>
        </div>
      </section>
    )
  }

  if (!entry) {
    return (
      <section className="section bg-white">
        <div className="container">
          <div className="rounded-[2rem] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-10 text-center shadow-sm">
            <h1 className="text-4xl text-[var(--pulse-black)]">Local preview not found</h1>
            <p className="mt-4 text-[var(--neutral-600)]">The studio snapshot no longer contains this slug. Create or republish it from the studio.</p>
            <Link href="/studio" className="btn btn-primary mt-6 px-5 py-3 text-sm">
              Return to Studio
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white pt-28">
      <div className="container pb-16">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--neutral-500)] transition hover:text-[var(--pulse-red)]">
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>
      </div>
      <section className="border-y border-[var(--neutral-200)] bg-gradient-hero">
        <div className="container py-16">
          <div className="mx-auto max-w-4xl">
            <p className="pulse-kicker mb-5">{entry.eyebrow}</p>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--pulse-red)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                {entry.status}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--neutral-600)]">
                Local studio preview
              </span>
            </div>
            <h1 className="text-5xl text-[var(--pulse-black)]">{entry.title}</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-[var(--neutral-600)]">{entry.excerpt}</p>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-[var(--neutral-500)]">
              <span>{entry.author}</span>
              <span>{formatDisplayDate(entry.publishedAt ?? entry.updatedAt)}</span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {entry.readTime}
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <article className="studio-rendered rounded-[2rem] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-8 shadow-sm">
              <div dangerouslySetInnerHTML={{ __html: entry.html }} />
            </article>
            <aside className="rounded-[2rem] border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--neutral-500)]">Tags</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[var(--neutral-100)] px-3 py-1.5 text-sm text-[var(--neutral-600)]">
                    <Tag className="h-3.5 w-3.5 text-[var(--pulse-red)]" />
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-8 rounded-[1.5rem] bg-[var(--pulse-black)] p-5 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--pulse-jasmine)]">Next action</p>
                <p className="mt-3 text-sm leading-6 text-white/80">
                  Return to the studio to edit blocks, adjust workflow state, or publish this entry into the local feed.
                </p>
                <Link href="/studio" className="btn btn-secondary mt-5 w-full justify-center">
                  Open Studio
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </section>
  )
}
