'use client';

import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import ScrollReveal from './ScrollReveal';

function BeforeAfterEditorial() {
  const [slider, setSlider] = useState(35);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSlider(pct);
  };

  return (
    <div
      ref={containerRef}
      className="relative mx-auto h-48 w-full max-w-3xl cursor-ew-resize overflow-hidden rounded-2xl border border-white/10 sm:h-56"
      onMouseMove={(e) => handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
    >
      {/* STATIC SIDE (left) */}
      <div className="absolute inset-0 bg-[#0f0f10]">
        <div className="flex h-full w-full min-w-[100%] flex-col p-4 sm:p-5">
          <div className="text-sm font-bold text-white/40 sm:text-base">A Weekend in Kyoto</div>
          <p className="mt-1 text-[11px] leading-5 text-white/30 sm:text-xs">
            Kyoto is the cultural heart of Japan. From the golden pavilion of Kinkaku-ji to the bamboo groves of Arashiyama, every corner tells a story. Start your morning early...
          </p>
          <div className="mt-2 text-[11px] font-semibold text-white/30">Day 1: Temples & Tea</div>
          <p className="text-[11px] leading-5 text-white/25 sm:text-xs">
            Walk through the thousands of vermillion torii gates at Fushimi Inari. The hike takes about two hours. Afterward, head to Gion for a traditional kaiseki lunch...
          </p>
          <div className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            73% bounce rate
          </div>
        </div>
      </div>

      {/* PULSE SIDE (right, clipped) */}
      <div
        className="absolute inset-y-0 left-0 overflow-hidden bg-[linear-gradient(135deg,#fff9eb_0%,#ffffff_100%)]"
        style={{ width: `${slider}%` }}
      >
        <div className="flex h-full w-full min-w-[100%] flex-col p-4 sm:p-5">
          <div className="text-sm font-bold text-[var(--pulse-black)] sm:text-base">A Weekend in Kyoto</div>
          <p className="mt-1 text-[11px] leading-5 text-[var(--neutral-600)] sm:text-xs">
            Kyoto is the cultural heart of Japan. From the golden pavilion of Kinkaku-ji to the bamboo groves of Arashiyama, every corner tells a story.
          </p>

          {/* Poll block */}
          <div className="mt-2 rounded-lg border border-[var(--neutral-200)] bg-white p-2 shadow-sm">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-red)]">
              Poll · 1,204 votes
            </div>
            <div className="space-y-1">
              <div className="relative overflow-hidden rounded border border-[var(--neutral-200)] bg-white">
                <div className="absolute inset-y-0 left-0 w-[58%] bg-[var(--pulse-jasmine)]/60" />
                <div className="relative px-2 py-1 text-[10px] font-medium text-[var(--pulse-black)]">Spring (cherry blossoms) · 58%</div>
              </div>
              <div className="rounded border border-[var(--neutral-200)] bg-white px-2 py-1 text-[10px] text-[var(--neutral-500)]">Fall (autumn leaves) · 32%</div>
            </div>
          </div>

          {/* Accordion block */}
          <div className="mt-2 rounded-lg border border-[var(--neutral-200)] bg-white p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[var(--pulse-black)]">Best temples to visit?</span>
              <span className="text-[10px] text-[var(--pulse-red)]">Open</span>
            </div>
            <div className="mt-1 text-[10px] leading-4 text-[var(--neutral-600)]">
              Kinkaku-ji early morning, Fushimi Inari at sunset, and Ryoan-ji for zen gardens.
            </div>
          </div>

          <div className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-[var(--pulse-red)]/20 bg-[var(--pulse-red)]/10 px-2.5 py-1 text-[10px] font-bold text-[var(--pulse-red)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--pulse-red)]" />
            +340% time on page
          </div>
        </div>
      </div>

      {/* Slider handle */}
      <div
        className="absolute inset-y-0 w-1 bg-white shadow-[0_0_20px_rgba(0,0,0,0.3)]"
        style={{ left: `${slider}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[var(--pulse-black)] shadow-xl">
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white/80">Before</div>
      <div className="pointer-events-none absolute right-3 top-3 rounded bg-[var(--pulse-red)]/90 px-2 py-0.5 text-[10px] font-bold text-white">After</div>
    </div>
  );
}

export default function ProblemSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0d0d0e_0%,#151516_100%)] py-14 sm:py-18">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[10%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-red)]/8 blur-[120px]" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="pulse-kicker mb-4"
          >
            The Reality
          </motion.p>

          <ScrollReveal
            className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
            textClassName="leading-tight"
            baseOpacity={0.15}
            blurStrength={5}
            staggerDelay={0.08}
          >
            They scroll. They leave. They forget.
          </ScrollReveal>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg"
          >
            The average reader spends <span className="font-semibold text-[var(--pulse-jasmine)]">8 seconds</span> on a static page.
            Below is the exact same article. On the right, it became an experience.
          </motion.p>
        </div>

        {/* Before / After comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-8 max-w-3xl"
        >
          <BeforeAfterEditorial />
        </motion.div>

        {/* Compact stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-4 text-white"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[var(--pulse-jasmine)] tabular-nums">73%</span>
            <span className="text-xs text-white/60">drop-off</span>
          </div>
          <span className="hidden h-4 w-px bg-white/20 sm:inline" />
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[var(--pulse-jasmine)] tabular-nums">8s</span>
            <span className="text-xs text-white/60">attention</span>
          </div>
          <span className="hidden h-4 w-px bg-white/20 sm:inline" />
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[var(--pulse-jasmine)] tabular-nums">0%</span>
            <span className="text-xs text-white/60">passive engagement</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
