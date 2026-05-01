'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code2,
  Layers,
  Zap,
  Box,
  GitBranch,
  Terminal,
  CheckCircle2,
  Copy,
} from 'lucide-react';

const snippets = {
  plugin: `import { defineBlock } from '@pulse/core';

export const PollBlock = defineBlock({
  id: 'poll',
  schema: {
    question: 'string',
    options: 'string[]',
  },
  render({ data }) {
    return (
      <Poll
        question={data.question}
        options={data.options}
      />
    );
  },
});`,
  eventbus: `import { eventBus } from '@pulse/core';

eventBus.on('block:mount', ({ id, type }) => {
  analytics.track('Block Viewed', {
    blockType: type,
  });
});

eventBus.emit('quiz:completed', {
  score: 8,
  total: 10,
});`,
};

const features = [
  {
    icon: Layers,
    title: 'Framework adapters',
    body: 'Native packages for Next.js, Nuxt, Astro, React, and Vue. No wrappers. No hacks.',
  },
  {
    icon: Code2,
    title: 'TypeScript-first',
    body: 'Every API is fully typed. Autocomplete from editor to renderer without guessing.',
  },
  {
    icon: Zap,
    title: 'SSR & SSG ready',
    body: 'Render interactive blocks on the server. Hydrate seamlessly on the client.',
  },
  {
    icon: Box,
    title: 'Plugin API',
    body: 'Register custom blocks, add toolbar actions, and extend the editor surface.',
  },
  {
    icon: GitBranch,
    title: 'EventBus',
    body: 'Subscribe to lifecycle events, track analytics, or wire blocks together.',
  },
];

