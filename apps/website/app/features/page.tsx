'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import {
  Blocks, Zap, Wand2, Palette, Code2, Rocket,
  Layers, Type, Image as ImageIcon, Table, Sparkles,
  Terminal, CheckCircle, ArrowRight,
  LayoutGrid, BarChart3, FileText, Video, Music, Globe,
  MessageSquare, HelpCircle, BookOpen, Clock,
} from 'lucide-react';
import Footer from '../components/Footer';
import PulseStarButton from '../components/PulseStarButton';
import SpotlightCard from '../components/SpotlightCard';
import ShinyText from '../components/ShinyText';
import StarBorder from '../components/StarBorder';
import GlassIconButton from '../components/GlassIconButton';

const featureCategories = [
  {
    id: 'blocks',
    icon: Blocks,
    title: 'Block System',
    description: 'Everything is a block. From simple paragraphs to complex interactive elements.',
    features: ['Text & Headings', 'Media & Embeds', 'Data Tables', 'Layouts & Grids'],
    large: true,
  },
  {
    id: 'commands',
    icon: Zap,
    title: 'Editor Experience',
    description: 'A fast, intuitive editing experience that stays out of your way.',
    features: ['Slash Commands', 'Drag & Drop', 'Smart Shortcuts', 'Automation'],
  },
  {
    id: 'ai',
    icon: Wand2,
    title: 'AI Integration',
    description: 'Built for AI from the ground up, not bolted on as an afterthought.',
    features: ['Block Generation', 'Text Assistance', 'Image Gen', 'Code Scaffolding'],
  },
  {
    id: 'themes',
    icon: Palette,
    title: 'Theming',
    description: 'Complete control over the look and feel of your content.',
    features: ['Dark Mode', 'Custom CSS', 'Responsive', 'Accessible'],
  },
  {
    id: 'developer',
    icon: Code2,
    title: 'Developer Experience',
    description: 'First-class TypeScript support and comprehensive APIs.',
    features: ['TypeScript', 'Plugin API', 'Version Control', 'Framework Adapters'],
  },
  {
    id: 'deployment',
    icon: Rocket,
    title: 'Production Ready',
    description: 'Built for scale with performance and security in mind.',
    features: ['SSR Support', 'XSS Protection', 'Mobile Optimized', 'Battle Tested'],
    large: true,
  },
];

const blockCategories = [
  { id: 'All', label: 'All', icon: LayoutGrid },
  { id: 'Basic', label: 'Basic', icon: FileText },
  { id: 'Media', label: 'Media', icon: Video },
  { id: 'Structured', label: 'Structured', icon: Table },
  { id: 'Interactive', label: 'Interactive', icon: BarChart3 },
  { id: 'Creative', label: 'Creative', icon: Sparkles },
] as const;

type BlockCategoryId = typeof blockCategories[number]['id'];

const blockTypes: {
  name: string;
  category: Exclude<BlockCategoryId, 'All'>;
  description: string;
  icon: React.ElementType;
}[] = [
  { name: 'Paragraph', category: 'Basic', description: 'Rich text with formatting', icon: FileText },
  { name: 'Heading', category: 'Basic', description: 'H1-H6 with anchor links', icon: Type },
  { name: 'List', category: 'Basic', description: 'Ordered and unordered', icon: BookOpen },
  { name: 'Blockquote', category: 'Basic', description: 'Styled quotations', icon: MessageSquare },
  { name: 'Code', category: 'Basic', description: 'Syntax highlighted', icon: Terminal },
  { name: 'Image', category: 'Basic', description: 'With captions and alt text', icon: ImageIcon },
  { name: 'Video', category: 'Media', description: 'Embeddable video', icon: Video },
  { name: 'Audio', category: 'Media', description: 'Audio player', icon: Music },
  { name: 'Embed', category: 'Media', description: 'External content', icon: Globe },
  { name: 'Table', category: 'Structured', description: 'Data tables', icon: Table },
  { name: 'Callout', category: 'Structured', description: 'Info boxes', icon: MessageSquare },
  { name: 'Alert', category: 'Structured', description: 'Warning notices', icon: HelpCircle },
  { name: 'Quiz', category: 'Interactive', description: 'Multiple choice', icon: HelpCircle },
  { name: 'Poll', category: 'Interactive', description: 'Voting blocks', icon: BarChart3 },
  { name: 'Survey', category: 'Interactive', description: 'Multi-question', icon: FileText },
  { name: 'Accordion', category: 'Interactive', description: 'Collapsible sections', icon: LayoutGrid },
  { name: 'Tabs', category: 'Interactive', description: 'Tabbed content', icon: Table },
  { name: 'Toggle', category: 'Interactive', description: 'Show/hide content', icon: CheckCircle },
  { name: 'Manga Panel', category: 'Creative', description: 'Comic layouts', icon: ImageIcon },
  { name: 'Speech Bubble', category: 'Creative', description: 'Dialogue blocks', icon: MessageSquare },
  { name: 'Card', category: 'Creative', description: 'Content cards', icon: Layers },
  { name: 'Gallery', category: 'Creative', description: 'Image grids', icon: ImageIcon },
  { name: 'Carousel', category: 'Creative', description: 'Sliding content', icon: Video },
  { name: 'Timeline', category: 'Creative', description: 'Event sequences', icon: Clock },
];

