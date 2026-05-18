'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Frown, Zap } from 'lucide-react';

const EXCUSES = [
  'This page took a sabbatical.',
  'We looked under the server. It\'s not there.',
  'Even our AI couldn\'t find this one.',
  'Plot twist: the page was imaginary.',
  'It\'s not you. It\'s the URL.',
  'This page has been promoted to 410 Gone.',
  'Schrödinger\'s page: simultaneously existing and not.',
  'The intern typed the URL wrong. Fired.',
  'This page is at a better place now. (The void.)',
  'We asked the database. It just stared back.',
];

export default function NotFound() {
  const [excuseIndex, setExcuseIndex] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-cycle excuses every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setExcuseIndex((i) => (i + 1) % EXCUSES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Glitch pulse every 3.5s
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 120);
    }, 3500);
    return () => clearInterval(glitchInterval);
  }, []);

  const currentExcuse = EXCUSES[excuseIndex];

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 py-12">
      {/* Subtle noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Accent glow orbs — higher contrast */}
      <div className="pointer-events-none absolute left-[5%] top-[10%] h-56 w-56 rounded-full bg-[#FF2800]/15 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[8%] right-[5%] h-44 w-44 rounded-full bg-[#FFE695]/10 blur-[90px]" />

      <div
        className={`relative z-10 flex w-full max-w-lg flex-col items-center text-center transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* 404 with glitch */}
        <div className="relative mb-6">
          <h1
            className={`select-none text-[7rem] font-bold leading-none tracking-tighter text-white transition-transform duration-100 md:text-[9rem] ${
              glitch ? 'translate-x-[2px] text-[#FF2800]' : ''
            }`}
            style={{ fontFamily: 'var(--font-codec-pro), monospace' }}
          >
            404
          </h1>
          {glitch && (
            <span
              className="pointer-events-none absolute left-0 top-0 select-none text-[7rem] font-bold leading-none tracking-tighter text-[#FFE695]/70 md:text-[9rem]"
              style={{ fontFamily: 'var(--font-codec-pro), monospace', transform: 'translate(-3px, 2px)' }}
              aria-hidden
            >
              404
            </span>
          )}
        </div>

        {/* Status badge */}
        <div className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-sm">
          <Frown className="h-3.5 w-3.5 text-[#FF2800]" />
          <span className="text-xs font-semibold tracking-wide text-white/90">
            Page Not Found
          </span>
        </div>

        {/* Sarcastic excuse — auto-cycling */}
        <div className="mb-8 h-12">
          <p
            key={excuseIndex}
            className="animate-fade-in text-base font-medium leading-snug text-white/80 md:text-lg"
            style={{ animation: 'fadeIn 0.4s ease-out' }}
          >
            &ldquo;{currentExcuse}&rdquo;
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#FF2800] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#FF2800]/25 transition-all hover:bg-[#ff3d1a] hover:shadow-xl hover:shadow-[#FF2800]/35 active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4" />
            Take me home
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-bold text-white/90 backdrop-blur-sm transition-all hover:border-[#FFE695]/40 hover:bg-white/10 hover:text-white active:scale-[0.97]"
          >
            <Zap className="h-4 w-4" />
            Explore the blog
          </Link>
        </div>

        {/* Footer meta */}
        <p className="mt-10 text-[11px] font-medium tracking-wide text-white/30">
          Status: <span className="text-[#FF2800]">Lost in the void</span> · Error Code: 404
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
