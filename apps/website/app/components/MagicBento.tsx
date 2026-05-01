'use client';

import { useRef, useCallback, useState } from 'react';
import { Wand2, Command, MousePointerClick, LayoutTemplate, GitBranch, Sparkles } from 'lucide-react';
import Image from 'next/image';
import styles from './MagicBento.module.css';

const features = [
  {
    icon: Wand2,
    label: 'AI Powered',
    title: 'Describe it, AI builds it',
    description: 'Type what you want in plain English. AI generates the interactive block.',
    color: 'var(--pulse-red)',
    size: 'large',
    hasImage: true,
    imagePath: '/images/ai-generation.png',
  },
  {
    icon: Command,
    label: 'Slash Commands',
    title: '/quiz, /demo, /anything',
    description: 'Hit / and create. Instant access to 40+ interactive block types.',
    color: 'var(--pulse-jasmine)',
    size: 'small',
  },
  {
    icon: MousePointerClick,
    label: 'Interactive',
    title: 'Readers click, not scroll',
    description: 'Quizzes, polls, and embeds that turn passive readers into participants.',
    color: 'var(--pulse-red-light)',
    size: 'small',
  },
  {
    icon: LayoutTemplate,
    label: 'Manga Panels',
    title: 'Visual storytelling',
    description: 'Comic-style layouts for tutorials, stories, and product showcases. No other platform has this.',
    color: 'var(--pulse-jasmine)',
    size: 'large',
    hasVisual: true,
  },
  {
    icon: GitBranch,
    label: 'Branching',
    title: 'Stories with paths',
    description: 'Choose-your-own-adventure content. Personalize the reader journey.',
    color: 'var(--pulse-red)',
    size: 'small',
  },
  {
    icon: Sparkles,
    label: 'Animations',
    title: 'Content that moves',
    description: 'Scroll-triggered animations that reveal your story as readers progress.',
    color: 'var(--pulse-jasmine)',
    size: 'small',
  },
];

interface CardProps {
  feature: typeof features[0];
  index: number;
}

function BentoCard({ feature, index }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const Icon = feature.icon;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${styles[feature.size]} ${feature.hasImage ? styles.hasImage : ''} ${feature.hasVisual ? styles.hasVisual : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        '--glow-x': `${mousePosition.x}px`,
        '--glow-y': `${mousePosition.y}px`,
        '--glow-color': feature.color,
        animationDelay: `${index * 100}ms`,
      } as React.CSSProperties}
    >
      <div className={`${styles.glow} ${isHovered ? styles.glowActive : ''}`} />
      <div className={styles.borderGlow} />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.label}>{feature.label}</span>
          <div className={styles.iconWrapper}>
            <Icon className={styles.icon} />
          </div>
        </div>
        
        <div className={styles.body}>
          <h3 className={styles.title}>{feature.title}</h3>
          <p className={styles.description}>{feature.description}</p>
        </div>

        {feature.hasImage && (
          <div className={styles.imageContainer}>
            <div className={styles.imageWrapper}>
              <Image
                src={feature.imagePath}
                alt={feature.title}
                fill
                className={styles.image}
              />
              <div className={styles.imageBlur} />
            </div>
          </div>
        )}

        {feature.hasVisual && (
          <div className={styles.mangaPreview}>
            <div className={styles.mangaPanel}>
              <div className={styles.speechBubble}>Tap to continue</div>
              <div className={styles.mangaCharacter} />
            </div>
            <div className={styles.mangaGrid}>
              <div className={styles.mangaCell} />
              <div className={styles.mangaCell} />
              <div className={styles.mangaCell} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MagicBento() {
  return (
    <div className={styles.grid}>
      {features.map((feature, index) => (
        <BentoCard key={feature.title} feature={feature} index={index} />
      ))}
    </div>
  );
}
