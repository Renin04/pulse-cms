'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock3, Tag, User } from 'lucide-react';
import { getBlogFeaturedMedia } from '../../lib/blog-feature-media';
import { formatDisplayDate } from '../../lib/site-content';
import { useBackendBlogEntry } from '../../lib/use-backend-entries';
import type { AdaptedBlogEntry } from '../../lib/entry-adapter';

import SpotlightCard from '../components/SpotlightCard';
import ReadingProgress from '../components/ReadingProgress';
import TableOfContents from '../components/TableOfContents';
import ShareButtons from '../components/ShareButtons';
import ReadingModeControls from '../components/ReadingModeControls';
import RelatedPosts from '../components/RelatedPosts';

export default function BlogPostContent({
  slug,
  entry: serverEntry,
}: {
  slug?: string;
  entry?: AdaptedBlogEntry | null;
}) {
  const { entry: clientEntry, loading } = useBackendBlogEntry(slug ?? null);

  const entry = serverEntry ?? clientEntry;

  const featuredMedia = useMemo(() => (entry ? getBlogFeaturedMedia(entry as unknown as any) : null), [entry]);

  if (!serverEntry && loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center bg-[#f8f6f2]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--pulse-red)]" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] pt-28">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-[var(--neutral-300)] bg-white/60 p-10 text-center backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-[var(--pulse-black)]">Post not found</h1>
            <p className="mt-2 text-[var(--neutral-600)]">
              This post hasn&apos;t been published yet or doesn&apos;t exist.
            </p>
            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--pulse-black)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--pulse-red)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="blog-post-page" className="min-h-screen bg-[#f8f6f2]">
      <ReadingProgress />
      <ReadingModeControls />

      {/* Hero header */}
      <section id="blog-post-header" className="relative overflow-hidden border-b border-black/5 pt-28 pb-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[10%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-red)]/5 blur-[120px]" />
        </div>

        <div className="container relative">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <Link
                id="blog-back-link"
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--neutral-200)] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--neutral-600)] shadow-[0_12px_35px_-28px_rgba(17,24,39,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--pulse-red)]/35 hover:text-[var(--pulse-red)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to blog
              </Link>

              <div id="blog-eyebrow-chip" className="flex items-center gap-2 rounded-full border border-[var(--pulse-red)]/12 bg-[var(--pulse-red)]/8 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--pulse-red)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pulse-red)]">
                  {entry.eyebrow || 'Pulse Story'}
                </span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-[var(--pulse-black)] sm:text-4xl lg:text-5xl">
              {entry.title}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--neutral-600)]">
              {entry.excerpt}
            </p>

            <div id="blog-meta-row" className="mt-8 flex flex-wrap items-center gap-5 text-sm text-[var(--neutral-500)]">
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4" />
                {entry.author}
              </span>
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDisplayDate(entry.publishedAt ?? entry.updatedAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {entry.readTime}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-4 sm:pb-6">
        <div className="container">
          <div className="mx-auto max-w-[92rem]">
            {featuredMedia ? (
              <figure id="blog-feature-media" className="overflow-hidden rounded-[2rem]">
                <img
                  src={featuredMedia.src}
                  alt={featuredMedia.alt}
                  width={1200}
                  height={496}
                  loading="eager"
                  decoding="async"
                  className="h-[18rem] w-full object-cover sm:h-[24rem] lg:h-[31rem]"
                />
              </figure>
            ) : (
              <div
                id="blog-feature-media-fallback"
                className="relative overflow-hidden rounded-[2rem] px-8 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-20"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,40,0,0.96),rgba(255,83,51,0.92)_42%,rgba(255,230,149,0.84))]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_36%)]" />
                <div className="relative flex min-h-[12rem] flex-col justify-between gap-8 text-white">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/82">
                      {entry.eyebrow || 'Pulse Story'}
                    </span>
                    <span className="rounded-full border border-white/16 bg-black/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/72">
                      {entry.readTime}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-6">
                    <div className="max-w-3xl">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                        Featured visual
                      </p>
                      <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                        {entry.title}
                      </h2>
                    </div>
                    <span className="hidden text-7xl font-black leading-none text-white/18 sm:block lg:text-[7.5rem]">
                      {entry.title.charAt(0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="container">
          <div id="blog-content-shell" className="mx-auto max-w-[88rem]">
            <div id="blog-content-wrapper" className="grid gap-8 lg:gap-10">
              <aside id="blog-toc-sidebar" className="min-w-0">
                <div id="blog-toc-rail" className="sticky top-[7rem] space-y-4 self-start">
                  <TableOfContents />
                </div>
              </aside>

              <div id="blog-article-column" className="min-w-0 flex-1">
                <div id="blog-content-card" className="py-0">
                  <div id="blog-article-body">
                    <article className="studio-rendered prose prose-lg max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: entry.html }} />
                    </article>
                  </div>
                </div>
              </div>

              <aside id="blog-sidebar" className="min-w-0">
                <div id="blog-sidebar-rail" className="space-y-4">
                  <ShareButtons title={entry.title} url={`/blog/${entry.slug}`} />
                  
                  <SpotlightCard
                    id="blog-tags-card"
                    className="blog-sidebar-surface rounded-[1.75rem] p-5"
                    spotlightColor="rgba(255, 40, 0, 0.06)"
                  >
                    <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--neutral-500)]">
                      Tags
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/blog?tag=${encodeURIComponent(tag)}`}
                          className="inline-flex items-center gap-1 rounded-full border border-black/8 bg-white/80 px-3 py-1.5 text-sm text-[var(--neutral-600)] transition-colors hover:border-[var(--pulse-red)]/30 hover:bg-[var(--pulse-red)]/6 hover:text-[var(--pulse-red)]"
                        >
                          <Tag className="h-3.5 w-3.5 text-[var(--pulse-red)]" />
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </SpotlightCard>

                  <div id="blog-written-card" className="blog-sidebar-surface rounded-[1.75rem] p-5">
                    <p id="blog-written-label" className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--pulse-red)]">
                      Written in Pulse
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--neutral-600)]">
                      This post was authored using the Pulse block editor and published from the admin studio.
                    </p>
                    <Link
                      href="/demo"
                      className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[var(--pulse-jasmine)] px-4 py-2.5 text-sm font-semibold text-[var(--pulse-black)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--pulse-red)] hover:!text-white"
                    >
                      Try the editor
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <RelatedPosts currentSlug={entry.slug} currentTags={entry.tags} />
    </div>
  );
}
