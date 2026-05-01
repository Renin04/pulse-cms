import localFont from 'next/font/local';
import type { Metadata } from 'next';
import './globals.css';
import SmartNavigationWrapper from './components/SmartNavigationWrapper';
import Navigation from './components/Navigation';

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

export const metadata: Metadata = {
  title: 'Pulse — The Blog Engine That Comes Alive',
  description: 'Pulse is a modular, AI-powered, interactive blog engine built for creators who want more than static pages.',
  keywords: ['blog', 'cms', 'editor', 'ai', 'content management', 'publishing'],
  authors: [{ name: 'Pulse Studio' }],
  openGraph: {
    title: 'Pulse — The Blog Engine That Comes Alive',
    description: 'A modular, AI-powered, interactive blog engine.',
    type: 'website',
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
        <SmartNavigationWrapper>
          <Navigation />
        </SmartNavigationWrapper>
        {children}
      </body>
    </html>
  );
}
