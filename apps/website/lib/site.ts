/**
 * Site configuration for SEO and canonical URLs.
 */
export const SITE_NAME = 'Pulse';
export const SITE_TAGLINE = 'The Blog Engine That Comes Alive';
export const SITE_DESCRIPTION =
  'Pulse is a modular, AI-powered, interactive blog engine built for creators who want more than static pages.';

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Use localhost in development to avoid HTTPS metadata issues
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  return 'https://pulse.studio';
}

export function canonical(path: string): string {
  const base = getSiteUrl();
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`.replace(/\/$/, '') || base;
}
