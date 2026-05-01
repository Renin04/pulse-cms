'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Type,
  Heading,
  Image as ImageIcon,
  BarChart3,
  GitBranch,
  Rocket,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
   Step data
   ─────────────────────────────────────────────────────────────── */
const steps = [
  {
    id: 1,
    title: 'Write the story',
    body: 'Start with the basics. Add a heading block for your title, then text blocks for your paragraphs. Every element is a block you can move, edit, or delete — just like stacking LEGO bricks.',
    icon: Type,
  },
  {
    id: 2,
    title: 'Add engagement',
    body: 'Type /poll to ask your readers a question. Add an image block to show the scenery. These are not decorations — they are part of the narrative.',
    icon: BarChart3,
  },
  {
    id: 3,
    title: 'Branch the path',
    body: 'Why force every reader down the same route? Create branches so a reader who chooses "Spring" sees cherry blossoms, while "Fall" gets autumn foliage spots.',
    icon: GitBranch,
  },
  {
    id: 4,
    title: 'Publish anywhere',
    body: 'Pulse compiles your interactive guide into clean, framework-native code. Drop it into Next.js, Nuxt, Astro, or any React or Vue project. No iframe hacks.',
    icon: Rocket,
  },
];

/* ────────────────────────────────────────────────────────────────
   Shared chrome for mini editor demos
   ─────────────────────────────────────────────────────────────── */
