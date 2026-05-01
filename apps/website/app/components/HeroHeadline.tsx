'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './HeroHeadline.module.css';

const TEXTS = ['Stories', 'Experiences', 'Products', 'Courses', 'Systems'];
const INTERVAL = 2500;
const EXIT_MS = 320;
const ENTER_MS = 420;

type Phase = 'idle' | 'exit' | 'enter';

interface HeroHeadlineProps {
  className?: string;
}

export default function HeroHeadline({ className = '' }: HeroHeadlineProps) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [wordWidth, setWordWidth] = useState<number>(0);
  const [widths, setWidths] = useState<number[]>([]);
  const nextIndex = useRef(0);
  const measureRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const nextWidths = TEXTS.map((_, itemIndex) => measureRefs.current[itemIndex]?.offsetWidth ?? 0);
    setWidths(nextWidths);
    if (nextWidths[0]) {
      setWordWidth(nextWidths[0]);
    }
  }, [mounted]);

  // Rotation timer
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      nextIndex.current = (index + 1) % TEXTS.length;
      if (widths[nextIndex.current]) {
        setWordWidth(widths[nextIndex.current]);
      }
      setPhase('exit');
    }, INTERVAL);
    return () => clearInterval(id);
  }, [index, mounted, widths]);

  // State machine: exit → swap → enter → idle
  useEffect(() => {
    if (!mounted) return;
    if (phase === 'exit') {
      const t = setTimeout(() => {
        setIndex(nextIndex.current);
        setPhase('enter');
      }, EXIT_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'enter') {
      const t = setTimeout(() => setPhase('idle'), ENTER_MS);
      return () => clearTimeout(t);
    }
  }, [mounted, phase]);

  if (!mounted) {
    return (
      <h1 className={`${styles.headline} ${className}`}>
        <span className={styles.staticWord}>Stories</span>
        <span className={styles.suffix}>are next.</span>
      </h1>
    );
  }

  const wordClass = `${styles.word} ${
    phase === 'exit' ? styles.exit :
    phase === 'enter' ? styles.enter :
    styles.idle
  }`;

  return (
    <h1 className={`${styles.headline} ${className}`}>
      <span className={styles.measureRack} aria-hidden="true">
        {TEXTS.map((text, itemIndex) => (
          <span
            key={text}
            ref={(element) => {
              measureRefs.current[itemIndex] = element;
            }}
            className={styles.measurer}
          >
            {text}
          </span>
        ))}
      </span>

      <span
        className={styles.wordBox}
        style={{ width: wordWidth > 0 ? wordWidth : undefined }}
      >
        <span className={styles.wordViewport}>
          <span className={wordClass}>{TEXTS[index]}</span>
        </span>
      </span>

      <span
        className={`${styles.suffix} ${
          phase === 'exit' ? styles.suffixExit : phase === 'enter' ? styles.suffixEnter : ''
        }`}
      >
        are next.
      </span>
    </h1>
  );
}
