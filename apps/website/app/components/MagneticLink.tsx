'use client';

import Link from 'next/link';
import { type MouseEvent, type ReactNode, useState } from 'react';

interface MagneticLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function isReducedMotionPreferred() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function MagneticLink({
  href,
  className,
  children,
  onClick,
}: MagneticLinkProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isReducedMotionPreferred()) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 16;
    setOffset({ x, y });
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className={cx(
        'relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full border border-[var(--pulse-red)]/20 px-5 text-sm font-semibold text-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-offset-4',
        className,
      )}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_58%),linear-gradient(135deg,var(--pulse-red-light),var(--pulse-red)_60%,#a91b00)]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-[1px] rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))]"
      />
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </Link>
  );
}
