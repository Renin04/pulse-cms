'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, Sparkles, FileText, Tag, Mail, TrendingUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

function makeExcerpt(post: any, fallbackLength = 160): string {
  if (post.excerpt && post.excerpt.trim() && post.excerpt !== post.title) return post.excerpt;
  // Try to extract text from HTML
  if (post.html) {
    const plain = post.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain.length > 10) return plain.slice(0, fallbackLength) + (plain.length > fallbackLength ? '…' : '');
  }
  return 'Read the full article to learn more.';
}
import Footer from '../components/Footer';
import { getBlogFeaturedMedia } from '../../lib/blog-feature-media';
import { formatDisplayDate } from '../../lib/site-content';
import { useBackendBlogEntries, useBackendFeaturedTags, useAllBackendTags } from '../../lib/use-backend-entries';
import BlogSearch from '../components/BlogSearch';
import TagFilter from '../components/TagFilter';

function getTagFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('tag');
}

export default function BlogPage() {
  const { entries: publishedEntries, loading } = useBackendBlogEntries();
  const { tags: featuredTags, loading: _tagsLoading } = useBackendFeaturedTags();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    // Check for tag query parameter from URL
    const tagParam = getTagFromUrl();
    if (tagParam) {
      setSelectedTags([tagParam]);
    }
  }, []);

  // Listen for URL changes (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const tagParam = getTagFromUrl();
      if (tagParam && !selectedTags.includes(tagParam)) {
        setSelectedTags([tagParam]);
      } else if (!tagParam && selectedTags.length > 0) {
        setSelectedTags([]);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedTags]);

  // Get all unique tags
  const allAvailableTags = useAllBackendTags(publishedEntries);

  const allTags = useMemo(() => {
    if (featuredTags && featuredTags.length > 0) {
      return featuredTags.filter((tag: string) => allAvailableTags.includes(tag));
    }
    return allAvailableTags;
  }, [featuredTags, allAvailableTags]);

  // Filter posts based on search and tags
  const filteredEntries = useMemo(() => {
    let filtered = publishedEntries;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.title.toLowerCase().includes(query) ||
          entry.excerpt.toLowerCase().includes(query) ||
          entry.author.toLowerCase().includes(query) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((entry) =>
        selectedTags.some((tag) => entry.tags.includes(tag))
      );
    }

    return filtered;
  }, [publishedEntries, searchQuery, selectedTags]);

  // Auto-feature the most recent post when none is explicitly featured (and no filters active)
  let featuredPost = filteredEntries.find((p) => p.featured);
  let regularPosts = filteredEntries.filter((p) => !p.featured);
  
  if (!featuredPost && !searchQuery && selectedTags.length === 0 && regularPosts.length > 0) {
    // Sort by published date (newest first) and pick the first
    const sorted = [...regularPosts].sort((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.updatedAt).getTime();
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.updatedAt).getTime();
      return bDate - aDate;
    });
    featuredPost = sorted[0];
    regularPosts = regularPosts.filter((p) => p.id !== featuredPost!.id);
  }
  const featuredPostMedia = featuredPost ? getBlogFeaturedMedia(featuredPost) : null;

  const [sortBy, setSortBy] = useState<'publishedAt' | 'title'>('publishedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const postsPerPage = 9;

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  }, []);

  // Sort and paginate filtered entries
  const sortedEntries = useMemo(() => {
    const sorted = [...filteredEntries];
    sorted.sort((a, b) => {
      if (sortBy === 'title') {
        return sortOrder === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      // publishedAt
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.updatedAt).getTime();
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.updatedAt).getTime();
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });
    return sorted;
  }, [filteredEntries, sortBy, sortOrder]);

  const totalPages = Math.ceil(sortedEntries.length / postsPerPage);
  const paginatedEntries = sortedEntries.slice((page - 1) * postsPerPage, page * postsPerPage);

  return (
    <>


      {/* ─── Hero + Search + Filter Combined ─── */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#151516_0%,#0d0d0e_100%)] pt-28 pb-12 sm:pt-32 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute left-[5%] top-[10%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-red)] blur-[140px]" />
          <div className="absolute right-[10%] top-[20%] h-[300px] w-[300px] rounded-full bg-[var(--pulse-jasmine)] blur-[120px]" />
        </div>

        <div className="container relative">
          {/* Title */}
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--pulse-jasmine)] backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Pulse Blog
            </span>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              The rebellion continues
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Building, breaking, and reimagining what content can be.
            </p>
          </div>
          
          {/* Search and Filter - Combined in same dark section */}
          {!loading && publishedEntries.length > 0 && (
            <div className="mx-auto mt-12 max-w-4xl space-y-6">
              <BlogSearch onSearch={setSearchQuery} />
              <TagFilter
                tags={allTags}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                onClearAll={() => setSelectedTags([])}
              />
              {(searchQuery || selectedTags.length > 0) && (
                <p className="text-center text-sm text-white/60">
                  Found {filteredEntries.length} {filteredEntries.length === 1 ? 'article' : 'articles'}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
      {!loading && publishedEntries.length === 0 && (
        <section className="bg-white py-20 sm:py-28">
          <div className="container">
            <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <FileText className="h-6 w-6 text-[var(--neutral-400)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--pulse-black)]">No posts yet</h2>
              <p className="mt-2 text-[var(--neutral-600)]">
                New articles will appear here as soon as they are published.
              </p>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-between">
                <p className="text-xs text-[var(--neutral-600)]">
                  Page <span className="font-medium text-[var(--pulse-black)]">{page}</span> of{' '}
                  <span className="font-medium text-[var(--pulse-black)]">{totalPages}</span>
                  <span className="ml-1 text-[var(--neutral-400)]">({sortedEntries.length} total)</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-xs font-medium text-[var(--pulse-black)] transition-colors hover:bg-[var(--neutral-50)] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-xs font-medium text-[var(--pulse-black)] transition-colors hover:bg-[var(--neutral-50)] disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── No results state ─── */}
      {publishedEntries.length > 0 && filteredEntries.length === 0 && (
        <section className="bg-white py-20 sm:py-28">
          <div className="container">
            <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <FileText className="h-6 w-6 text-[var(--neutral-400)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--pulse-black)]">No articles found</h2>
              <p className="mt-2 text-[var(--neutral-600)]">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ─── Featured post ─── */}
      {loading ? (
        <section className="bg-white py-12 sm:py-16">
          <div className="container">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-[var(--pulse-red)]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--pulse-red)]">
                Featured story
              </span>
            </div>
            <div className="grid overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white lg:grid-cols-2">
              <div className="relative min-h-[260px] animate-pulse bg-[var(--neutral-200)] sm:min-h-[320px]" />
              <div className="flex flex-col justify-center p-6 sm:p-10">
                <div className="mb-4 h-4 w-32 animate-pulse rounded bg-[var(--neutral-200)]" />
                <div className="mb-4 h-8 w-3/4 animate-pulse rounded bg-[var(--neutral-200)]" />
                <div className="mb-2 h-4 w-full animate-pulse rounded bg-[var(--neutral-200)]" />
                <div className="mb-8 h-4 w-5/6 animate-pulse rounded bg-[var(--neutral-200)]" />
                <div className="mt-auto h-4 w-24 animate-pulse rounded bg-[var(--neutral-200)]" />
              </div>
            </div>
          </div>
        </section>
      ) : featuredPost ? (
        <section className="bg-white py-12 sm:py-16">
          <div className="container">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-[var(--pulse-red)]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--pulse-red)]">
                Featured story
              </span>
            </div>

            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group grid overflow-hidden rounded-2xl border border-[var(--neutral-200)] bg-white transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.01] hover:border-[var(--pulse-red)] lg:grid-cols-2"
            >
              {/* Visual */}
              <div className="relative min-h-[260px] overflow-hidden bg-gradient-to-br from-[var(--pulse-red)] to-[var(--pulse-jasmine)] sm:min-h-[320px]">
                {featuredPostMedia ? (
                  <img
                    src={featuredPostMedia.src}
                    alt={featuredPostMedia.alt}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-7xl font-extrabold text-white/30 sm:text-8xl">
                      {featuredPost.title.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--pulse-red)] shadow-sm">
                    Featured
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col justify-center p-6 sm:p-10">
                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-[var(--neutral-500)]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDisplayDate(featuredPost.publishedAt ?? featuredPost.updatedAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {featuredPost.readTime}
                  </div>
                </div>

                <h2 className="mb-4 text-2xl font-bold text-[var(--pulse-black)] transition-colors group-hover:text-[var(--pulse-red)] sm:text-3xl lg:text-4xl">
                  {featuredPost.title}
                </h2>

                <p className="mb-8 max-w-lg leading-relaxed text-[var(--neutral-600)]">
                  {makeExcerpt(featuredPost)}
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--neutral-700)]">
                    By {featuredPost.author}
                  </span>
                  <span className="flex items-center gap-2 font-semibold text-[var(--pulse-red)] transition-all group-hover:gap-3">
                    Read article
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      {/* ─── All posts ─── */}
      {loading ? (
        <section className="border-t border-[var(--neutral-200)] bg-[var(--neutral-50)] py-12 sm:py-16">
          <div className="container">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[var(--pulse-red)]" />
                <div className="h-7 w-40 animate-pulse rounded bg-[var(--neutral-200)]" />
              </div>
              <div className="h-8 w-24 animate-pulse rounded bg-[var(--neutral-200)]" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-[380px] animate-pulse rounded-xl bg-[var(--neutral-200)]" />
              ))}
            </div>
          </div>
        </section>
      ) : regularPosts.length > 0 ? (
        <section className="border-t border-[var(--neutral-200)] bg-[var(--neutral-50)] py-12 sm:py-16">
          <div className="container">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[var(--pulse-red)]" />
                <h2 className="text-xl font-bold text-[var(--pulse-black)] sm:text-2xl">
                  Latest posts
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [by, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                      setSortBy(by);
                      setSortOrder(order);
                      setPage(1);
                    }}
                    className="appearance-none rounded-lg border border-[var(--neutral-200)] bg-white py-2 pl-3 pr-8 text-sm text-[var(--pulse-black)] outline-none transition-colors focus:border-[var(--pulse-red)]"
                  >
                    <option value="publishedAt-desc">Newest first</option>
                    <option value="publishedAt-asc">Oldest first</option>
                    <option value="title-asc">Title A–Z</option>
                    <option value="title-desc">Title Z–A</option>
                  </select>
                  <ArrowUpDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--neutral-400)] pointer-events-none" />
                </div>
                <p className="text-sm text-[var(--neutral-500)]">
                  {regularPosts.length} article{regularPosts.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedEntries.map((post) => {
                const featuredMedia = getBlogFeaturedMedia(post);

                return (
                  <article
                    key={post.slug}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--neutral-200)] bg-white transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:scale-[1.02] hover:border-[var(--pulse-red)]"
                  >
                    {/* Animated gradient glow on hover */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--pulse-red)]/8 via-transparent to-[var(--pulse-jasmine)]/8" />
                    </div>
                    
                    <Link href={`/blog/${post.slug}`} className="block">
                      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[var(--pulse-jasmine)] to-[#ffe4a1]">
                        {featuredMedia ? (
                          <img
                            src={featuredMedia.src}
                            alt={featuredMedia.alt}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center transition-all duration-700 ease-out group-hover:scale-110">
                            <span className="text-5xl font-extrabold text-[var(--pulse-black)] opacity-20 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125 group-hover:rotate-6 group-hover:opacity-40">
                              {post.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-block rounded-full bg-[var(--pulse-red)]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-red)]">
                          {post.eyebrow}
                        </span>
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--neutral-200)] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-600)] transition-colors group-hover:border-[var(--pulse-red)]/30"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Link href={`/blog/${post.slug}`} className="block">
                        <h3 className="mb-3 line-clamp-2 text-lg font-bold leading-tight text-[var(--pulse-black)] transition-colors group-hover:text-[var(--pulse-red)] sm:text-xl">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-[var(--neutral-600)]">
                        {makeExcerpt(post)}
                      </p>

                      <div className="mt-auto flex items-center justify-between border-t border-[var(--neutral-200)] pt-4 text-xs text-[var(--neutral-500)]">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDisplayDate(post.publishedAt ?? post.updatedAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2 text-xs text-[var(--neutral-600)]">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--pulse-red)]/10 font-semibold text-[var(--pulse-red)]">
                          {post.author.charAt(0)}
                        </div>
                        <span>{post.author}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── Newsletter CTA ─── */}
      <section className="border-t border-[var(--neutral-200)] bg-white py-16 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--pulse-red)]/10">
              <Mail className="h-6 w-6 text-[var(--pulse-red)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--pulse-black)] sm:text-3xl">
              Stay in the loop
            </h2>
            <p className="mt-3 text-[var(--neutral-600)]">
              Get the latest articles, updates, and insights delivered to your inbox.
            </p>
            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"
              onSubmit={(e) => {
                e.preventDefault();
                alert('Thanks for subscribing! This is a demo.');
              }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="w-full rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-5 py-3 text-sm text-[var(--pulse-black)] outline-none transition-colors focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/10 sm:w-80"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--pulse-red)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--pulse-red)]/90 hover:shadow-lg hover:shadow-[var(--pulse-red)]/20"
              >
                <TrendingUp className="h-4 w-4" />
                Subscribe
              </button>
            </form>
            <p className="mt-3 text-xs text-[var(--neutral-400)]">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
