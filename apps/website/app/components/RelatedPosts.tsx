'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { getBlogFeaturedMedia } from '../../lib/blog-feature-media';
import { formatDisplayDate } from '../../lib/site-content';
import { useBackendBlogEntries } from '../../lib/use-backend-entries';

interface RelatedPostsProps {
  currentSlug: string;
  currentTags: string[];
}

export default function RelatedPosts({ currentSlug, currentTags }: RelatedPostsProps) {
  const { entries: publishedEntries, loading } = useBackendBlogEntries();

  const relatedPosts = useMemo(() => {
    return publishedEntries
      .filter((post) => post.slug !== currentSlug)
      .map((post) => {
        const sharedTags = post.tags.filter((tag) => currentTags.includes(tag));
        return {
          ...post,
          relevanceScore: sharedTags.length,
          sharedTags,
        };
      })
      .filter((post) => post.relevanceScore > 0)
      .sort((left, right) => right.relevanceScore - left.relevanceScore)
      .slice(0, 3);
  }, [currentSlug, currentTags, publishedEntries]);

  if (loading) {
    return (
      <section className="border-t border-[var(--neutral-200)] bg-[var(--neutral-50)] py-16">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-2 h-8 w-48 animate-pulse rounded bg-[var(--neutral-200)]" />
              <div className="mx-auto h-4 w-64 animate-pulse rounded bg-[var(--neutral-200)]" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[320px] animate-pulse rounded-xl bg-[var(--neutral-200)]" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (relatedPosts.length === 0) return null;

  return (
    <section id="blog-related-posts" className="border-t border-[var(--neutral-200)] bg-[var(--neutral-50)] py-16">
      <div className="container">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[var(--pulse-black)] sm:text-3xl">
              Related Articles
            </h2>
            <p className="mt-2 text-[var(--neutral-600)]">
              Continue exploring similar topics
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((post) => {
              const featuredMedia = getBlogFeaturedMedia(post);

              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="blog-related-card group flex flex-col overflow-hidden rounded-xl border border-[var(--neutral-200)] bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--pulse-red)]/40 hover:shadow-lg"
                >
                  {/* Header with gradient */}
                  <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-[var(--pulse-jasmine)]/20 to-[var(--pulse-red)]/10">
                    {featuredMedia ? (
                      <img
                        src={featuredMedia.src}
                        alt={featuredMedia.alt}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-4xl font-extrabold text-[var(--pulse-black)] opacity-10 transition-all group-hover:scale-110">
                        {post.title.charAt(0)}
                      </span>
                    )}
                    {/* Shared tags indicator */}
                    <div className="absolute right-3 top-3 rounded-full bg-[var(--pulse-red)] px-2 py-1 text-xs font-bold text-white">
                      {post.sharedTags.length} shared {post.sharedTags.length === 1 ? 'tag' : 'tags'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <span className="mb-2 inline-block w-fit rounded-full bg-[var(--pulse-red)]/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--pulse-red)]">
                      {post.eyebrow}
                    </span>

                    <h3 className="blog-related-title mb-3 line-clamp-2 text-lg font-bold leading-tight text-[var(--pulse-black)] transition-colors group-hover:text-[var(--pulse-red)]">
                      {post.title}
                    </h3>

                    <p className="blog-related-excerpt mb-4 line-clamp-2 text-sm leading-relaxed text-[var(--neutral-600)]">
                      {post.excerpt}
                    </p>

                    {/* Metadata */}
                    <div className="blog-related-meta mt-auto flex items-center justify-between border-t border-[var(--neutral-200)] pt-3 text-xs text-[var(--neutral-500)]">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDisplayDate(post.publishedAt ?? post.updatedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readTime}
                      </div>
                    </div>

                    {/* Read more indicator */}
                    <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--pulse-red)] transition-all group-hover:gap-3">
                      Read more
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
