'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { List } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '') || `h-${Math.random().toString(36).slice(2, 7)}`
  );
}

const DATA_ATTR = 'data-pulse-toc-id';

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const rafRef = useRef<number>(0);
  const observerRef = useRef<MutationObserver | null>(null);

  const scanHeadings = useCallback(() => {
    const article = document.querySelector('.studio-rendered');
    if (!article) return;

    const headingElements = Array.from(article.querySelectorAll<HTMLElement>('h2, h3'));
    if (headingElements.length === 0) return;

    const headingData: Heading[] = headingElements.map((heading, index) => {
      const text = heading.textContent?.trim() || '';
      const baseId = slugify(text) || `h-${index}`;
      // Ensure uniqueness by including index
      const id = `${baseId}-${index}`;

      // Always set/re-set the data attribute so clicks work even after DOM mutations
      heading.setAttribute(DATA_ATTR, id);

      // Also ensure a real id exists for hash linking
      if (!heading.id) {
        heading.id = baseId;
      }

      return { id, text, level: parseInt(heading.tagName.charAt(1)) };
    });

    setHeadings(prev => {
      // Only update if the headings actually changed
      if (
        prev.length === headingData.length &&
        prev.every((h, i) => h.text === headingData[i].text && h.level === headingData[i].level)
      ) {
        return prev;
      }
      setActiveId(headingData[0]?.id ?? '');
      return headingData;
    });
  }, []);

  useEffect(() => {
    // Initial scan
    scanHeadings();

    // Set up mutation observer to catch DOM changes (e.g., React re-inserting HTML)
    const article = document.querySelector('.studio-rendered');
    if (article) {
      observerRef.current = new MutationObserver(() => {
        scanHeadings();
      });
      observerRef.current.observe(article, { childList: true, subtree: true });
    }

    // Also re-scan after a delay in case content streams in
    const t1 = setTimeout(scanHeadings, 300);
    const t2 = setTimeout(scanHeadings, 1000);

    return () => {
      observerRef.current?.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [scanHeadings]);

  useEffect(() => {
    if (headings.length === 0) return;

    const offset = 120;

    const updateActive = () => {
      const article = document.querySelector('.studio-rendered');
      if (!article) return;
      const headingElements = Array.from(article.querySelectorAll<HTMLElement>('h2, h3'));

      let nextActiveId = headings[0]?.id ?? '';
      for (const heading of headingElements) {
        const rect = heading.getBoundingClientRect();
        if (rect.top - offset <= 0) {
          const id = heading.getAttribute(DATA_ATTR) || heading.id;
          if (id) nextActiveId = id;
        } else {
          break;
        }
      }
      setActiveId(nextActiveId);
    };

    updateActive();
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateActive);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [headings]);

  const scrollToHeading = useCallback((id: string) => {
    const article = document.querySelector('.studio-rendered');
    if (!article) return;
    const element = article.querySelector<HTMLElement>(`[${DATA_ATTR}="${id}"]`);
    if (!element) return;
    const offset = 96;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="blog-toc-sidebar-nav">
      <div className="mb-3 flex items-center gap-2 px-1">
        <List className="h-3.5 w-3.5 text-[var(--pulse-red)]" strokeWidth={2.5} />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--neutral-500)]">
          Contents
        </span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => scrollToHeading(heading.id)}
                className={`group flex w-full items-center rounded-md px-2 py-[5px] text-left text-[12px] leading-snug transition-colors duration-200 ${
                  heading.level === 3 ? 'pl-5' : 'pl-2'
                } ${
                  isActive
                    ? 'font-semibold text-[var(--pulse-red)]'
                    : 'font-medium text-[var(--neutral-500)] hover:bg-black/[0.03] hover:text-[var(--pulse-black)]'
                }`}
              >
                <span
                  className={`mr-2 h-[5px] w-[5px] shrink-0 rounded-full transition-colors duration-200 ${
                    isActive ? 'bg-[var(--pulse-red)]' : 'bg-[var(--neutral-300)] group-hover:bg-[var(--neutral-400)]'
                  }`}
                />
                <span className="truncate">{heading.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
