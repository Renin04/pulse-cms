'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, GraduationCap, PenTool, TrendingUp, Quote } from 'lucide-react';
import Dock from './Dock';
import styles from './TestimonialDock.module.css';

const personas = [
  {
    id: 'developer',
    label: 'Developer',
    icon: <Code className="w-6 h-6" />,
    name: 'Alex Chen',
    role: 'Developer Advocate',
    quote:
      'Pulse turned our API docs into an interactive playground. Our dev community engagement went up 3x.',
    color: '#60a5fa',
  },
  {
    id: 'educator',
    label: 'Educator',
    icon: <GraduationCap className="w-6 h-6" />,
    name: 'Dr. Sarah Miller',
    role: 'Course Creator',
    quote:
      'I built an entire course inside Pulse. Students actually finish the lessons now because they are part of the story.',
    color: '#fbbf24',
  },
  {
    id: 'strategist',
    label: 'Strategist',
    icon: <PenTool className="w-6 h-6" />,
    name: 'Marcus Johnson',
    role: 'Content Strategist',
    quote:
      'Finally, a publishing tool that respects the reader\'s time. Branching content is a game changer.',
    color: '#a78bfa',
  },
  {
    id: 'marketer',
    label: 'Marketer',
    icon: <TrendingUp className="w-6 h-6" />,
    name: 'Emily Rodriguez',
    role: 'Product Marketer',
    quote:
      'Our product launches went from static press releases to immersive experiences. The difference is night and day.',
    color: '#f87171',
  },
];

export default function TestimonialDock() {
  const [activeId, setActiveId] = useState<string>(personas[0].id);
  const active = personas.find((p) => p.id === activeId) || personas[0];

  const dockItems = personas.map((p) => ({
    icon: p.icon,
    label: p.label,
    onClick: () => setActiveId(p.id),
    className: p.id === activeId ? styles.activeItem : '',
  }));

  return (
    <section className={styles.section}>
      <div className="container relative">
        <p className={styles.kicker}>Real Results</p>
        <h2 className={styles.headline}>Rebels who switched</h2>

        <div className={styles.stage}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              className={styles.card}
              style={{ '--accent': active.color } as React.CSSProperties}
            >
              <Quote className={styles.quoteIcon} />
              <p className={styles.quoteText}>{active.quote}</p>
              <div className={styles.meta}>
                <div
                  className={styles.avatar}
                  style={{ backgroundColor: active.color }}
                >
                  {active.icon}
                </div>
                <div>
                  <div className={styles.name}>{active.name}</div>
                  <div className={styles.role}>{active.role}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className={styles.dockWrap}>
            <Dock
              items={dockItems}
              magnification={64}
              distance={140}
              panelHeight={60}
              baseItemSize={44}
              className={styles.dockPanel}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
