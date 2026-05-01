'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Eye, EyeOff } from 'lucide-react';

export default function ReadingModeControls() {
  const [darkMode, setDarkMode] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('pulse.blog.darkMode') === 'true';
    const savedHideSidebar = localStorage.getItem('pulse.blog.hideSidebar') === 'true';

    setDarkMode(savedDarkMode);
    setHideSidebar(savedHideSidebar);

    localStorage.removeItem('pulse.blog.zenMode');
    document.documentElement.classList.remove('blog-zen-mode');

    if (savedDarkMode) {
      document.documentElement.classList.add('blog-dark-mode');
      document.documentElement.classList.add('dark');
    }
    if (savedHideSidebar) {
      document.documentElement.classList.add('blog-hide-sidebar');
    }

    return () => {
      document.documentElement.classList.remove('blog-dark-mode');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('blog-zen-mode');
      document.documentElement.classList.remove('blog-hide-sidebar');
    };
  }, []);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('pulse.blog.darkMode', String(newValue));

    if (newValue) {
      document.documentElement.classList.add('blog-dark-mode');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('blog-dark-mode');
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleSidebar = () => {
    const newValue = !hideSidebar;
    setHideSidebar(newValue);
    localStorage.setItem('pulse.blog.hideSidebar', String(newValue));

    if (newValue) {
      document.documentElement.classList.add('blog-hide-sidebar');
    } else {
      document.documentElement.classList.remove('blog-hide-sidebar');
    }
  };

  const controls = [
    {
      key: 'dark-mode',
      label: darkMode ? 'Light canvas' : 'Dark canvas',
      active: darkMode,
      icon: darkMode ? (
        <Sun className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
      ),
      onClick: toggleDarkMode,
    },
    {
      key: 'sidebar',
      label: hideSidebar ? 'Show sidebar' : 'Hide sidebar',
      active: hideSidebar,
      icon: hideSidebar ? (
        <Eye className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
      ) : (
        <EyeOff className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
      ),
      onClick: toggleSidebar,
    },
  ];

  return (
    <div className="reading-mode-dock fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
      <div className="relative flex flex-col gap-1.5 rounded-[1.25rem] border border-black/8 bg-white/62 p-1.5 shadow-[0_16px_32px_-24px_rgba(17,24,39,0.38)] backdrop-blur-lg supports-[backdrop-filter]:bg-white/52">
        {controls.map((control) => (
          <button
            key={control.key}
            type="button"
            onClick={control.onClick}
            aria-pressed={control.active}
            aria-label={control.label}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-[0.95rem] border text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              control.active
                ? 'border-[var(--pulse-black)] bg-[var(--pulse-black)] text-white hover:-translate-y-0.5 hover:border-[var(--pulse-red)]/32 hover:text-[var(--pulse-red)] hover:shadow-[0_18px_30px_-22px_rgba(17,24,39,0.45)]'
                : 'border-black/6 bg-white/74 text-[var(--neutral-600)] hover:-translate-y-0.5 hover:border-[var(--pulse-red)]/25 hover:text-[var(--pulse-red)]'
            }`}
          >
            <span className="transition-transform duration-300 group-hover:scale-105">
              {control.icon}
            </span>
            <span className="pointer-events-none absolute right-[calc(100%+0.65rem)] top-1/2 min-w-max -translate-y-1/2 translate-x-[0.2rem] whitespace-nowrap rounded-full bg-[rgba(17,24,39,0.88)] px-[0.55rem] py-[0.22rem] text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-white/[0.82] opacity-0 transition-all duration-[280ms] ease-out group-hover:translate-x-0 group-hover:opacity-100">
              {control.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
