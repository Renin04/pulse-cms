'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './GlitchText.module.css';

interface GlitchTextProps {
  text: string;
  className?: string;
}

const chars = '!<>-_\\/[]{}—=+*^?#________';

export default function GlitchText({ text, className = '' }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const burstRef = useRef<'main' | 'echo'>('main');

  useEffect(() => {
    let cancelled = false;

    const scheduleNext = (delay: number) => {
      timeoutRef.current = window.setTimeout(runGlitch, delay);
    };

    const runGlitch = () => {
      if (cancelled) return;
      setIsGlitching(true);
      let iteration = 0;
      const isEcho = burstRef.current === 'echo';
      const maxIterations = isEcho ? text.length + 0.4 : text.length + 1.4;
      const step = isEcho ? 0.52 : 0.34;
      const tickDelay = isEcho ? 36 : 48;

      const tick = () => {
        if (cancelled) return;
        setDisplayText(
          text
            .split('')
            .map((char, index) => {
              if (index < iteration) {
                return text[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );

        iteration += step;

        if (iteration >= maxIterations) {
          setDisplayText(text);
          timeoutRef.current = window.setTimeout(() => {
            if (cancelled) return;
            setIsGlitching(false);
            if (!isEcho) {
              burstRef.current = 'echo';
              scheduleNext(220);
              return;
            }
            burstRef.current = 'main';
            scheduleNext(2800 + Math.random() * 900);
          }, 120);
          return;
        }
        frameRef.current = window.setTimeout(tick, tickDelay);
      };

      tick();
    };

    scheduleNext(2100);

    return () => {
      cancelled = true;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      if (frameRef.current !== null) {
        window.clearTimeout(frameRef.current);
      }
    };
  }, [text]);

  return (
    <span
      className={`${styles.glitch} ${isGlitching ? styles.animating : ''} ${className}`}
      data-text={displayText}
    >
      {displayText}
    </span>
  );
}
