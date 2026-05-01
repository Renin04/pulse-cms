'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface FlowingMenuItem {
  text: string;
  href: string;
  emoji?: string;
}

interface FlowingMenuNavProps {
  items: FlowingMenuItem[];
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
}

function distMetric(x: number, y: number, x2: number, y2: number) {
  return (x - x2) ** 2 + (y - y2) ** 2;
}

function findClosestEdge(mouseX: number, mouseY: number, width: number, height: number): 'top' | 'bottom' {
  return distMetric(mouseX, mouseY, width / 2, 0) < distMetric(mouseX, mouseY, width / 2, height)
    ? 'top'
    : 'bottom';
}

interface MenuItemProps extends FlowingMenuItem {
  speed: number;
  textColor: string;
  marqueeBgColor: string;
  marqueeTextColor: string;
  borderColor: string;
}

function MenuItem({ text, href, emoji, speed, textColor, marqueeBgColor, marqueeTextColor, borderColor }: MenuItemProps) {
  const itemRef = useRef<HTMLLIElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const marqueeContent = Array.from({ length: 6 }, (_, i) => (
    <span key={i} style={{ color: marqueeTextColor, padding: '0 1.5vw' }}>
      {emoji && <span style={{ marginRight: '0.5em' }}>{emoji}</span>}
      {text}
      <span style={{ margin: '0 1.5vw', opacity: 0.4 }}>—</span>
    </span>
  ));

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const el = itemRef.current;
    const marquee = marqueeRef.current;
    const inner = marqueeInnerRef.current;
    if (!el || !marquee || !inner) return;

    const rect = el.getBoundingClientRect();
    const edge = findClosestEdge(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);

    marquee.style.transition = 'none';
    marquee.style.transform = edge === 'top' ? 'translate3d(0,-101%,0)' : 'translate3d(0,101%,0)';

    requestAnimationFrame(() => {
      marquee.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
      marquee.style.transform = 'translate3d(0,0%,0)';
    });

    inner.style.animation = `marqueeRun ${speed}s linear infinite`;
    setIsHovered(true);
  }, [speed]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const el = itemRef.current;
    const marquee = marqueeRef.current;
    const inner = marqueeInnerRef.current;
    if (!el || !marquee || !inner) return;

    const rect = el.getBoundingClientRect();
    const edge = findClosestEdge(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);

    marquee.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
    marquee.style.transform = edge === 'top' ? 'translate3d(0,-101%,0)' : 'translate3d(0,101%,0)';
    inner.style.animation = 'none';
    setIsHovered(false);
  }, []);

  return (
    <li
      ref={itemRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        borderTop: `1px solid ${borderColor}`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={href}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          fontWeight: 700,
          fontSize: 'clamp(1.5rem, 4vw, 3.5rem)',
          color: isHovered ? 'transparent' : textColor,
          transition: 'color 0.2s ease',
          padding: '1.25rem 2rem',
          zIndex: 1,
        }}
      >
        {emoji && <span style={{ marginRight: '0.5em', fontSize: '0.8em' }}>{emoji}</span>}
        {text}
      </Link>

      <div
        ref={marqueeRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          pointerEvents: 'none',
          transform: 'translate3d(0,101%,0)',
          backgroundColor: marqueeBgColor,
        }}
      >
        <div
          ref={marqueeInnerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            width: 'max-content',
          }}
        >
          {marqueeContent}
          {marqueeContent}
        </div>
      </div>
    </li>
  );
}

export default function FlowingMenuNav({
  items,
  speed = 12,
  textColor = '#fff',
  bgColor = '#0d0d0e',
  marqueeBgColor = '#FF2800',
  marqueeTextColor = '#fff',
  borderColor = 'rgba(255,255,255,0.1)',
}: FlowingMenuNavProps) {
  return (
    <div style={{ width: '100%', overflow: 'hidden', backgroundColor: bgColor }}>
      <nav>
        <ul style={{ display: 'flex', flexDirection: 'column', listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((item, i) => (
            <MenuItem
              key={i}
              {...item}
              speed={speed}
              textColor={textColor}
              marqueeBgColor={marqueeBgColor}
              marqueeTextColor={marqueeTextColor}
              borderColor={i === 0 ? 'transparent' : borderColor}
            />
          ))}
        </ul>
      </nav>
    </div>
  );
}
