import type { Metadata } from 'next';
import DocsPage from './DocsPage';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Learn how to build with Pulse. Guides, API reference, and examples.',
  openGraph: {
    title: 'Pulse Documentation',
    description: 'Learn how to build with Pulse. Guides, API reference, and examples.',
    type: 'website',
  },
  alternates: {
    canonical: '/docs',
  },
};

export default function Page() {
  return <DocsPage />;
}
