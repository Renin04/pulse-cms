'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock3, Sparkles } from 'lucide-react'
import { useBackendBlogEntries } from '../../lib/use-backend-entries'
import { formatDisplayDate } from '../../lib/site-content'

export default function LocalStudioBlogFeed() {
  const { entries, loading } = useBackendBlogEntries()

  const publishedEntries = useMemo(() => {
    return entries.slice(0, 3)
  }, [entries])

  if (loading) {
    return (
      <section className="section-sm bg-white">
        <div className="container">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--neutral-500)]">Loading feed...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="section-sm bg-white">
      <div className="container">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="pulse-kicker mb-3">Local dogfooding feed</p>
            <h2 className="text-3xl text-[var(--pulse-black)]">Published from the Pulse studio</h2>
            <p className="mt-3 max-w-3xl text-[var(--neutral-600)]">
              The cards below hydrate from the local PM4-11 workspace, so anything you publish in the studio lands here without external services.
            </p>
          </div>
          <Link href="/studio" className="btn btn-outline px-5 py-3 text-sm">
            <Sparkles className="h-4 w-4" />
            Open Studio
          </Link>
        </div>

        {publishedEntries.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {publishedEntries.map((entry) => (
              <article key={entry.slug} className="rounded-[2rem] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[var(--pulse-red)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    {entry.eyebrow}
                  </span>
                  <span className="text-sm text-[var(--neutral-500)]">SEO {entry.seoScore}</span>
                </div>
                <h3 className="text-2xl text-[var(--pulse-black)]">{entry.title}</h3>
                <p className="mt-3 text-[var(--neutral-600)]">{entry.excerpt}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[var(--neutral-500)]">
                  <span>{formatDisplayDate(entry.publishedAt ?? entry.updatedAt)}</span>
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {entry.readTime}
                  </span>
                </div>
                <Link href={`/blog/${entry.slug}`} className="mt-6 inline-flex items-center gap-2 font-semibold text-[var(--pulse-red)] transition hover:gap-3">
                  Read post
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] p-8 text-center">
            <h3 className="text-2xl text-[var(--pulse-black)]">No locally published entries yet</h3>
            <p className="mx-auto mt-3 max-w-2xl text-[var(--neutral-600)]">
              Create a draft in the studio, submit it for review, then publish or schedule it to watch the website feed update.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
