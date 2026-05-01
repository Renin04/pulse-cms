'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  BarChart3,
  GitBranch,
  LayoutGrid,
  Terminal,
  Layers,
  Clock,
  Sparkles,
  Command,
  PieChart,
  ArrowLeftRight,
  ChevronsUpDown,
} from 'lucide-react';
import ReactBitsInfiniteMenu, { type InfiniteMenuRef } from './ReactBitsInfiniteMenu';
import {
  QuizDemo,
  PollDemo,
  BranchDemo,
  MangaDemo,
  CodePlaygroundDemo,
  FlashcardDemo,
  TimelineDemo,
  AiBuilderDemo,
  SlashCommandsDemo,
  ChartDemo,
  BeforeAfterDemo,
  AccordionDemo,
} from './FeatureDemos';

const features = [
  {
    id: 'quiz',
    icon: HelpCircle,
    title: 'Quiz',
    command: '/quiz',
    desc: 'Inline assessments with instant feedback',
    color: '#FF2800',
    demo: QuizDemo,
  },
  {
    id: 'poll',
    icon: BarChart3,
    title: 'Poll',
    command: '/poll',
    desc: 'Live voting with real-time results',
    color: '#FFE695',
    demo: PollDemo,
  },
  {
    id: 'branch',
    icon: GitBranch,
    title: 'Branch',
    command: '/branch',
    desc: 'Choose-your-adventure content paths',
    color: '#FF2800',
    demo: BranchDemo,
  },
  {
    id: 'manga',
    icon: LayoutGrid,
    title: 'Manga',
    command: '/manga',
    desc: 'Comic-style visual storytelling',
    color: '#FFE695',
    demo: MangaDemo,
  },
  {
    id: 'code',
    icon: Terminal,
    title: 'Code',
    command: '/demo',
    desc: 'Real JS execution in the browser',
    color: '#FF2800',
    demo: CodePlaygroundDemo,
  },
  {
    id: 'flashcard',
    icon: Layers,
    title: 'Flashcard',
    command: '/flashcard',
    desc: 'Spaced repetition learning blocks',
    color: '#FFE695',
    demo: FlashcardDemo,
  },
  {
    id: 'timeline',
    icon: Clock,
    title: 'Timeline',
    command: '/timeline',
    desc: 'Scroll-based narrative sequences',
    color: '#FF2800',
    demo: TimelineDemo,
  },
  {
    id: 'ai',
    icon: Sparkles,
    title: 'AI',
    command: '/ai',
    desc: 'Describe it, AI builds it',
    color: '#FFE695',
    demo: AiBuilderDemo,
  },
  {
    id: 'slash',
    icon: Command,
    title: 'Slash',
    command: '/',
    desc: 'Instant block creation via commands',
    color: '#FF2800',
    demo: SlashCommandsDemo,
  },
  {
    id: 'chart',
    icon: PieChart,
    title: 'Chart',
    command: '/chart',
    desc: 'Filterable, explorable data viz',
    color: '#FFE695',
    demo: ChartDemo,
  },
  {
    id: 'beforeafter',
    icon: ArrowLeftRight,
    title: 'Compare',
    command: '/compare',
    desc: 'Slide to reveal visual changes',
    color: '#FF2800',
    demo: BeforeAfterDemo,
  },
  {
    id: 'accordion',
    icon: ChevronsUpDown,
    title: 'Accordion',
    command: '/accordion',
    desc: 'Collapsible content sections',
    color: '#FFE695',
    demo: AccordionDemo,
  },
];

async function generateMenuImages(feats: typeof features) {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const images: string[] = [];

  for (const feature of feats) {
    const bg = feature.color;
    const isRed = bg === '#FF2800';
    const fg = isRed ? '#ffffff' : '#373737';

    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 40);
    ctx.fill();

    const IconEl = feature.icon;
    const svgString = renderToStaticMarkup(
      <IconEl size={180} color={fg} strokeWidth={1.5} />
    );
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    const img = new Image();
    img.src = svgUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
    });
    ctx.drawImage(img, size / 2 - 90, size / 3 - 90, 180, 180);

    ctx.fillStyle = fg;
    ctx.font = 'bold 56px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(feature.title, size / 2, size / 2 + 90);

    ctx.font = 'bold 34px ui-monospace, monospace';
    ctx.fillText(feature.command, size / 2, size / 2 + 170);

    images.push(canvas.toDataURL('image/png'));
  }

  return images;
}

export default function FeaturePlayground() {
  const [activeId, setActiveId] = useState<string>('quiz');
  const [images, setImages] = useState<string[] | null>(null);
  const [menuTitle, setMenuTitle] = useState<string>('Quiz');
  const menuRef = useRef<InfiniteMenuRef>(null);

  const menuItems = useMemo(() => {
    if (!images) return [];
    return features.map((f, i) => ({
      image: images[i] || '',
      link: '#',
      title: f.title,
      description: f.desc,
      id: f.id,
    }));
  }, [images]);

  useEffect(() => {
    let cancelled = false;
    generateMenuImages(features).then((imgs) => {
      if (!cancelled) setImages(imgs);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFeature = features.find((f) => f.id === activeId) || features[0];
  const DemoComponent = activeFeature.demo;

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fff9eb_0%,#ffffff_100%)] py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[var(--pulse-red)]/5 blur-[100px]" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="pulse-kicker mb-3"
          >
            The Block Universe
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl font-bold text-[var(--pulse-black)] sm:text-4xl lg:text-5xl"
          >
            40+ interactive blocks.
            <br />
            <span className="text-[var(--pulse-red)]">One command away.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-base text-[var(--neutral-600)] sm:text-lg"
          >
            Drag the sphere to explore. Release to snap to a block.
          </motion.p>
        </div>

        {/* 3D Infinite Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative mx-auto mt-6 h-[18rem] w-full max-w-4xl sm:h-[22rem] lg:h-[26rem]"
        >
          {images ? (
            <ReactBitsInfiniteMenu
              ref={menuRef}
              items={menuItems}
              scale={0.85}
              onActiveItemChange={(item) => {
                if (item?.id) {
                  setActiveId(item.id);
                  if (item.title) setMenuTitle(item.title);
                }
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-[2rem] border border-white/80 bg-white/50 backdrop-blur-xl">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--pulse-red)]" />
            </div>
          )}
        </motion.div>

        {/* Active block pill */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto -mt-4 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--neutral-200)] bg-white/90 px-4 py-2 text-sm font-semibold text-[var(--pulse-black)] shadow-sm backdrop-blur">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: activeFeature.color }}
            />
            {menuTitle}
            <span className="text-[var(--neutral-500)]">· {activeFeature.command}</span>
          </div>
        </motion.div>

        {/* Demo Stage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto mt-6 max-w-3xl"
        >
          <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5">
            {features.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  const idx = features.findIndex((x) => x.id === f.id);
                  setActiveId(f.id);
                  setMenuTitle(f.title);
                  menuRef.current?.rotateToItem(idx >= 0 ? idx : 0);
                }}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  activeId === f.id
                    ? 'bg-[var(--pulse-black)] text-white'
                    : 'bg-white text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]'
                }`}
              >
                {f.title}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <DemoComponent />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