export default function DeveloperFeatures() {
  const [tab, setTab] = useState<'plugin' | 'eventbus'>('plugin');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="relative overflow-hidden bg-[#0a0a0b] py-20 sm:py-28">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[20%] top-[10%] h-[70%] w-[70%] rounded-full bg-[var(--pulse-red)]/8 blur-[120px]" style={{ animation: 'devBlob 10s infinite' }} />
        <div className="absolute -bottom-[10%] -right-[10%] h-[60%] w-[60%] rounded-full bg-purple-600/10 blur-[120px]" style={{ animation: 'devBlob 10s infinite 3s' }} />
      </div>

      <style jsx>{`
        @keyframes devBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.08); }
          66% { transform: translate(-30px, 20px) scale(0.95); }
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
            For Developers
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
          >
            Extend without limits.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-base text-white/60 sm:text-lg"
          >
            Pulse is not a closed SaaS. It is a publishing engine you can shape with code.
          </motion.p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-start">
          {/* Features list */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-2 lg:order-1"
          >
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-6 top-8 bottom-8 hidden w-px bg-gradient-to-b from-[var(--pulse-red)]/40 via-[var(--pulse-red)]/20 to-transparent sm:block" />

              <div className="space-y-4">
                {features.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="group relative flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-[var(--pulse-red)]/30 hover:bg-white/[0.06] sm:pl-5"
                  >
                    <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--pulse-red)] to-[#ff6b4a] shadow-lg shadow-[var(--pulse-red)]/20 transition-transform group-hover:scale-105">
                      <f.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{f.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/60">{f.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Code editor */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0e] shadow-2xl shadow-black/50">
              {/* Editor header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-[#161618] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="ml-2 flex items-center gap-2 text-xs text-white/40">
                    <Terminal className="h-3.5 w-3.5" />
                    <span className="font-mono">editor.config.ts</span>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/10"
                >
                  {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-white/10 bg-[#161618] px-3">
                <button
                  onClick={() => setTab('plugin')}
                  className={`relative rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    tab === 'plugin' ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Plugin
                  {tab === 'plugin' && (
                    <motion.div
                      layoutId="devTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--pulse-red)]"
                    />
                  )}
                </button>
                <button
                  onClick={() => setTab('eventbus')}
                  className={`relative rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    tab === 'eventbus' ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  EventBus
                  {tab === 'eventbus' && (
                    <motion.div
                      layoutId="devTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--pulse-red)]"
                    />
                  )}
                </button>
              </div>

              {/* Code area */}
              <div className="relative p-4">
                <div className="flex">
                  {/* Line numbers */}
                  <div className="select-none pr-4 text-right font-mono text-xs leading-6 text-white/20">
                    {snippets[tab].split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Code with simple syntax highlighting simulation */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="flex-1 overflow-x-auto"
                    >
                      <pre className="font-mono text-xs leading-6 text-[#a5ffce]">
                        {tab === 'plugin' ? (
                          <>
                            <span className="text-[#ff7b72]">import</span> <span className="text-[#e6edf3]">{`{ defineBlock } `}</span>
                            <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">&apos;@pulse/core&apos;</span>;
                            <span className="block text-white/20">{''}</span>
                            <span className="text-[#ff7b72]">export const</span> <span className="text-[#d2a8ff]">PollBlock</span> <span className="text-[#ff7b72]">=</span> <span className="text-[#d2a8ff]">defineBlock</span>({"{"}
                            <span className="block text-[#e6edf3]">  id: <span className="text-[#a5d6ff]">&apos;poll&apos;</span>,</span>
                            <span className="block text-[#e6edf3]">  schema: {"{"}</span>
                            <span className="block text-[#e6edf3]">    question: <span className="text-[#a5d6ff]">&apos;string&apos;</span>,</span>
                            <span className="block text-[#e6edf3]">    options: <span className="text-[#a5d6ff]">&apos;string[]&apos;</span>,</span>
                            <span className="block text-[#e6edf3]">  {"}"},</span>
                            <span className="block text-[#e6edf3]">  <span className="text-[#d2a8ff]">render</span>({"{"} data {"}"}) {"{"}</span>
                            <span className="block text-[#e6edf3]">    <span className="text-[#ff7b72]">return</span> (</span>
                            <span className="block text-[#e6edf3]">      &lt;<span className="text-[#7ee787]">Poll</span></span>
                            <span className="block text-[#e6edf3]">        question=</span><span className="text-[#a5d6ff]">&quot;...&quot;</span>
                            <span className="block text-[#e6edf3]">        options=</span><span className="text-[#a5d6ff]">&quot;...&quot;</span>
                            <span className="block text-[#e6edf3]">      /&gt;</span>
                            <span className="block text-[#e6edf3]">    );</span>
                            <span className="block text-[#e6edf3]">  {"}"},</span>
                            <span className="text-[#e6edf3]">{"}"}</span>);
                          </>
                        ) : (
                          <>
                            <span className="text-[#ff7b72]">import</span> <span className="text-[#e6edf3]">{`{ eventBus } `}</span>
                            <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">&apos;@pulse/core&apos;</span>;
                            <span className="block text-white/20">{''}</span>
                            <span className="text-[#d2a8ff]">eventBus</span>.<span className="text-[#d2a8ff]">on</span>(<span className="text-[#a5d6ff]">&apos;block:mount&apos;</span>, {"("}{"{"} id, type {"}"}
                            <span className="block text-[#e6edf3]">  analytics.<span className="text-[#d2a8ff]">track</span>(<span className="text-[#a5d6ff]">&apos;Block Viewed&apos;</span>, {"{"}</span>
                            <span className="block text-[#e6edf3]">    blockType: type,</span>
                            <span className="block text-[#e6edf3]">  {"}"});</span>
                            <span className="text-[#e6edf3]">{"}"}</span>);
                            <span className="block text-white/20">{''}</span>
                            <span className="text-[#d2a8ff]">eventBus</span>.<span className="text-[#d2a8ff]">emit</span>(<span className="text-[#a5d6ff]">&apos;quiz:completed&apos;</span>, {"{"}
                            <span className="block text-[#e6edf3]">  score: <span className="text-[#79c0ff]">8</span>,</span>
                            <span className="block text-[#e6edf3]">  total: <span className="text-[#79c0ff]">10</span>,</span>
                            <span className="text-[#e6edf3]">{"}"}</span>);
                          </>
                        )}
                      </pre>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
