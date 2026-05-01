'use client';

import { useEffect, useMemo, useState } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+*#';

interface DecryptedTextProps {
  text: string;
  className?: string;
}

export default function DecryptedText({ text, className }: DecryptedTextProps) {
  const [frame, setFrame] = useState(0);

  const revealed = useMemo(() => {
    return text
      .split('')
      .map((char, index) => {
        if (char === ' ') return ' ';
        if (index < frame) return char;
        return GLYPHS[(frame + index) % GLYPHS.length];
      })
      .join('');
  }, [frame, text]);

  useEffect(() => {
    setFrame(0);

    const timer = window.setInterval(() => {
      setFrame((current) => {
        if (current >= text.length) {
          window.clearInterval(timer);
          return current;
        }

        return current + 1;
      });
    }, 32);

    return () => window.clearInterval(timer);
  }, [text]);

  return (
    <span className={className} aria-label={text}>
      {revealed}
    </span>
  );
}
