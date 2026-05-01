'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Sparkles, Menu, X } from 'lucide-react';
import BrandMark from './BrandMark';
import GlassIconButton from './GlassIconButton';
import BorderGlow from './BorderGlow';
import PulseStarButton from './PulseStarButton';

const navLinks = [
  { href: '/features', label: 'Features' },
  { href: '/demo', label: 'Demo' },
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isLinkActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <>
      {/* DESKTOP HEADER — glassmorphism pill */}
      <header className="fixed inset-x-0 top-0 z-[var(--z-fixed)] hidden px-5 pt-5 lg:block">
        <div className="container">
          <nav className="relative flex min-h-[4.85rem] items-center justify-between overflow-hidden rounded-[28px] border border-white/70 bg-white/80 px-5 py-3 shadow-[0_20px_55px_-35px_rgba(17,24,39,0.42)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/72">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 -top-16 h-28 rounded-full bg-[radial-gradient(circle,rgba(255,40,0,0.2),transparent_68%)] blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-[linear-gradient(135deg,transparent,rgba(255,230,149,0.3))]"
            />

            <BrandMark
              variant="wordmark"
              priority
              className="relative z-10 ml-3 mr-6 shrink-0"
              imageClassName="w-[5.15rem]"
            />

            <div className="flex items-center gap-1 rounded-full border border-[var(--neutral-200)]/80 bg-[rgba(250,250,250,0.9)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isLinkActive(link.href) ? 'page' : undefined}
                  className={cx(
                    'group relative overflow-hidden rounded-full px-4 py-2.5 text-sm font-semibold tracking-[0.01em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    isLinkActive(link.href)
                      ? 'bg-[var(--pulse-black)] text-white shadow-[0_14px_26px_-18px_rgba(17,24,39,0.7)]'
                      : 'text-[var(--neutral-600)] hover:-translate-y-0.5 hover:bg-white hover:text-[var(--pulse-black)]',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      'absolute inset-0 opacity-0 transition-opacity duration-300',
                      isLinkActive(link.href)
                        ? 'opacity-100 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_60%)]'
                        : 'group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(255,40,0,0.14),transparent_60%)]',
                    )}
                  />
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <span
                      className={cx(
                        'h-1.5 w-1.5 rounded-full transition-colors duration-300',
                        isLinkActive(link.href)
                          ? 'bg-[var(--pulse-jasmine)]'
                          : 'bg-[var(--pulse-red)]/70 group-hover:bg-[var(--pulse-red)]',
                      )}
                    />
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <GlassIconButton
                href="https://github.com/pulse-studio/pulse"
                icon={<Github className="h-5 w-5" />}
                label="GitHub"
                tone="red"
                showLabel={false}
              />
              <BorderGlow
                borderRadius={999}
                glowRadius={20}
                glowColor="10 100% 50%"
                colors={['#ff2800', '#ff5333', '#cc2000']}
                animated
              >
                <PulseStarButton href="/demo" innerClassName="min-h-12 px-6 text-sm">
                  <Sparkles className="w-4 h-4" />
                  Open Demo
                </PulseStarButton>
              </BorderGlow>
            </div>
          </nav>
        </div>
      </header>

      {/* MOBILE HEADER — simple clean bar */}
      <header className="fixed inset-x-0 top-0 z-[var(--z-fixed)] lg:hidden">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#151516]/90 px-4 py-3 backdrop-blur-md">
          <BrandMark variant="wordmark" className="block" imageClassName="w-[5rem]" />
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors active:bg-white/20"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cx(
          'fixed inset-0 z-[9999] lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        {/* Backdrop */}
        <div
          className={cx(
            'absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer */}
        <div
          className={cx(
            'absolute right-0 top-0 h-full w-[min(20rem,85vw)] bg-[#0d0d0e] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            mobileOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <span className="text-sm font-bold uppercase tracking-widest text-[var(--pulse-jasmine)]">Menu</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-colors active:bg-white/20"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col p-4">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cx(
                  'flex items-center gap-3 rounded-xl px-4 py-3.5 text-lg font-semibold transition-all duration-200',
                  isLinkActive(link.href)
                    ? 'text-[var(--pulse-red)]'
                    : 'text-white/80 hover:bg-white/5 hover:text-white',
                )}
                style={{ transitionDelay: mobileOpen ? `${50 + i * 40}ms` : '0ms' }}
              >
                <span
                  className={cx(
                    'h-1.5 w-1.5 rounded-full',
                    isLinkActive(link.href) ? 'bg-[var(--pulse-red)]' : 'bg-white/30',
                  )}
                />
                {link.label}
              </Link>
            ))}

            <div className="mx-4 my-4 h-px bg-white/10" />

            <Link
              href="/demo"
              onClick={() => setMobileOpen(false)}
              className="mx-2 flex items-center justify-center gap-2 rounded-xl bg-[var(--pulse-red)] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--pulse-red)]/20"
            >
              <Sparkles className="h-4 w-4" />
              Open Demo
            </Link>
            <a
              href="https://github.com/pulse-studio/pulse"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="mx-2 mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </>
  );
}
