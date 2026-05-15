import type { Metadata } from 'next';
import FeaturesPage from './FeaturesPage';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Explore the features that make Pulse the most powerful interactive blog engine.',
  openGraph: {
    title: 'Pulse Features',
    description: 'Explore the features that make Pulse the most powerful interactive blog engine.',
    type: 'website',
  },
  alternates: {
    canonical: '/features',
  },
};

export default function Page() {
  return <FeaturesPage />;
}
