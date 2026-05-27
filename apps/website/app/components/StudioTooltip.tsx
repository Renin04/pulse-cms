'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

interface StudioTooltipProps {
  children: ReactNode;
  text: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function StudioTooltip({ children, text, side = 'top', delay = 350 }: StudioTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  const handleEnter = () => {
    timerRef.current = setTimeout(() => {
      setMounted(true);
      // small delay to allow mount before triggering animation
      requestAnimationFrame(() => setVisible(true));
    }, delay);
  };

  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    // unmount after transition
    setTimeout(() => setMounted(false), 200);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--pulse-black)]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--pulse-black)]',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--pulse-black)]',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--pulse-black)]',
  };

  const arrowBorders = {
    top: 'border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px]',
    bottom: 'border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[4px]',
    left: 'border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[4px]',
    right: 'border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[4px]',
  };

  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      {mounted && (
        <span
          className={`pointer-events-none absolute z-[9999] whitespace-nowrap rounded-lg bg-[var(--pulse-black)] px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg ${sideClasses[side]} transition-all duration-200 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
          role="tooltip"
        >
          <span className="relative z-10 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--pulse-red)]" />
            {text}
          </span>
          <span
            className={`absolute h-0 w-0 ${arrowClasses[side]} ${arrowBorders[side]}`}
          />
        </span>
      )}
    </span>
  );
}
