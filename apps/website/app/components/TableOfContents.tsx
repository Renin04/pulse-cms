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

/* ─── Custom scroll indicator ─── */
function ScrollIndicator({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [visible, setVisible] = useState(false);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(20);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const sh = container.scrollHeight;
      const ch = container.clientHeight;
      const progress = sh > ch ? container.scrollTop / (sh - ch) : 0;
      const trackH = ch;
      const thumbH = Math.max(24, (ch / Math.max(sh, 1)) * trackH);
      const top = progress * (trackH - thumbH);
      setThumbTop(top);
      setThumbHeight(thumbH);
    };

    const onScroll = () => {
      update();
      setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), 600);
    };

    update();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [containerRef]);

  return (
    <div
      className="pointer-events-none absolute right-[2px] top-0 h-full w-[1px] transition-opacity duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* Track line */}
      <div className="absolute inset-0 bg-black/[0.04]" />
      {/* Thumb */}
      <div
        className="absolute rounded-full transition-[top] duration-100 ease-out"
        style={{
          top: thumbTop,
          height: thumbHeight,
          width: '2px',
          left: '-0.5px',
          backgroundColor: 'rgba(255, 40, 0, 0.45)',
        }}
      />
    </div>
  );
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const rafRef = useRef<number>(0);
  const observerRef = useRef<MutationObserver | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const isManualScrollRef = useRef(false);
  const manualScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scanHeadings = useCallback(() => {
    const article = document.querySelector('.studio-rendered');
    if (!article) return;

    const headingElements = Array.from(article.querySelectorAll<HTMLElement>('h2, h3'));
    if (headingElements.length === 0) return;

    const headingData: Heading[] = headingElements.map((heading, index) => {
      const text = heading.textContent?.trim() || '';
      const baseId = slugify(text) || `h-${index}`;
      const id = `${baseId}-${index}`;
      heading.setAttribute(DATA_ATTR, id);
      if (!heading.id) heading.id = baseId;
      return { id, text, level: parseInt(heading.tagName.charAt(1)) };
    });

    setHeadings(prev => {
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
    scanHeadings();
    const article = document.querySelector('.studio-rendered');
    if (article) {
      observerRef.current = new MutationObserver(() => scanHeadings());
      observerRef.current.observe(article, { childList: true, subtree: true });
    }
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

  // Proportional auto-scroll: TOC scroll mirrors article scroll progress
  useEffect(() => {
    if (!railRef.current || isManualScrollRef.current) return;

    const article = document.querySelector('.studio-rendered');
    const rail = railRef.current;
    if (!article) return;

    const articleHeight = article.scrollHeight;
    const viewportH = window.innerHeight;
    const scrollTop = window.scrollY;
    const maxScroll = Math.max(1, articleHeight - viewportH);
    const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));

    const tocMaxScroll = Math.max(1, rail.scrollHeight - rail.clientHeight);
    const targetScroll = progress * tocMaxScroll;

    rail.scrollTo({ top: targetScroll, behavior: 'smooth' });
  }, [activeId]);

  const handleRailScroll = useCallback(() => {
    isManualScrollRef.current = true;
    if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current);
    manualScrollTimeoutRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 1500);
  }, []);

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
    <nav aria-label="Table of contents" className="blog-toc-sidebar-nav relative">
      <div className="mb-3 flex items-center gap-2 px-1">
        <List className="h-3.5 w-3.5 text-[var(--pulse-red)]" strokeWidth={2.5} />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--neutral-500)]">
          Contents
        </span>
      </div>
      <div
        ref={railRef}
        onScroll={handleRailScroll}
        className="blog-toc-scroll-container relative overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 6rem)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <ScrollIndicator containerRef={railRef} />
        <ul className="flex flex-col gap-0.5 pr-3">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            return (
              <li key={heading.id}>
                <button
                  ref={isActive ? activeItemRef : undefined}
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
      </div>
    </nav>
  );
}
