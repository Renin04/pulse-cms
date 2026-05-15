'use client';

import { motion } from 'motion/react';
import {
  Book, Code2, Terminal, Blocks, ArrowRight,
  Github, FileCode, Sparkles, Search,
} from 'lucide-react';
import Footer from '../components/Footer';
import SpotlightCard from '../components/SpotlightCard';
import ShinyText from '../components/ShinyText';
import GlassIconButton from '../components/GlassIconButton';

const docSections = [
  {
    icon: Book,
    title: 'Getting Started',
    description: 'Learn the basics of Pulse and build your first blog.',
    links: [
      { label: 'Quick Start', href: '/docs/quickstart' },
      { label: 'Installation', href: '/docs/installation' },
      { label: 'Configuration', href: '/docs/configuration' },
    ]
  },
  {
    icon: Blocks,
    title: 'Core Concepts',
    description: 'Understand the architecture and key concepts.',
    links: [
      { label: 'Blocks', href: '/docs/blocks' },
      { label: 'Editor State', href: '/docs/state' },
      { label: 'Events', href: '/docs/events' },
      { label: 'Plugins', href: '/docs/plugins' },
    ]
  },
  {
    icon: Code2,
    title: 'API Reference',
    description: 'Detailed API documentation for all packages.',
    links: [
      { label: '@pulse/core', href: '/docs/api/core' },
      { label: '@pulse/editor', href: '/docs/api/editor' },
      { label: '@pulse/renderer', href: '/docs/api/renderer' },
      { label: '@pulse/react', href: '/docs/api/react' },
    ]
  },
  {
    icon: Terminal,
    title: 'CLI & Tools',
    description: 'Command-line tools and development utilities.',
    links: [
      { label: 'CLI Reference', href: '/docs/cli' },
      { label: 'Development', href: '/docs/dev' },
      { label: 'Testing', href: '/docs/testing' },
    ]
  },
  {
    icon: Blocks,
    title: 'Block Development',
    description: 'Create custom blocks for your specific needs.',
    links: [
      { label: 'Block Schema', href: '/docs/block-schema' },
      { label: 'Editor Component', href: '/docs/block-editor' },
      { label: 'Renderer', href: '/docs/block-renderer' },
      { label: 'Examples', href: '/docs/block-examples' },
    ]
  },
  {
    icon: Sparkles,
    title: 'Advanced Topics',
    description: 'Deep dives into advanced features and customization.',
    links: [
      { label: 'Theming', href: '/docs/theming' },
      { label: 'SSR & Static', href: '/docs/ssr' },
      { label: 'AI Integration', href: '/docs/ai' },
      { label: 'Performance', href: '/docs/performance' },
    ]
  },
];

export default function DocsPage() {
  return (
    <>
      <main id="main-content">

      <section className="relative min-h-[60vh] overflow-hidden bg-gradient-to-b from-white via-[#fff9eb] to-[#fff9eb] pt-32 pb-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[10%] h-[500px] w-[500px] rounded-full bg-[var(--pulse-red)]/5 blur-[120px]" />
          <div className="absolute right-[-5%] top-[20%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-jasmine)]/30 blur-[100px]" />
        </div>

        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--neutral-200)] bg-white/80 px-4 py-1.5 text-xs font-semibold tracking-wide text-[var(--neutral-600)] backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Pulse Documentation
            </motion.span>

            <h1 className="text-4xl font-bold text-[var(--pulse-black)] sm:text-5xl lg:text-6xl">
              <ShinyText
                text="Documentation"
                className="inline"
                color="#111827"
                shineColor="#FF2800"
                speed={4}
                spread={90}
              />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--neutral-600)] sm:text-lg"
            >
              Everything you need to know about building with Pulse.
              From quick starts to deep dives.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mx-auto mt-10 max-w-xl"
            >
              <SpotlightCard
                className="rounded-2xl border border-white/60 bg-white/50 p-1 shadow-xl shadow-black/5 backdrop-blur-xl"
                spotlightColor="rgba(255, 40, 0, 0.1)"
              >
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-[var(--neutral-400)]" />
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    className="w-full rounded-xl bg-transparent py-4 pl-12 pr-16 text-base text-[var(--pulse-black)] placeholder:text-[var(--neutral-400)] outline-none"
                  />
                  <div className="absolute right-3 flex items-center gap-2 text-[var(--neutral-400)]">
                    <kbd className="rounded-lg border border-[var(--neutral-200)] bg-white/70 px-2 py-1 text-xs font-medium backdrop-blur-sm">⌘K</kbd>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#fff9eb] py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-[0%] left-[-5%] h-[300px] w-[300px] rounded-full bg-[var(--pulse-red)]/5 blur-[100px]" />
        </div>

        <div className="container relative">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {docSections.map((section, i) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <SpotlightCard
                    className="group h-full rounded-2xl border border-white/60 bg-white/50 p-6 shadow-lg shadow-black/5 backdrop-blur-xl transition-all hover:border-white/80 hover:bg-white/70 hover:shadow-xl"
                    spotlightColor="rgba(255, 40, 0, 0.1)"
                  >
                    <div className="mb-4">
                      <GlassIconButton
                        icon={<section.icon className="h-5 w-5" />}
                        label={section.title}
                        showLabel={false}
                        tone="red"
                        className="!h-10 !w-10"
                        iconClassName="!h-5 !w-5"
                      />
                    </div>
                    <h2 className="text-lg font-bold text-[var(--pulse-black)]">{section.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--neutral-600)]">
                      {section.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            className="group/link flex items-center gap-1.5 text-sm text-[var(--neutral-600)] transition-colors hover:text-[var(--pulse-red)]"
                          >
                            {link.label}
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <SpotlightCard
                className="group rounded-2xl border border-white/60 bg-white/50 p-5 shadow-lg shadow-black/5 backdrop-blur-xl transition-all hover:border-white/80 hover:bg-white/70 hover:shadow-xl"
                spotlightColor="rgba(255, 40, 0, 0.1)"
              >
                <a
                  href="https://github.com/pulse-studio/pulse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4"
                >
                  <GlassIconButton
                    icon={<Github className="h-5 w-5" />}
                    label="GitHub"
                    showLabel={false}
                    tone="charcoal"
                    className="!h-11 !w-11"
                    iconClassName="!h-5 !w-5"
                  />
                  <div>
                    <h3 className="font-semibold text-[var(--pulse-black)]">GitHub Repository</h3>
                    <p className="text-sm text-[var(--neutral-500)]">Source code and issues</p>
                  </div>
                </a>
              </SpotlightCard>

              <SpotlightCard
                className="group rounded-2xl border border-white/60 bg-white/50 p-5 shadow-lg shadow-black/5 backdrop-blur-xl transition-all hover:border-white/80 hover:bg-white/70 hover:shadow-xl"
                spotlightColor="rgba(255, 40, 0, 0.1)"
              >
                <a href="/examples" className="flex items-center gap-4">
                  <GlassIconButton
                    icon={<FileCode className="h-5 w-5" />}
                    label="Examples"
                    showLabel={false}
                    tone="red"
                    className="!h-11 !w-11"
                    iconClassName="!h-5 !w-5"
                  />
                  <div>
                    <h3 className="font-semibold text-[var(--pulse-black)]">Examples</h3>
                    <p className="text-sm text-[var(--neutral-500)]">Sample projects and templates</p>
                  </div>
                </a>
              </SpotlightCard>
            </div>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </>
  );
}
