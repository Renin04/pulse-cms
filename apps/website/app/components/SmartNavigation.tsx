'use client';

import { useEffect, useState, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import Navigation from './Navigation';

export default function SmartNavigation() {
  const [isVisible, setIsVisible] = useState(true);
  const [showButton, setShowButton] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header only at top of page (< 100px)
      if (currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Hide when scrolling down
        setIsVisible(false);
        setShowButton(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggle = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {/* Fade overlay */}
      <div 
        className={`pointer-events-none fixed left-0 right-0 top-0 z-[290] h-32 bg-gradient-to-b from-white via-white/80 to-transparent transition-opacity duration-300 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Header wrapper - MUST have higher z-index than Navigation's internal z-index */}
      <div
        className={`fixed left-0 right-0 top-0 z-[300] transition-transform duration-500 ease-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <Navigation />
      </div>

      {/* Glass button — desktop only */}
      {showButton && (
        <button
          onClick={handleToggle}
          className="glass-toggle-button group hidden lg:block fixed right-6 top-6 z-[310] h-[3.2rem] w-[3.2rem] cursor-pointer border-0 bg-transparent p-0 text-inherit [perspective:18rem] [transform-style:preserve-3d] [-webkit-tap-highlight-color:transparent]"
          aria-label={isVisible ? 'Hide navigation' : 'Show navigation'}
          style={{
            animation: 'slideInBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Back layer - RED BOX */}
          <span 
            className="glass-back absolute inset-0 rounded-[1.1rem] shadow-[0.7rem_-0.55rem_1.1rem_rgba(17,24,39,0.14)] transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] [transform-origin:100%_100%]"
            style={{
              background: 'linear-gradient(145deg, rgba(255, 83, 51, 0.96) 0%, rgba(255, 40, 0, 0.94) 48%, rgba(255, 230, 149, 0.9) 100%)',
              transform: 'rotate(10deg)',
            }}
            aria-hidden="true"
          />
          
          {/* Front layer */}
          <span 
            className="glass-front absolute inset-0 flex items-center justify-center rounded-[1.1rem] border border-white/[0.82] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_14px_30px_-24px_rgba(17,24,39,0.55)] backdrop-blur-[12px] [-webkit-backdrop-filter:blur(12px)] transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(250, 250, 250, 0.72)), radial-gradient(circle at top, rgba(255, 255, 255, 0.5), transparent 62%)',
              color: 'var(--pulse-black)',
            }}
          >
            <span className="relative inline-flex h-[1.15rem] w-[1.15rem] items-center justify-center">
              <Menu 
                className={`absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isVisible 
                    ? 'rotate-[180deg] scale-0 opacity-0' 
                    : 'rotate-0 scale-100 opacity-100'
                }`}
                size={20}
                strokeWidth={2.5}
              />
              
              <X 
                className={`absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isVisible 
                    ? 'rotate-0 scale-100 opacity-100' 
                    : 'rotate-[180deg] scale-0 opacity-0'
                }`}
                size={20}
                strokeWidth={2.5}
              />
            </span>
          </span>
          
          <span className="pointer-events-none absolute left-1/2 top-[calc(100%+0.55rem)] min-w-max -translate-x-1/2 translate-y-[-0.2rem] whitespace-nowrap rounded-full bg-[rgba(17,24,39,0.88)] px-[0.55rem] py-[0.22rem] text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-white/[0.82] opacity-0 transition-all duration-[280ms] ease-out group-hover:translate-y-0 group-hover:opacity-100">
            {isVisible ? 'Hide menu' : 'Show menu'}
          </span>
        </button>
      )}
      
    </>
  );
}
