'use client';

interface RotatingTextProps {
  texts: string[];
  interval?: number;
  className?: string;
}

export default function RotatingText({ texts, className = '' }: RotatingTextProps) {
  return <span className={className}>{texts[0]}</span>;
}
