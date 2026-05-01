'use client';

import { useRef, useState } from 'react';

const blockTypes = [
  { command: '/quiz',      label: 'Interactive Quiz',       emoji: '🎯', color: '#FF2800', desc: 'Inline assessments with instant feedback' },
  { command: '/demo',      label: 'Live Code Playground',   emoji: '⚡', color: '#FFE695', desc: 'Real JS execution in the browser' },
  { command: '/manga',     label: 'Manga Panels',           emoji: '🎨', color: '#FF2800', desc: 'Comic-style visual storytelling' },
  { command: '/branch',    label: 'Branching Story',        emoji: '🌿', color: '#FFE695', desc: 'Choose-your-adventure paths' },
  { command: '/poll',      label: 'Reader Poll',            emoji: '📊', color: '#FF2800', desc: 'Live voting with real-time results' },
  { command: '/timeline',  label: 'Timeline',               emoji: '🕒', color: '#FFE695', desc: 'Scroll-based narrative sequences' },
  { command: '/ai',        label: 'AI Block Builder',       emoji: '✨', color: '#FF2800', desc: 'Describe it, AI builds it' },
  { command: '/animate',   label: 'Scroll Animation',       emoji: '🎬', color: '#FFE695', desc: 'Reveal content as readers scroll' },
  { command: '/flashcard', label: 'Flashcards',             emoji: '🃏', color: '#FF2800', desc: 'Spaced repetition learning blocks' },
  { command: '/chart',     label: 'Interactive Chart',      emoji: '📈', color: '#FFE695', desc: 'Filterable, explorable data viz' },
  { command: '/speech',    label: 'Speech Bubble',          emoji: '💬', color: '#FF2800', desc: 'Character dialogue layouts' },
  { command: '/callout',   label: 'Callout Block',          emoji: '📣', color: '#FFE695', desc: 'Highlight key insights visually' },
];

const doubled = [...blockTypes, ...blockTypes];

interface BlockCardProps {
  item: typeof blockTypes[0];
  onHover: (item: typeof blockTypes[0] | null) => void;
}

function BlockCard({ item, onHover }: BlockCardProps) {
  return (
    <div
      className="marquee-card"
      onMouseEnter={() => onHover(item)}
      onMouseLeave={() => onHover(null)}
      style={{ '--accent': item.color } as React.CSSProperties}
    >
      <div className="marquee-card-emoji">{item.emoji}</div>
      <div className="marquee-card-command">{item.command}</div>
      <div className="marquee-card-label">{item.label}</div>
    </div>
  );
}

export default function BlockTypeShowcase() {
  const [hoveredItem, setHoveredItem] = useState<typeof blockTypes[0] | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div
        className="marquee-track-outer py-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div ref={trackRef} className={`marquee-track${isPaused ? ' paused' : ''}`}>
          {doubled.map((item, i) => (
            <BlockCard key={`${item.command}-${i}`} item={item} onHover={setHoveredItem} />
          ))}
        </div>
      </div>

      <div className="tooltip-bar mt-2">
        <p className={`tooltip-text${hoveredItem ? ' active' : ''}`}>
          {hoveredItem ? hoveredItem.desc : 'Hover any block to learn more · Pause to explore'}
        </p>
      </div>
    </div>
  );
}
