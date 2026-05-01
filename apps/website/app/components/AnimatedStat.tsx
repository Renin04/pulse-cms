'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedStatProps {
  target: string;
  label: string;
  delay?: number;
}

function parseTarget(target: string): { prefix: string; number: number; suffix: string } {
  const match = target.match(/^([^0-9]*)([0-9]+)([^0-9]*)$/);
  if (!match) return { prefix: '', number: 0, suffix: target };
  return { prefix: match[1], number: parseInt(match[2], 10), suffix: match[3] };
}

export default function AnimatedStat({ target, label, delay = 0 }: AnimatedStatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const { prefix, number, suffix } = parseTarget(target);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const timer = setTimeout(() => {
      const duration = 1400;
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * number));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [started, number, delay]);

  return (
    <div
      ref={ref}
      className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all duration-500 hover:border-[var(--pulse-jasmine)]/40 hover:bg-white/8"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--pulse-jasmine)]/0 to-[var(--pulse-jasmine)]/0 transition-all duration-500 group-hover:from-[var(--pulse-jasmine)]/5 group-hover:to-transparent" />
      <div className="text-4xl font-bold text-[var(--pulse-jasmine)] tabular-nums">
        {prefix}{value}{suffix}
      </div>
      <div className="mt-2 text-sm text-white/60">{label}</div>
    </div>
  );
}
