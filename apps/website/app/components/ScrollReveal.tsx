'use client';

import { useRef, useMemo } from 'react';
import { motion, useInView } from 'motion/react';
import './ScrollReveal.css';

interface ScrollRevealProps {
  children: string;
  className?: string;
  textClassName?: string;
  baseOpacity?: number;
  blurStrength?: number;
  staggerDelay?: number;
  once?: boolean;
}

const ScrollReveal = ({
  children,
  className = '',
  textClassName = '',
  baseOpacity = 0.1,
  blurStrength = 4,
  staggerDelay = 0.05,
  once = true
}: ScrollRevealProps) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const isInView = useInView(containerRef, { once, margin: '-20% 0px' });

  const words = useMemo(() => {
    return children.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return { word, key: `space-${index}` };
      return { word, key: `word-${index}` };
    });
  }, [children]);

  return (
    <h2 ref={containerRef} className={`scroll-reveal ${className}`}>
      <span className={`scroll-reveal-text ${textClassName}`}>
        {words.map(({ word, key }, index) => {
          if (word.match(/^\s+$/)) {
            return word;
          }
          return (
            <motion.span
              key={key}
              className="word"
              initial={{ opacity: baseOpacity, filter: `blur(${blurStrength}px)`, y: 10 }}
              animate={
                isInView
                  ? { opacity: 1, filter: 'blur(0px)', y: 0 }
                  : { opacity: baseOpacity, filter: `blur(${blurStrength}px)`, y: 10 }
              }
              transition={{
                duration: 0.6,
                delay: index * staggerDelay,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              {word}
            </motion.span>
          );
        })}
      </span>
    </h2>
  );
};

export default ScrollReveal;
