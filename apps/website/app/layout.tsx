import localFont from 'next/font/local';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import SmartNavigationWrapper from './components/SmartNavigationWrapper';
import Navigation from './components/Navigation';
import { getSiteUrl } from '../lib/site';

const codecPro = localFont({
  src: [
    {
      path: './fonts/codec-pro/Codec-Pro-Light-trial.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/codec-pro/Codec-Pro-News-trial.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/codec-pro/Codec-Pro-Bold-trial.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-codec-pro',
  display: 'swap',
});

const bahnschrift = localFont({
  src: './fonts/bahnschrift/bahnschrift.ttf',
  variable: '--font-bahnschrift',
  display: 'swap',
});

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  themeColor: '#FF2800',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Pulse — The Blog Engine That Comes Alive',
    template: '%s | Pulse',
  },
  description: 'Pulse is a modular, AI-powered, interactive blog engine built for creators who want more than static pages.',
  keywords: ['blog', 'cms', 'editor', 'ai', 'content management', 'publishing'],
  authors: [{ name: 'Pulse Studio' }],
  creator: 'Pulse Studio',
  publisher: 'Pulse Studio',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Pulse — The Blog Engine That Comes Alive',
    description: 'A modular, AI-powered, interactive blog engine.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Pulse',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pulse — The Blog Engine That Comes Alive',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulse — The Blog Engine That Comes Alive',
    description: 'A modular, AI-powered, interactive blog engine.',
    images: ['/og-image.png'],
    creator: '@pulsestudio',
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${codecPro.className} ${codecPro.variable} ${bahnschrift.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-[var(--pulse-red)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <SmartNavigationWrapper>
          <Navigation />
        </SmartNavigationWrapper>
        {children}
      </body>
    </html>
  );
}
