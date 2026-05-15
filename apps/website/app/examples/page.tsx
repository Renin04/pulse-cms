import type { Metadata } from 'next';
import ExamplesPage from './ExamplesPage';

export const metadata: Metadata = {
  title: 'Examples',
  description: 'Reference experiences and example projects built with Pulse.',
  openGraph: {
    title: 'Pulse Examples',
    description: 'Reference experiences and example projects built with Pulse.',
    type: 'website',
  },
  alternates: {
    canonical: '/examples',
  },
};

export default function Page() {
  return <ExamplesPage />;
}
