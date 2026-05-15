import type { Metadata } from 'next';
import BlogPage from './BlogPage';

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

export default function Page() {
  return <BlogPage />;
}
