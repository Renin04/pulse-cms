import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Footer from '../../components/Footer';
import BlogPostContent from '../BlogPostContent';
import { getBlogFeaturedMedia } from '../../../lib/blog-feature-media';
import { prisma } from '../../../lib/db';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

async function getPublishedEntryBySlug(slug: string) {
  try {
    const entry = await prisma.entry.findFirst({
      where: { slug, status: 'published' },
      include: { contentType: true, author: true, taxonomyLinks: { include: { term: true } } },
    });
    if (!entry) return null;

    const fieldValues = Array.isArray(entry.fieldValues) ? entry.fieldValues : [];
    const metadata = entry.metadata ? JSON.parse(entry.metadata) : {};

    const getField = (fieldId: string) => {
      const fv = fieldValues.find((item: any) => item?.fieldId === fieldId);
      return fv?.value;
    };

    return {
      slug: entry.slug,
      title: entry.title,
      excerpt: String(getField('excerpt') || ''),
      seoTitle: metadata.seoTitle || entry.title,
      seoDescription: metadata.seoDescription || String(getField('excerpt') || ''),
      publishedAt: entry.publishedAt ? new Date(entry.publishedAt).toISOString() : entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      author: entry.author?.displayName || entry.author?.email || 'Pulse Team',
      tags: entry.taxonomyLinks.map((tl) => tl.term.name),
      featuredImage: metadata.ogImage || String(getField('featuredImage') || ''),
      featuredImageAlt: String(getField('featuredImageAlt') || ''),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getPublishedEntryBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found | Pulse Blog',
      description: 'This blog post could not be found.',
    };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const publishedTime = post.publishedAt;
  const modifiedTime = post.updatedAt;
  const featuredMedia = getBlogFeaturedMedia(post as any);

  return {
    title: `${title} | Pulse Blog`,
    description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: [post.author],
      tags: post.tags,
      images: featuredMedia?.src ? [{ url: featuredMedia.src, alt: featuredMedia.alt }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: featuredMedia?.src ? [featuredMedia.src] : undefined,
    },
    alternates: {
      canonical: `/blog/${params.slug}`,
    },
  };
}

export async function generateStaticParams() {
  try {
    const entries = await prisma.entry.findMany({
      where: { status: 'published' },
      select: { slug: true },
    });
    return entries.map((entry) => ({ slug: entry.slug }));
  } catch {
    // Fallback to snapshot file if DB is unavailable during build
    try {
      const fs = await import('fs');
      const path = await import('path');
      const snapshotPath = path.join(process.cwd(), 'public', 'blog-snapshot.json');
      const raw = fs.readFileSync(snapshotPath, 'utf-8');
      const snapshot = JSON.parse(raw);
      return snapshot.entries
        .filter((entry: any) => entry.status === 'published')
        .map((entry: any) => ({ slug: entry.slug }));
    } catch {
      return [];
    }
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  if (!params.slug) {
    notFound();
  }

  return (
    <>
      <main>
        <BlogPostContent slug={params.slug} />
      </main>
      <Footer />
    </>
  );
}
