'use client';

import { Twitter, Linkedin, Facebook, Link2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState(url);

  // Ensure we have a full URL - only access window on client
  useEffect(() => {
    if (typeof window !== 'undefined' && !url.startsWith('http')) {
      setFullUrl(`${window.location.origin}${url}`);
    }
  }, [url]);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="blog-sidebar-surface rounded-[1.75rem] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--neutral-500)]">
        Share
      </h2>
      <div className="flex flex-wrap gap-2">
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          data-share-button="true"
          className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-black/8 bg-white/74 text-[var(--neutral-600)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[var(--pulse-red)]/28 hover:bg-[var(--pulse-red)]/8 hover:text-[var(--pulse-red)]"
          aria-label="Share on Twitter"
        >
          <Twitter className="h-4 w-4" />
        </a>
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          data-share-button="true"
          className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-black/8 bg-white/74 text-[var(--neutral-600)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[var(--pulse-red)]/28 hover:bg-[var(--pulse-red)]/8 hover:text-[var(--pulse-red)]"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </a>
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          data-share-button="true"
          className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-black/8 bg-white/74 text-[var(--neutral-600)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[var(--pulse-red)]/28 hover:bg-[var(--pulse-red)]/8 hover:text-[var(--pulse-red)]"
          aria-label="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={copyToClipboard}
          data-share-button="true"
          className={`flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-black/8 bg-white/74 text-[var(--neutral-600)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[var(--pulse-red)]/28 hover:bg-[var(--pulse-red)]/8 hover:text-[var(--pulse-red)] ${
            copied ? 'border-[var(--pulse-red)]/36 bg-[var(--pulse-red)]/10 text-[var(--pulse-red)]' : ''
          }`}
          aria-label="Copy link"
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
