'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollRevealTextProps {
  text: string;
  className?: string;
  baseOpacity?: number;
}

export default function ScrollRevealText({
  text,
  className = '',
  baseOpacity = 0.08,
}: ScrollRevealTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const start = windowH * 0.85;
      const end = windowH * 0.1;
      const raw = (start - rect.top) / (start - end);
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const words = text.split(/(\s+)/);

  return (
    <p ref={containerRef} className={className} aria-label={text}>
      {words.map((word, i) => {
        if (/^\s+$/.test(word)) return word;
        const wordIndex = words.slice(0, i).filter(w => !/^\s+$/.test(w)).length;
        const totalWords = words.filter(w => !/^\s+$/.test(w)).length;
        const wordThreshold = wordIndex / totalWords;
        const wordProgress = Math.min(1, Math.max(0, (progress - wordThreshold * 0.4) / 0.6));
        const opacity = baseOpacity + wordProgress * (1 - baseOpacity);
        return (
          <span
            key={i}
            style={{
              opacity,
              filter: `blur(${(1 - wordProgress) * 6}px)`,
              transition: 'none',
              display: 'inline',
            }}
          >
            {word}
          </span>
        );
      })}
    </p>
  );
}
