import type { Metadata } from 'next';
import DemoPage from './DemoPage';

export const metadata: Metadata = {
  title: 'Demo',
  description: 'Try the Pulse block editor and see interactive content in action.',
  openGraph: {
    title: 'Pulse Demo',
    description: 'Try the Pulse block editor and see interactive content in action.',
    type: 'website',
  },
  alternates: {
    canonical: '/demo',
  },
};

export default function Page() {
  return <DemoPage />;
}
