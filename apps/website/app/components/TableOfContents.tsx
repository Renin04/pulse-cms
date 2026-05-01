'use client';

import { useEffect, useRef, useState } from 'react';
import { List } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  variant?: 'inline' | 'sticky';
  revealOnScroll?: boolean;
}

export default function TableOfContents({
  variant = 'inline',
  revealOnScroll = false,
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isMounted, setIsMounted] = useState(!revealOnScroll);
  const [isVisible, setIsVisible] = useState(!revealOnScroll);
  const revealAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Extract headings from the article
    const article = document.querySelector('.studio-rendered');
    if (!article) return;

    const headingElements = Array.from(article.querySelectorAll<HTMLElement>('h2, h3'));
    const headingData: Heading[] = headingElements.map((heading) => {
      const generatedId = heading.id || heading.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `heading-${Math.random().toString(36).substr(2, 9)}`;
      // Ensure the heading element has an ID for scrolling
      if (!heading.id) {
        heading.id = generatedId;
      }
      return {
        id: generatedId,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1)),
      };
    });

    setHeadings(headingData);

    const getActiveHeadingId = () => {
      const offset = 156;
      let nextActiveId = headingData[0]?.id ?? '';

      for (const heading of headingElements) {
        const top = heading.getBoundingClientRect().top;
        if (top - offset <= 0) {
          nextActiveId = heading.id;
        } else {
          break;
        }
      }

      setActiveId(nextActiveId);
    };

    getActiveHeadingId();
    window.addEventListener('scroll', getActiveHeadingId, { passive: true });
    window.addEventListener('resize', getActiveHeadingId);

    return () => {
      window.removeEventListener('scroll', getActiveHeadingId);
      window.removeEventListener('resize', getActiveHeadingId);
    };
  }, []);

  useEffect(() => {
    if (!revealOnScroll || headings.length === 0) return;

    const anchor = revealAnchorRef.current;
    if (!anchor) return;

    let frameId = 0;
    let hasRevealed = false;
    const revealCard = () => {
      if (hasRevealed) return;
      hasRevealed = true;
      setIsMounted(true);
      frameId = window.requestAnimationFrame(() => setIsVisible(true));
    };

    if (anchor.getBoundingClientRect().top <= window.innerHeight * 0.82) {
      revealCard();
      return () => {
        if (frameId) {
          window.cancelAnimationFrame(frameId);
        }
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight * 0.82) return;
        revealCard();
        observer.disconnect();
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -18% 0px',
      },
    );

    observer.observe(anchor);

    return () => {
      observer.disconnect();
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [headings.length, revealOnScroll]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

  const card = (
    <div className={`blog-sidebar-surface blog-toc-card blog-toc-card--${variant} rounded-[1.75rem] p-5`}>
      <div className="mb-4 flex items-center gap-2">
        <List className="h-4 w-4 text-[var(--pulse-red)]" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--neutral-500)]">
          Contents
        </h2>
      </div>
      <nav aria-label={variant === 'sticky' ? 'Sticky table of contents' : 'Table of contents'}>
        <ul className="space-y-2">
          {headings.map((heading) => (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => scrollToHeading(heading.id)}
                data-active={activeId === heading.id ? 'true' : 'false'}
                className={`blog-toc-link block w-full rounded-2xl px-4 py-2.5 text-left text-sm transition-all duration-300 ${
                  heading.level === 3 ? 'pl-12' : 'pl-9'
                } ${
                  activeId === heading.id
                    ? 'font-semibold text-[var(--pulse-red)]'
                    : 'text-[var(--neutral-600)] hover:text-[var(--pulse-red)]'
                }`}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );

  if (!revealOnScroll) {
    return card;
  }

  return (
    <div ref={revealAnchorRef} className="blog-toc-anchor">
      {isMounted ? (
        <div className="blog-toc-reveal" data-visible={isVisible ? 'true' : 'false'}>
          {card}
        </div>
      ) : null}
    </div>
  );
}