const categoryBadgeStyles: Record<Exclude<BlockCategoryId, 'All'>, string> = {
  Basic: 'bg-red-500/10 text-red-600',
  Media: 'bg-amber-500/10 text-amber-700',
  Structured: 'bg-purple-500/10 text-purple-600',
  Interactive: 'bg-emerald-500/10 text-emerald-600',
  Creative: 'bg-blue-500/10 text-blue-600',
};

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState<BlockCategoryId>('All');

  const filteredBlocks = activeCategory === 'All'
    ? blockTypes
    : blockTypes.filter((b) => b.category === activeCategory);

  return (
    <>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[85vh] overflow-hidden bg-gradient-to-b from-white via-[#fff9eb] to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[10%] h-[500px] w-[500px] rounded-full bg-[var(--pulse-red)]/5 blur-[120px]" />
          <div className="absolute right-[-5%] top-[20%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-jasmine)]/30 blur-[100px]" />
          <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-[var(--pulse-red)]/8 blur-[80px]" />
        </div>

        <div className="container relative flex min-h-[85vh] flex-col items-center justify-center px-4 pt-32 pb-20">
          <SpotlightCard
            className="mx-auto w-full max-w-5xl rounded-[2rem] border border-white/60 bg-white/50 p-10 shadow-2xl shadow-black/5 backdrop-blur-2xl sm:p-16"
            spotlightColor="rgba(255, 40, 0, 0.12)"
          >
            <div className="text-center">
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 inline-flex items-center rounded-full border border-[var(--neutral-200)] bg-white/70 px-4 py-1.5 text-xs font-semibold tracking-wide text-[var(--neutral-600)] backdrop-blur-sm"
              >
                The Complete Toolkit
              </motion.span>

              <h1 className="text-4xl font-bold text-[var(--pulse-black)] sm:text-5xl lg:text-6xl">
                Everything you need to create{' '}
                <ShinyText
                  text="amazing content."
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
                transition={{ delay: 0.3 }}
                className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--neutral-600)]"
              >
                Pulse combines a powerful block-based editor with modern publishing tools,
                AI assistance, and complete customization control.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <PulseStarButton href="/demo" innerClassName="px-8 py-3.5 text-base">
                  <Sparkles className="h-5 w-5" />
                  Try Interactive Demo
                </PulseStarButton>
                <StarBorder
                  as="a"
                  href="/docs"
                  className="rounded-xl"
                  innerClassName="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-[var(--pulse-black)]"
                  color="#FF2800"
                  speed="4s"
                >
                  Read the docs
                  <ArrowRight className="h-5 w-5" />
                </StarBorder>
              </motion.div>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* ─── FEATURE CATEGORIES ─── */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fff9eb_0%,#ffffff_100%)] py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-5%] top-[20%] h-[500px] w-[500px] rounded-full bg-[var(--pulse-red)]/5 blur-[140px]" />
          <div className="absolute bottom-[10%] right-[-5%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-jasmine)]/20 blur-[100px]" />
        </div>

        <div className="container relative">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--pulse-red)]"
            >
              Feature Categories
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-[var(--pulse-black)] sm:text-4xl lg:text-5xl"
            >
              Six pillars. One platform.
            </motion.h2>
          </div>

          <div className="grid auto-rows-[minmax(240px,auto)] gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureCategories.map((category, i) => (
              <motion.div
                key={category.id}
                id={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={category.large ? 'sm:col-span-2 lg:col-span-1' : ''}
              >
                <SpotlightCard
                  className="h-full rounded-2xl border border-white/60 bg-white/60 p-8 shadow-lg shadow-black/5 backdrop-blur-xl transition-all hover:border-white/80 hover:bg-white/75 hover:shadow-xl"
                  spotlightColor="rgba(255, 40, 0, 0.15)"
                >
                  <div className="flex h-full flex-col">
                    <div className="mb-5">
                      <GlassIconButton
                        icon={<category.icon className="h-6 w-6" />}
                        label={category.title}
                        showLabel={false}
                        tone="red"
                        className="!h-12 !w-12"
                        iconClassName="!h-6 !w-6"
                      />
                    </div>

                    <h3 className="text-xl font-bold text-[var(--pulse-black)]">{category.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--neutral-600)]">
                      {category.description}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      {category.features.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full border border-[var(--neutral-200)] bg-white/70 px-3 py-1 text-xs font-medium text-[var(--neutral-700)] backdrop-blur-sm"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BLOCK SHOWCASE ─── */}
      <section className="relative overflow-hidden bg-white py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-10%] top-[10%] h-[500px] w-[500px] rounded-full bg-[var(--pulse-red)]/5 blur-[140px]" />
          <div className="absolute bottom-[5%] left-[-5%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-jasmine)]/20 blur-[100px]" />
        </div>

        <div className="container relative">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--pulse-red)]"
            >
              Block Library
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-[var(--pulse-black)] sm:text-4xl lg:text-5xl"
            >
              30+ blocks. Zero limits.
            </motion.h2>
          </div>

          {/* Glass icon category filters */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mb-12 flex flex-wrap items-center justify-center gap-3"
          >
            {blockCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'border-[var(--pulse-red)]/30 bg-[var(--pulse-red)]/10 text-[var(--pulse-red)]'
                    : 'border-[var(--neutral-200)] bg-white/80 text-[var(--neutral-700)] backdrop-blur-sm hover:border-[var(--pulse-red)]/20 hover:bg-white'
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* Block grid with spotlight */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredBlocks.map((block, i) => (
                <motion.div
                  key={block.name}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 10 }}
                  transition={{ duration: 0.25, delay: i * 0.02 }}
                >
                  <SpotlightCard
                    className="group h-full rounded-2xl border border-white/60 bg-white/50 p-5 shadow-md shadow-black/5 backdrop-blur-xl transition-all hover:border-white/80 hover:bg-white/70 hover:shadow-lg"
                    spotlightColor="rgba(255, 40, 0, 0.12)"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${categoryBadgeStyles[block.category]}`}>
                        <block.icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full border border-[var(--neutral-200)] bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--neutral-600)] backdrop-blur-sm">
                        {block.category}
                      </span>
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-[var(--pulse-black)]">{block.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--neutral-500)]">{block.description}</p>
                  </SpotlightCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#fff9eb_100%)] py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[var(--pulse-red)]/5 blur-[120px]" />
        </div>

        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-[var(--pulse-black)] sm:text-4xl lg:text-5xl"
            >
              Ready to experience Pulse?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-4 max-w-xl text-base text-[var(--neutral-600)]"
            >
              Try the interactive demo and see the block editor in action.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <PulseStarButton href="/demo" innerClassName="px-8 py-3.5 text-base">
                <Sparkles className="h-5 w-5" />
                Try Interactive Demo
              </PulseStarButton>
              <StarBorder
                as="a"
                href="/docs"
                className="rounded-xl"
                innerClassName="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-[var(--pulse-black)]"
                color="#FF2800"
                speed="4s"
              >
                Read the docs
                <ArrowRight className="h-5 w-5" />
              </StarBorder>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
