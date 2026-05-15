import type { Metadata } from 'next';
import BlogPage from './BlogPage';
import { getPublishedBlogEntries, getFeaturedTags } from '../../lib/blog-data';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Latest articles, insights, and updates from the Pulse team.',
  openGraph: {
    title: 'Pulse Blog',
    description: 'Latest articles, insights, and updates from the Pulse team.',
    type: 'website',
  },
  alternates: {
    canonical: '/blog',
  },
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [entries, featuredTags] = await Promise.all([
    getPublishedBlogEntries(),
    getFeaturedTags(),
  ]);

  return <BlogPage initialEntries={entries} initialFeaturedTags={featuredTags} />;
}
