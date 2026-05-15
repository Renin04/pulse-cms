'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, Sparkles, Image as ImageIcon, Terminal, CheckCircle2 } from 'lucide-react';

function useTyping(text: string, speed = 45) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplay('');
    const id = setInterval(() => {
      setDisplay(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return display;
}

function BlockBuilderDemo() {
  const [phase, setPhase] = useState(0);
  const mounted = useRef(false);
  const placeholder = useTyping('a timeline block with scroll animations');

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-white/40">
        <Terminal className="h-3.5 w-3.5" />
        AI Block Builder
      </div>
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <input
            readOnly
            aria-label="AI prompt input"
            value={phase >= 1 ? placeholder : ''}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
          />
          {phase < 1 && <span className="absolute left-3 top-2 text-xs text-white/30">|</span>}
        </div>
        <span className="rounded-lg bg-[var(--pulse-red)] px-3 py-2 text-xs font-bold text-white">Build</span>
      </div>
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 space-y-1.5"
          >
            {['Schema defined', 'Editor UI generated', 'Renderer compiled'].map((s) => (
              <div key={s} className="flex items-center gap-2 text-[11px] text-white/70">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {s}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AIWriterDemo() {
  const [phase, setPhase] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white p-4">
      <div className="text-[11px] font-semibold text-[var(--neutral-500)]">AI Writer</div>
      <div className="mt-2 text-sm text-[var(--pulse-black)]">
        Kyoto is beautiful in spring.
      </div>
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 rounded-lg border border-[var(--pulse-jasmine)]/50 bg-[var(--pulse-jasmine)]/20 p-2"
          >
            <span className="text-sm text-[var(--pulse-black)]">
              Kyoto comes alive in spring, when cherry blossoms paint the city in soft pink hues and the Philosopher&apos;s Path fills with petals.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-3 flex gap-2">
        {['Expand', 'Rewrite', 'Formal'].map((btn, i) => (
          <span
            key={btn}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              i === 0 && phase >= 2 ? 'bg-[var(--pulse-black)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
            }`}
          >
            {btn}
          </span>
        ))}
      </div>
    </div>
  );
}

function AIImageDemo() {
  const [loaded, setLoaded] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const t = setTimeout(() => setLoaded(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[var(--neutral-50)] p-4">
      <div className="text-[11px] font-semibold text-[var(--neutral-500)]">AI Image</div>
      <div className="mt-2 flex aspect-[4/3] items-center justify-center rounded-lg bg-gradient-to-br from-[var(--pulse-jasmine)]/30 to-[var(--pulse-red)]/10">
        <AnimatePresence>
          {!loaded ? (
            <motion.div
              key="loader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-[var(--neutral-600)]"
            >
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--neutral-300)] border-t-[var(--pulse-red)]" />
              Generating image...
            </motion.div>
          ) : (
            <motion.div
              key="image"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <ImageIcon className="mx-auto h-8 w-8 text-[var(--pulse-black)]" />
              <p className="mt-1 text-xs font-medium text-[var(--pulse-black)]">Kyoto temple at sunrise</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-2 text-[10px] text-[var(--neutral-500)]">Prompt: &quot;A minimalist Kyoto temple at sunrise, soft watercolor style&quot;</div>
    </div>
  );
}

export default function AIFeatures() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0b] py-20 sm:py-28">
      {/* Animated mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[20%] -top-[20%] h-[80%] w-[80%] rounded-full bg-[var(--pulse-red)]/10 blur-[120px]" style={{ animation: 'blob 8s infinite' }} />
        <div className="absolute -bottom-[20%] -right-[20%] h-[80%] w-[80%] rounded-full bg-[var(--pulse-jasmine)]/8 blur-[120px]" style={{ animation: 'blob 8s infinite 2s' }} />
        <div className="absolute left-1/3 top-1/3 h-[40%] w-[40%] rounded-full bg-purple-600/10 blur-[100px]" style={{ animation: 'blob 8s infinite 4s' }} />
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--pulse-red)]"
          >
            AI-Powered
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
          >
            Creativity on autopilot.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-base text-white/60 sm:text-lg"
          >
            Build blocks, rewrite copy, and generate images — without leaving the editor.
          </motion.p>
        </div>

        {/* Bento grid */}
        <div className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Block Builder — wide card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:border-[var(--pulse-red)]/30 hover:bg-white/[0.05] sm:col-span-2 lg:col-span-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--pulse-red)]/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative flex h-full flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="flex-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--pulse-red)] to-[#ff6b4a] shadow-lg shadow-[var(--pulse-red)]/20">
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">AI Block Builder</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
                  Describe any block in plain English. Pulse generates the schema, editor UI, and renderer automatically — then drops it into your project.
                </p>
              </div>
              <div className="w-full lg:w-[320px]">
                <BlockBuilderDemo />
              </div>
            </div>
          </motion.div>

          {/* AI Writer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:border-[var(--pulse-jasmine)]/30 hover:bg-white/[0.05]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--pulse-jasmine)]/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--pulse-jasmine)] to-[#fff5cc] shadow-lg shadow-[var(--pulse-jasmine)]/20">
                <Sparkles className="h-6 w-6 text-[var(--pulse-black)]" />
              </div>
              <h3 className="text-xl font-bold text-white">AI Writer</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Expand bullets into paragraphs, rewrite tone, or translate — all inside the block you are editing.
              </p>
              <div className="mt-4">
                <AIWriterDemo />
              </div>
            </div>
          </motion.div>

          {/* AI Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:border-[var(--pulse-red)]/30 hover:bg-white/[0.05] sm:col-span-2 lg:col-span-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--pulse-red)]/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-[var(--pulse-red)] shadow-lg shadow-purple-500/20">
                <ImageIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">AI Image</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Generate hero images, diagrams, and illustrations directly from your prompt.
              </p>
              <div className="mt-4">
                <AIImageDemo />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
