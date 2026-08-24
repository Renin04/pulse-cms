'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PulseStarButton from '../components/PulseStarButton';
import SpotlightCard from '../components/SpotlightCard';
import StarBorder from '../components/StarBorder';
import ShinyText from '../components/ShinyText';

interface DocLeafContentProps {
  page: {
    title: string;
    summary: string;
    bullets: string[];
    sections?: {
      heading: string;
      paragraphs?: string[];
      list?: string[];
      code?: { language: string; code: string; caption?: string };
    }[];
  };
}

export default function DocLeafContent({ page }: DocLeafContentProps) {
  return (
    <>
      <Navigation />

      <main id="main-content" className="min-h-screen bg-gradient-to-b from-white via-[#fff9eb] to-[#fff9eb] pt-28">
        {/* Header */}
        <section className="relative overflow-hidden border-b border-black/5">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-10%] top-[10%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-red)]/5 blur-[120px]" />
          </div>

          <div className="container relative py-14">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/docs"
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--neutral-200)] bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-600)] backdrop-blur-sm transition-colors hover:border-[var(--pulse-red)]/30 hover:text-[var(--pulse-red)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to docs
              </Link>

              <h1 className="mb-4 text-4xl font-bold text-[var(--pulse-black)] sm:text-5xl">
                <ShinyText
                  text={page.title}
                  className="inline"
                  color="#111827"
                  shineColor="#FF2800"
                  speed={5}
                  spread={90}
                />
              </h1>
              <p className="text-lg leading-relaxed text-[var(--neutral-600)] sm:text-xl">
                {page.summary}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 sm:py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <SpotlightCard
                className="rounded-[2rem] border border-white/60 bg-white/60 p-8 shadow-xl shadow-black/5 backdrop-blur-2xl sm:p-10"
                spotlightColor="rgba(255, 40, 0, 0.08)"
              >
                <h2 className="mb-6 text-xl font-bold text-[var(--pulse-black)] sm:text-2xl">
                  Key points
                </h2>
                <div className="space-y-3">
                  {page.bullets.map((bullet) => (
                    <SpotlightCard
                      key={bullet}
                      className="flex items-start gap-4 rounded-xl border-l-4 border-[var(--pulse-red)] border-y border-r border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-sm transition-all hover:bg-white/60"
                      spotlightColor="rgba(255, 40, 0, 0.06)"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--pulse-red)]" />
                      <p className="m-0 text-base leading-7 text-[var(--neutral-700)]">{bullet}</p>
                    </SpotlightCard>
                  ))}
                </div>

                {page.sections && page.sections.length > 0 && (
                  <div className="mt-10 space-y-10 border-t border-black/5 pt-10">
                    {page.sections.map((section) => (
                      <section key={section.heading}>
                        <h3 className="mb-4 text-xl font-bold text-[var(--pulse-black)]">
                          {section.heading}
                        </h3>
                        {section.paragraphs?.map((p) => (
                          <p key={p.slice(0, 40)} className="mb-4 text-base leading-8 text-[var(--neutral-700)]">
                            {p}
                          </p>
                        ))}
                        {section.list && (
                          <ul className="mb-4 list-disc space-y-2 pl-6 text-base leading-7 text-[var(--neutral-700)]">
                            {section.list.map((item) => (
                              <li key={item.slice(0, 40)}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {section.code && (
                          <figure className="overflow-hidden rounded-xl border border-black/10 bg-[#0d1117]">
                            <pre className="overflow-x-auto p-5 text-sm leading-6 text-[#e6edf3]"><code>{section.code.code}</code></pre>
                            {section.code.caption && (
                              <figcaption className="border-t border-white/10 px-5 py-2.5 text-xs text-[#9da7b3]">
                                {section.code.caption}
                              </figcaption>
                            )}
                          </figure>
                        )}
                      </section>
                    ))}
                  </div>
                )}

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <PulseStarButton href="/docs" innerClassName="px-6 py-3 text-base">
                    Return to docs hub
                  </PulseStarButton>
                  <StarBorder
                    as={Link}
                    href="/demo"
                    className="rounded-xl"
                    innerClassName="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-[var(--pulse-black)]"
                    color="#FF2800"
                    speed="4s"
                  >
                    Explore the demo
                    <ArrowRight className="h-4 w-4" />
                  </StarBorder>
                </div>
              </SpotlightCard>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
