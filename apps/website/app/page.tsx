import type { Metadata } from 'next';
import HomePage from './HomePage';

export const metadata: Metadata = {
  title: 'Pulse — The Blog Engine That Comes Alive',
  description:
    'Pulse is a modular, AI-powered, interactive blog engine built for creators who want more than static pages.',
  openGraph: {
    title: 'Pulse — The Blog Engine That Comes Alive',
    description: 'A modular, AI-powered, interactive blog engine.',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
};

export default function Page() {
  return <HomePage />;
}