function DemoChrome({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[1.4rem] border border-[var(--neutral-200)] bg-white shadow-[0_24px_70px_-40px_rgba(17,24,39,0.35)] ${className}`}>
      <div className="flex items-center gap-2 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[11px] font-semibold text-[var(--neutral-500)]">kyoto-guide.md</span>
      </div>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Step 1: Write the story — heading + text blocks
   ─────────────────────────────────────────────────────────────── */
function WriteDemo() {
  const [phase, setPhase] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <DemoChrome className="w-full max-w-md">
      <div className="p-4 sm:p-5">
        <div className="space-y-3">
          {/* Heading block */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[var(--neutral-200)] bg-white p-3"
              >
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-red)]">
                  <Heading className="h-3 w-3" />
                  Heading Block
                </div>
                <h1 className="text-lg font-bold text-[var(--pulse-black)]">A Weekend in Kyoto</h1>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text block */}
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[var(--neutral-200)] bg-white p-3"
              >
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-red)]">
                  <Type className="h-3 w-3" />
                  Text Block
                </div>
                <p className="text-sm leading-relaxed text-[var(--neutral-600)]">
                  Kyoto is the cultural heart of Japan. From golden temples to bamboo groves, every corner tells a story.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Second text block */}
          <AnimatePresence>
            {phase >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[var(--neutral-200)] bg-white p-3"
              >
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-red)]">
                  <Type className="h-3 w-3" />
                  Text Block
                </div>
                <p className="text-sm leading-relaxed text-[var(--neutral-600)]">
                  Start your morning at Kinkaku-ji before the crowds arrive, then wander through the Arashiyama bamboo forest.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DemoChrome>
  );
}

/* ────────────────────────────────────────────────────────────────
   Step 2: Add engagement — image + poll
   ─────────────────────────────────────────────────────────────── */
function EngageDemo() {
  const [voted, setVoted] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const t1 = setTimeout(() => setVoted(true), 800);
    return () => clearTimeout(t1);
  }, []);

  return (
    <DemoChrome className="w-full max-w-md">
      <div className="p-4 sm:p-5">
        <div className="space-y-3">
          {/* Image block */}
          <div className="rounded-xl border border-[var(--neutral-200)] bg-white p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-red)]">
              <ImageIcon className="h-3 w-3" />
              Image Block
            </div>
            <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-[var(--pulse-jasmine)]/40 to-[var(--pulse-red)]/10">
              <span className="text-sm font-semibold text-[var(--pulse-black)]">Kyoto Bamboo Grove</span>
            </div>
          </div>

          {/* Poll block */}
          <div className="rounded-xl border border-[var(--neutral-200)] bg-white p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-red)]">
              <BarChart3 className="h-3 w-3" />
              Poll Block · 1,204 votes
            </div>
            <p className="text-sm font-medium text-[var(--pulse-black)]">Which season would you visit?</p>
            <div className="mt-2 space-y-1.5">
              {[
                { label: 'Spring (cherry blossoms)', count: 58 },
                { label: 'Fall (autumn leaves)', count: 32 },
                { label: 'Winter (snow temples)', count: 10 },
              ].map((d) => (
                <div key={d.label} className="relative overflow-hidden rounded-lg border border-[var(--neutral-200)] bg-white">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: voted ? `${d.count}%` : '0%' }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-y-0 left-0 bg-[var(--pulse-jasmine)]/60"
                  />
                  <div className="relative flex items-center justify-between px-2.5 py-1.5 text-xs">
                    <span className="font-medium text-[var(--pulse-black)]">{d.label}</span>
                    <span className="font-bold text-[var(--pulse-black)]">{voted ? `${d.count}%` : 'Vote'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoChrome>
  );
}

/* ────────────────────────────────────────────────────────────────
   Step 3: Branch the path
   ─────────────────────────────────────────────────────────────── */
function BranchDemo() {
  const [branch, setBranch] = useState<'spring' | 'fall' | null>(null);

  return (
    <DemoChrome className="w-full max-w-md">
      <div className="p-4 sm:p-5">
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-red)]">
              <GitBranch className="h-3 w-3" />
              Branch Block
            </div>
            <p className="text-sm font-medium text-[var(--pulse-black)]">Choose your season:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setBranch('spring')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  branch === 'spring' ? 'bg-[var(--pulse-black)] text-white' : 'bg-white text-[var(--pulse-black)] border border-[var(--neutral-200)]'
                }`}
              >
                🌸 Spring
              </button>
              <button
                onClick={() => setBranch('fall')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  branch === 'fall' ? 'bg-[var(--pulse-red)] text-white' : 'bg-white text-[var(--pulse-black)] border border-[var(--neutral-200)]'
                }`}
              >
                🍁 Fall
              </button>
            </div>
          </div>

          <AnimatePresence>
            {branch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-[var(--neutral-200)] bg-white p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Active Path
                  </div>
                  <p className="text-sm font-medium text-[var(--pulse-black)]">
                    {branch === 'spring'
                      ? 'Visit Maruyama Park for cherry blossoms, then take a boat ride along the Hozu River.'
                      : 'Head to Eikando Temple for fiery maple leaves, then sip matcha in the Philosopher\'s Path.'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DemoChrome>
  );
}

/* ────────────────────────────────────────────────────────────────
   Step 4: Publish demo — framework export
   ─────────────────────────────────────────────────────────────── */
function PublishDemo() {
  const [fw, setFw] = useState<'next' | 'nuxt' | 'astro'>('next');

  const snippets: Record<string, string> = {
    next: `import { PulseRenderer } from '@pulse/next';

export default function KyotoGuide({ post }) {
  return <PulseRenderer post={post} />;
}`,
    nuxt: `<script setup>
import { PulseRenderer } from '@pulse/vue'
const { data: post } = await useFetch('/api/kyoto-guide')
</script>

<template>
  <PulseRenderer :post="post" />
</template>`,
    astro: `---
import { PulseRenderer } from '@pulse/astro';
const post = await fetchKyotoGuide();
---
<PulseRenderer post={post} />`,
  };

  const tabs = [
    { id: 'next', label: 'Next.js' },
    { id: 'nuxt', label: 'Nuxt' },
    { id: 'astro', label: 'Astro' },
  ] as const;

  return (
    <DemoChrome className="w-full max-w-md">
      <div className="p-0">
        <div className="flex items-center gap-1 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFw(t.id)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                fw === t.id ? 'bg-white text-[var(--pulse-black)] shadow-sm' : 'text-[var(--neutral-500)] hover:text-[var(--pulse-black)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative bg-[#0d0d0e] p-4">
          <AnimatePresence mode="wait">
            <motion.pre
              key={fw}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="font-mono text-xs leading-relaxed text-[#a5ffce]"
            >
              {snippets[fw]}
            </motion.pre>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--neutral-200)] bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--neutral-500)]">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            SSR-ready · Zero iframe
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(snippets[fw])}
            className="rounded-md bg-[var(--pulse-black)] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[var(--pulse-red)] transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </DemoChrome>
  );
}

/* ────────────────────────────────────────────────────────────────
   Main HowItWorks section
   ─────────────────────────────────────────────────────────────── */
export default function HowItWorks() {
  const [step, setStep] = useState(1);

  const StepIcon = steps[step - 1].icon;

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#fff9eb_100%)] py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-10%] top-[10%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-red)]/5 blur-[120px]" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pulse-kicker mb-3"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-[var(--pulse-black)] sm:text-4xl lg:text-5xl"
          >
            From idea to interactive experience.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-3 max-w-xl text-base text-[var(--neutral-600)] sm:text-lg"
          >
            Four steps. One real example.
          </motion.p>
        </div>

        {/* Stepper indicators */}
        <div className="mx-auto mt-10 flex max-w-3xl items-center justify-between gap-2">
          {steps.map((s, i) => {
            const active = s.id === step;
            const complete = s.id < step;
            return (
              <div key={s.id} className="flex flex-1 items-center">
                <button
                  onClick={() => setStep(s.id)}
                  className={`group flex items-center gap-2 rounded-full px-3 py-2 transition-all ${
                    active ? 'bg-[var(--pulse-black)] text-white shadow-md' : 'bg-white text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]'
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    active ? 'bg-[var(--pulse-red)] text-white' : complete ? 'bg-green-500 text-white' : 'bg-[var(--neutral-200)] text-[var(--neutral-600)]'
                  }`}>
                    {complete ? <CheckCircle2 className="h-3 w-3" /> : s.id}
                  </span>
                  <span className="hidden text-xs font-semibold sm:inline">{s.title}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className="mx-1.5 h-px flex-1 bg-[var(--neutral-200)]">
                    <motion.div
                      initial={false}
                      animate={{ width: complete ? '100%' : '0%' }}
                      className="h-full bg-green-500"
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
          {/* Text side */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="order-2 lg:order-1"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--pulse-jasmine)]/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--pulse-black)]">
                <StepIcon className="h-3.5 w-3.5" />
                Step {step}
              </div>
              <h3 className="mt-3 text-xl font-bold text-[var(--pulse-black)] sm:text-2xl">
                {steps[step - 1].title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-[var(--neutral-600)] sm:text-lg">
                {steps[step - 1].body}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--neutral-200)] bg-white px-4 py-2 text-sm font-semibold text-[var(--pulse-black)] transition-all hover:border-[var(--pulse-red)]/30 disabled:opacity-40 disabled:hover:border-[var(--neutral-200)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep((s) => Math.min(4, s + 1))}
                  disabled={step === 4}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--pulse-black)] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-black/15 transition-all hover:bg-[var(--pulse-red)] disabled:opacity-40"
                >
                  Next step
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Demo side */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="order-1 flex justify-center lg:order-2 lg:justify-end"
            >
              {step === 1 && <WriteDemo />}
              {step === 2 && <EngageDemo />}
              {step === 3 && <BranchDemo />}
              {step === 4 && <PublishDemo />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
