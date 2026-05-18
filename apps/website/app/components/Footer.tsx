'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Github, Mail, Twitter, ChevronDown } from 'lucide-react';
import BrandMark from './BrandMark';

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Demo', href: '/demo' },
      { label: 'Examples', href: '/examples' },
      { label: 'Studio', href: '/studio' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/docs/api/core' },
      { label: 'Testing', href: '/docs/testing' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Vision', href: 'https://github.com/pulse-studio/pulse#readme' },
      { label: 'Issues', href: 'https://github.com/pulse-studio/pulse/issues' },
      { label: 'Email', href: 'mailto:hello@pulse.studio' },
      { label: 'GitHub', href: 'https://github.com/pulse-studio/pulse' },
    ],
  },
] as const;

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/pulse-studio/pulse', icon: Github },
  { label: 'Twitter', href: 'https://twitter.com/pulsestudio', icon: Twitter },
  { label: 'Email', href: 'mailto:hello@pulse.studio', icon: Mail },
];

const stackBadges = ['Next.js', 'Nuxt', 'Astro', 'React', 'Vue'];

function isExternalLink(href: string) {
  return href.startsWith('http') || href.startsWith('mailto:');
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className =
    'text-sm text-white/60 transition-colors duration-200 hover:text-[var(--pulse-jasmine)]';
  if (isExternalLink(href)) {
    return (
      <a
        href={href}
        className={className}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function FooterColumn({ column }: { column: (typeof footerColumns)[number] }) {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="border-b border-white/10 sm:border-none">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--pulse-jasmine)] sm:hidden"
      >
        {column.title}
        <ChevronDown
          className={`h-4 w-4 text-white/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <h3 className="mb-3 hidden text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--pulse-jasmine)] sm:block">
        {column.title}
      </h3>
      <ul
        className={`space-y-3 overflow-hidden sm:max-h-none ${
          open ? 'max-h-60 pb-4' : 'max-h-0 sm:pb-0'
        } ${hydrated ? 'transition-all duration-200' : ''}`}
      >
        {column.links.map((link) => (
          <li key={link.href}>
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-[#0d0d0e] text-white">
      {/* Top section */}
      <div className="container py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-12">
          {/* Brand panel */}
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <BrandMark variant="wordmark" className="mb-5" imageClassName="w-[10rem] sm:w-[12rem]" />
            <p className="max-w-md text-[1rem] leading-7 text-white/60 sm:text-[1.05rem]">
              Pulse helps teams build{' '}
              <span className="text-white/90">interactive publishing systems</span>{' '}
              that stay clear from editor to renderer.
            </p>

            {/* Stack badges */}
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              {stackBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/60"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  aria-label={item.label}
                >
                  <item.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns — accordion on mobile, grid on desktop */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-6">
            {footerColumns.map((column) => (
              <FooterColumn key={column.title} column={column} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center gap-3 py-5 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Pulse Studio. All rights reserved.
          </p>
          <div className="hidden sm:flex items-center gap-5">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-2 text-xs text-white/60 transition-colors hover:text-white"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
