'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Command, Plus,
  Trash2, Copy, CopyX, X, EyeOff, Type, Heading,
  List, Code, Quote, MessageSquare, Image as ImageIcon,
  Table, CheckSquare, BarChart3, Map, Calculator, HelpCircle,
  LayoutGrid, Video, Music, Globe, BookOpen, Clock, Layers,
  Monitor, FileText, Star, Share2, Bookmark, GitBranch,
  ChevronDown, ChevronUp, ArrowRight, GripVertical,
  Play, Terminal, Eye, Sparkles,
} from 'lucide-react';
import type { EditorStateAdapter } from '@pulse/editor';
import type { Block, BlockData } from '@pulse/core';
import { BUILTIN_BLOCK_DEFINITIONS, formatReferenceNumber } from '@pulse/blocks';
import {
  EditableHorizontalRule, EditableLink, EditableImage, EditableVideo, EditableAudio,
  EditableEmbed, EditableFile, EditableTable, EditableCallout, EditableAlert, EditableQuiz, EditablePoll,
  EditableAccordion, EditableTabs, EditableToggle, EditableSpoiler, EditableFlashcard,
  EditableTimeline, EditableComparison, EditableBeforeAfter, EditableChart, EditableMap,
  EditableMath, EditableDiagram, EditableManga, EditableSpeechBubble, EditableCard,
  EditableGallery, EditableCarousel, EditableHeroSection, EditableAnnotatedImage,
  EditableCodeSandbox,
  LinkModal, LinkContextMenu, RefModal, RefContextMenu,
  markdownToHtml, htmlToMarkdown,
  getLinkAtCursor, getLinkFromEvent, getRefAtCursor, getRefFromEvent, getRefElementAtCursor, getRefElementFromEvent,
} from './StudioBlockEditors';
import { StudioTooltip } from './StudioTooltip';
import { createSandboxHtml } from './CodeSandbox';

const blockTypeToIcon: Record<string, React.ElementType> = {
  text: Type,
  heading: Heading,
  list: List,
  code: Code,
  'code-sandbox': Terminal,
  blockquote: Quote,
  callout: MessageSquare,
  image: ImageIcon,
  video: Video,
  audio: Music,
  table: Table,
  quiz: HelpCircle,
  poll: BarChart3,
  survey: FileText,
  accordion: LayoutGrid,
  tabs: Table,
  toggle: CheckSquare,
  spoiler: EyeOff,
  chart: BarChart3,
  map: Map,
  'math-equation': Calculator,
  diagram: Monitor,
  manga: LayoutGrid,
  'speech-bubble': MessageSquare,
  card: Layers,
  gallery: ImageIcon,
  carousel: Monitor,
  flashcard: BookOpen,
  timeline: Clock,
  comparison: GitBranch,
  'before-after': Share2,
  'hero-section': Star,
  'annotated-image': ImageIcon,
  embed: Globe,
  file: FileText,
  link: Bookmark,
  horizontalrule: ArrowRight,
};

const blockTypeToLabel: Record<string, string> = {
  text: 'Paragraph',
  heading: 'Heading',
  list: 'List',
  code: 'Code',
  'code-sandbox': 'Code Sandbox',
  blockquote: 'Quote',
  callout: 'Callout',
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  table: 'Table',
  quiz: 'Quiz',
  poll: 'Poll',
  survey: 'Survey',
  accordion: 'Accordion',
  tabs: 'Tabs',
  toggle: 'Toggle',
  spoiler: 'Spoiler',
  chart: 'Chart',
  map: 'Map',
  'math-equation': 'Equation',
  diagram: 'Diagram',
  manga: 'Manga Panel',
  'speech-bubble': 'Speech Bubble',
  card: 'Card',
  gallery: 'Gallery',
  carousel: 'Carousel',
  flashcard: 'Flashcard',
  timeline: 'Timeline',
  comparison: 'Comparison',
  'before-after': 'Before / After',
  'hero-section': 'Hero Section',
  'annotated-image': 'Annotated Image',
  embed: 'Embed',
  file: 'File',
  link: 'Link',
  'horizontal-rule': 'Divider',
};

const blockTypeToDescription: Record<string, string> = {
  text: 'Plain text with formatting',
  heading: 'Section heading in 6 levels',
  list: 'Bulleted, numbered, or custom lists',
  code: 'Syntax-highlighted code block',
  'code-sandbox': 'Interactive code execution playground',
  blockquote: 'Styled quotation with citation',
  callout: 'Info box with icon and color',
  image: 'Upload or link an image',
  video: 'YouTube, Vimeo, or self-hosted',
  audio: 'MP3 player with captions',
  table: 'Structured data table',
  quiz: 'Single or multiple choice quiz',
  poll: 'Live voting with results',
  survey: 'Multi-question form block',
  accordion: 'Collapsible content panels',
  tabs: 'Tabbed content sections',
  toggle: 'Expandable on/off content',
  spoiler: 'Hidden content reveal',
  chart: 'Bar, line, pie, or doughnut',
  map: 'Interactive location map',
  'math-equation': 'LaTeX-style math rendering',
  diagram: 'Flowchart or visual diagram',
  manga: 'Comic-style panel grid',
  'speech-bubble': 'Dialogue or thought bubble',
  card: 'Image card with CTA button',
  gallery: 'Masonry or grid image gallery',
  carousel: 'Sliding image carousel',
  flashcard: 'Flip-card for learning',
  timeline: 'Chronological event timeline',
  comparison: 'Side-by-side comparison',
  'before-after': 'Interactive image slider',
  'hero-section': 'Full-width hero banner',
  'annotated-image': 'Image with clickable hotspots',
  embed: 'External content iframe',
  file: 'Downloadable file attachment',
  link: 'Rich link preview card',
  'horizontal-rule': 'Visual section divider',
};

function getBlockDefaultData(type: string): BlockData {
  const defs = (BUILTIN_BLOCK_DEFINITIONS as unknown as any[]);
  const def = defs.find((d) => d.type === type);
  if (!def) return {};
  const defaultData = typeof def.defaultData === 'function' ? def.defaultData() : def.defaultData;
  return { ...defaultData } as BlockData;
}

export function createStudioBlock(type: string, dataOverrides?: Record<string, unknown>): Block<BlockData> {
  const now = new Date().toISOString();
  return {
    id: `block-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`,
    type,
    data: { ...getBlockDefaultData(type), ...(dataOverrides || {}) },
    createdAt: now,
    updatedAt: now,
  };
}

// â”€â”€â”€ Editable block components â”€â”€â”€

function EditableHeading({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { text: string; level: number };
  const Tag = `h${data.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalText, setLinkModalText] = useState('');
  const [linkModalUrl, setLinkModalUrl] = useState('');
  const [linkModalRel, setLinkModalRel] = useState('');
  const [linkModalTarget, setLinkModalTarget] = useState('');
  const savedRangeRef = useRef<Range | null>(null);
  const skipBlurRef = useRef(false);
  const existingLinkRef = useRef<{ text: string; url: string; rel: string; target: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; link: { text: string; url: string; rel: string; target: string } } | null>(null);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [refModalUrl, setRefModalUrl] = useState('');
  const [refModalText, setRefModalText] = useState('');
  const [refModalStyle, setRefModalStyle] = useState<'numeric' | 'alphabetic' | 'greek' | 'abjad'>('numeric');
  const [refModalTarget, setRefModalTarget] = useState('');
  const [refModalRel, setRefModalRel] = useState('');
  const existingRefRef = useRef<{ url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad'; target?: string; rel?: string } | null>(null);
  const existingRefElementRef = useRef<HTMLElement | null>(null);
  const [refContextMenu, setRefContextMenu] = useState<{ x: number; y: number; ref: { url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad'; target?: string; rel?: string }; element: HTMLElement } | null>(null);

  // Sync innerHTML whenever block text or level changes
  // useLayoutEffect ensures content is set before paint to prevent flash of empty content
  useLayoutEffect(() => {
    const el = headingRef.current;
    if (el) {
      el.innerHTML = markdownToHtml(data.text);
    }
  }, [data.text, data.level]);

  const openLinkModal = () => {
    skipBlurRef.current = true;
    const el = headingRef.current;
    if (!el) return;

    const existingLink = getLinkAtCursor(el);
    if (existingLink) {
      setLinkModalText(existingLink.text);
      setLinkModalUrl(existingLink.url);
      setLinkModalRel(existingLink.rel);
      setLinkModalTarget(existingLink.target);
      existingLinkRef.current = existingLink;
      savedRangeRef.current = null;
      setLinkModalOpen(true);
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;
    // Save the selection range before modal steals focus
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingLinkRef.current = null;
    setLinkModalText(selectedText);
    setLinkModalUrl('');
    setLinkModalRel('');
    setLinkModalTarget('');
    setLinkModalOpen(true);
  };

  const handleLinkConfirm = (url: string, rel: string, target: string) => {
    const el = headingRef.current;
    if (!el) return;
    skipBlurRef.current = false;
    const parts: string[] = [];
    if (rel) parts.push(`rel="${rel}"`);
    if (target) parts.push(`target="${target}"`);
    const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';
    const markdownText = `[${linkModalText}](${url})${attrs}`;

    if (existingLinkRef.current) {
      // Editing existing link: find and replace the span
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(markdownText));
        }
      });
    } else if (savedRangeRef.current) {
      // New link: focus, restore selection, then insert markdown
      el.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
      document.execCommand('insertText', false, markdownText);
    }

    skipBlurRef.current = false;
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
    }, 0);
  };

  const handleLinkRemove = () => {
    const el = headingRef.current;
    if (!el) return;
    skipBlurRef.current = false;

    if (existingLinkRef.current) {
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(existingLinkRef.current.text));
        }
      });
    }

    skipBlurRef.current = false;
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
    }, 0);
  };

  const openRefModal = () => {
    const el = headingRef.current;
    if (!el) return;
    skipBlurRef.current = true;
    const existingRef = getRefAtCursor(el);
    if (existingRef) {
      setRefModalUrl(existingRef.url || '');
      setRefModalText(existingRef.text || '');
      setRefModalStyle(existingRef.style);
      setRefModalTarget(existingRef.target || '');
      setRefModalRel(existingRef.rel || '');
      existingRefRef.current = existingRef;
      existingRefElementRef.current = getRefElementAtCursor(el);
      savedRangeRef.current = null;
      setRefModalOpen(true);
      return;
    }
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingRefRef.current = null;
    existingRefElementRef.current = null;
    setRefModalText(selectedText);
    setRefModalUrl('');
    setRefModalStyle('numeric');
    setRefModalTarget('');
    setRefModalRel('');
    setRefModalOpen(true);
  };

  const handleRefConfirm = (url: string, text: string, style: 'numeric' | 'alphabetic' | 'greek' | 'abjad', target: string, rel: string) => {
    const el = headingRef.current;
    if (!el) return;
    skipBlurRef.current = false;
    const parts: string[] = [];
    parts.push(`text="${text}"`);
    parts.push(`style="${style}"`);
    if (target) parts.push(`target="${target}"`);
    if (rel) parts.push(`rel="${rel}"`);
    const attrs = `{${parts.join(' ')}}`;
    const markdownText = `[ref](${url})${attrs}`;
    if (existingRefElementRef.current) {
      existingRefElementRef.current.replaceWith(document.createTextNode(markdownText));
    } else if (savedRangeRef.current) {
      el.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
        selection.collapseToEnd();
      }
      document.execCommand('insertText', false, markdownText);
    }
    skipBlurRef.current = false;
    setRefModalOpen(false);
    existingRefRef.current = null;
    existingRefElementRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
    }, 0);
  };

  const handleRefRemove = () => {
    const el = headingRef.current;
    if (!el) return;
    skipBlurRef.current = false;
    if (existingRefElementRef.current) {
      const next = existingRefElementRef.current.nextSibling;
      if (next && next.nodeType === Node.TEXT_NODE && next.textContent === '\u200B') {
        next.remove();
      }
      existingRefElementRef.current.remove();
      existingRefElementRef.current = null;
    }
    skipBlurRef.current = false;
    setRefModalOpen(false);
    existingRefRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
    }, 0);
  };

  return (
    <>
      <div className="group/heading flex items-start gap-3">
        <select
          value={data.level}
          onChange={(e) =>
            adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, level: Number(e.target.value) } }))
          }
          className="mt-1 rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] outline-none"
        >
          {[1, 2, 3, 4, 5, 6].map((l) => (
            <option key={l} value={l}>H{l}</option>
          ))}
        </select>
        <Tag
          key={`heading-level-${data.level}`}
          ref={headingRef}
          contentEditable
          suppressContentEditableWarning
          className="min-w-0 flex-1 font-bold text-[var(--pulse-black)] outline-none"
          style={{ fontSize: data.level === 1 ? '2rem' : data.level === 2 ? '1.5rem' : '1.25rem' }}
          onBlur={(e) => {
            if (skipBlurRef.current) return;
            const markdown = htmlToMarkdown(e.currentTarget.innerHTML);
            adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
              e.preventDefault();
              openLinkModal();
            }
          }}
          onContextMenu={(e) => {
            const link = getLinkFromEvent(e);
            if (link) {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, link });
              return;
            }
            const ref = getRefFromEvent(e);
            const refEl = getRefElementFromEvent(e);
            if (ref && refEl) {
              e.preventDefault();
              setRefContextMenu({ x: e.clientX, y: e.clientY, ref, element: refEl });
            }
          }}
        />
        <StudioTooltip text="Link selected text (Ctrl+K)" side="top">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLinkModal}
            className="mt-1 rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
          >
            Link
          </button>
        </StudioTooltip>
        <StudioTooltip text="Add reference citation" side="top">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={openRefModal}
            className="mt-1 rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
          >
            Ref
          </button>
        </StudioTooltip>
      </div>
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => {
          skipBlurRef.current = false;
          setLinkModalOpen(false);
        }}
        onConfirm={handleLinkConfirm}
        onRemove={linkModalUrl ? handleLinkRemove : undefined}
        defaultText={linkModalText}
        defaultUrl={linkModalUrl}
        defaultRel={linkModalRel}
        defaultTarget={linkModalTarget}
      />
      {contextMenu && (
        <LinkContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            setLinkModalText(contextMenu.link.text);
            setLinkModalUrl(contextMenu.link.url);
            setLinkModalRel(contextMenu.link.rel);
            setLinkModalTarget(contextMenu.link.target);
            existingLinkRef.current = contextMenu.link;
            savedRangeRef.current = null;
            setLinkModalOpen(true);
            setContextMenu(null);
          }}
          onRemove={() => {
            const el = headingRef.current;
            if (!el) return;
            const links = el.querySelectorAll('span.pulse-editor-link');
            links.forEach((span) => {
              if (span.textContent?.trim() === contextMenu.link.text && span.getAttribute('data-url') === contextMenu.link.url) {
                span.replaceWith(document.createTextNode(contextMenu.link.text));
              }
            });
            setContextMenu(null);
            setTimeout(() => {
              const markdown = htmlToMarkdown(el.innerHTML);
              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
            }, 0);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      <RefModal
        isOpen={refModalOpen}
        onClose={() => {
          skipBlurRef.current = false;
          setRefModalOpen(false);
        }}
        onConfirm={handleRefConfirm}
        onRemove={existingRefRef.current ? handleRefRemove : undefined}
        defaultUrl={refModalUrl}
        defaultText={refModalText}
        defaultStyle={refModalStyle}
        defaultTarget={refModalTarget}
        defaultRel={refModalRel}
      />
      {refContextMenu && (
        <RefContextMenu
          x={refContextMenu.x}
          y={refContextMenu.y}
          onEdit={() => {
            setRefModalUrl(refContextMenu.ref.url || '');
            setRefModalText(refContextMenu.ref.text || '');
            setRefModalStyle(refContextMenu.ref.style);
            setRefModalTarget(refContextMenu.ref.target || '');
            setRefModalRel(refContextMenu.ref.rel || '');
            existingRefRef.current = refContextMenu.ref;
            existingRefElementRef.current = refContextMenu.element;
            savedRangeRef.current = null;
            setRefModalOpen(true);
            setRefContextMenu(null);
          }}
          onRemove={() => {
            const el = headingRef.current;
            if (!el) return;
            if (refContextMenu.element) {
              const next = refContextMenu.element.nextSibling;
              if (next && next.nodeType === Node.TEXT_NODE && next.textContent === '\u200B') {
                next.remove();
              }
              refContextMenu.element.remove();
            }
            setRefContextMenu(null);
            setTimeout(() => {
              const markdown = htmlToMarkdown(el.innerHTML);
              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
            }, 0);
          }}
          onClose={() => setRefContextMenu(null)}
        />
      )}
    </>
  );
}

function EditableText({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { text: string; marks?: Record<string, boolean>; align?: string };
  const align = data.align || 'left';
  const textRef = useRef<HTMLParagraphElement>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalText, setLinkModalText] = useState('');
  const [linkModalUrl, setLinkModalUrl] = useState('');
  const [linkModalRel, setLinkModalRel] = useState('');
  const [linkModalTarget, setLinkModalTarget] = useState('');
  const savedRangeRef = useRef<Range | null>(null);
  const skipBlurRef = useRef(false);
  const existingLinkRef = useRef<{ text: string; url: string; rel: string; target: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; link: { text: string; url: string; rel: string; target: string } } | null>(null);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [refModalUrl, setRefModalUrl] = useState('');
  const [refModalText, setRefModalText] = useState('');
  const [refModalStyle, setRefModalStyle] = useState<'numeric' | 'alphabetic' | 'greek' | 'abjad'>('numeric');
  const [refModalTarget, setRefModalTarget] = useState('');
  const [refModalRel, setRefModalRel] = useState('');
  const existingRefRef = useRef<{ url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad'; target?: string; rel?: string } | null>(null);
  const existingRefElementRef = useRef<HTMLElement | null>(null);
  const [refContextMenu, setRefContextMenu] = useState<{ x: number; y: number; ref: { url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad'; target?: string; rel?: string }; element: HTMLElement } | null>(null);

  // Sync innerHTML whenever block text changes (safe because data.text only changes on blur/save)
  useLayoutEffect(() => {
    const el = textRef.current;
    if (el) {
      el.innerHTML = markdownToHtml(data.text);
    }
  }, [data.text]);

  const marks = data.marks || {};
  const markStyle: React.CSSProperties = {
    textAlign: align as any,
    fontFamily: marks.code ? 'monospace' : undefined,
    backgroundColor: marks.code ? '#f3f4f6' : undefined,
    padding: marks.code ? '0.15em 0.4em' : undefined,
    borderRadius: marks.code ? '4px' : undefined,
    fontWeight: marks.bold ? 'bold' : undefined,
    fontStyle: marks.italic ? 'italic' : undefined,
    textDecoration: marks.underline ? 'underline' : undefined,
  };

  const openLinkModal = () => {
    const el = textRef.current;
    if (!el) return;
    skipBlurRef.current = true;

    // Check if cursor is inside an existing link
    const existingLink = getLinkAtCursor(el);
    if (existingLink) {
      setLinkModalText(existingLink.text);
      setLinkModalUrl(existingLink.url);
      setLinkModalRel(existingLink.rel);
      existingLinkRef.current = existingLink;
      savedRangeRef.current = null;
      setLinkModalOpen(true);
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;
    // Save the selection range before modal steals focus
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingLinkRef.current = null;
    setLinkModalText(selectedText);
    setLinkModalUrl('');
    setLinkModalRel('');
    setLinkModalOpen(true);
  };

  const handleLinkConfirm = (url: string, rel: string, target: string) => {
    const el = textRef.current;
    if (!el) return;
    skipBlurRef.current = false;
    const parts: string[] = [];
    if (rel) parts.push(`rel="${rel}"`);
    if (target) parts.push(`target="${target}"`);
    const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';
    const markdownText = `[${linkModalText}](${url})${attrs}`;

    if (existingLinkRef.current) {
      // Editing existing link: find and replace the span
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(markdownText));
        }
      });
    } else if (savedRangeRef.current) {
      // New link: focus, restore selection, then insert markdown
      el.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
      document.execCommand('insertText', false, markdownText);
    }

    skipBlurRef.current = false;
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    // Save after insertion
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
    }, 0);
  };

  const handleLinkRemove = () => {
    const el = textRef.current;
    if (!el) return;
    skipBlurRef.current = false;

    if (existingLinkRef.current) {
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(existingLinkRef.current.text));
        }
      });
    }

    skipBlurRef.current = false;
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
    }, 0);
  };

  const openRefModal = () => {
    const el = textRef.current;
    if (!el) return;
    skipBlurRef.current = true;
    const existingRef = getRefAtCursor(el);
    if (existingRef) {
      setRefModalUrl(existingRef.url || '');
      setRefModalText(existingRef.text || '');
      setRefModalStyle(existingRef.style);
      setRefModalTarget(existingRef.target || '');
      setRefModalRel(existingRef.rel || '');
      existingRefRef.current = existingRef;
      existingRefElementRef.current = getRefElementAtCursor(el);
      savedRangeRef.current = null;
      setRefModalOpen(true);
      return;
    }
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingRefRef.current = null;
    existingRefElementRef.current = null;
    setRefModalText(selectedText);
    setRefModalUrl('');
    setRefModalStyle('numeric');
    setRefModalTarget('');
    setRefModalRel('');
    setRefModalOpen(true);
  };

  const handleRefConfirm = (url: string, text: string, style: 'numeric' | 'alphabetic' | 'greek' | 'abjad', target: string, rel: string) => {
    const el = textRef.current;
    if (!el) return;
    skipBlurRef.current = false;
    const parts: string[] = [];
    parts.push(`text="${text}"`);
    parts.push(`style="${style}"`);
    if (target) parts.push(`target="${target}"`);
    if (rel) parts.push(`rel="${rel}"`);
    const attrs = `{${parts.join(' ')}}`;
    const markdownText = `[ref](${url})${attrs}`;
    if (existingRefElementRef.current) {
      existingRefElementRef.current.replaceWith(document.createTextNode(markdownText));
    } else if (savedRangeRef.current) {
      el.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
        selection.collapseToEnd();
      }
      document.execCommand('insertText', false, markdownText);
    }
    skipBlurRef.current = false;
    setRefModalOpen(false);
    existingRefRef.current = null;
    existingRefElementRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
    }, 0);
  };

  const handleRefRemove = () => {
    const el = textRef.current;
    if (!el) return;
    skipBlurRef.current = false;
    if (existingRefElementRef.current) {
      const next = existingRefElementRef.current.nextSibling;
      if (next && next.nodeType === Node.TEXT_NODE && next.textContent === '\u200B') {
        next.remove();
      }
      existingRefElementRef.current.remove();
      existingRefElementRef.current = null;
    }
    skipBlurRef.current = false;
    setRefModalOpen(false);
    existingRefRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
    }, 0);
  };

  return (
    <>
      <div>
        <p
          ref={textRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[1.5em] leading-relaxed text-[var(--neutral-700)] outline-empty"
          style={markStyle}
          onBlur={(e) => {
            if (skipBlurRef.current) return;
            const markdown = htmlToMarkdown(e.currentTarget.innerHTML);
            adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
              e.preventDefault();
              openLinkModal();
            }
          }}
          onContextMenu={(e) => {
            const link = getLinkFromEvent(e);
            if (link) {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, link });
              return;
            }
            const ref = getRefFromEvent(e);
            const refEl = getRefElementFromEvent(e);
            if (ref && refEl) {
              e.preventDefault();
              setRefContextMenu({ x: e.clientX, y: e.clientY, ref, element: refEl });
            }
          }}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {(['left', 'center', 'right', 'justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, align: a } }))}
              className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                align === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {a}
            </button>
          ))}
          <StudioTooltip text="Link selected text (Ctrl+K)" side="top">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={openLinkModal}
              className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--pulse-jasmine)] hover:text-[var(--pulse-black)]"
            >
              Link
            </button>
          </StudioTooltip>
          <StudioTooltip text="Add reference citation" side="top">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={openRefModal}
              className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--pulse-jasmine)] hover:text-[var(--pulse-black)]"
            >
              Ref
            </button>
          </StudioTooltip>
        </div>
      </div>
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => {
          skipBlurRef.current = false;
          setLinkModalOpen(false);
        }}
        onConfirm={handleLinkConfirm}
        onRemove={linkModalUrl ? handleLinkRemove : undefined}
        defaultText={linkModalText}
        defaultUrl={linkModalUrl}
        defaultRel={linkModalRel}
        defaultTarget={linkModalTarget}
      />
      {contextMenu && (
        <LinkContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            setLinkModalText(contextMenu.link.text);
            setLinkModalUrl(contextMenu.link.url);
            setLinkModalRel(contextMenu.link.rel);
            setLinkModalTarget(contextMenu.link.target);
            existingLinkRef.current = contextMenu.link;
            savedRangeRef.current = null;
            setLinkModalOpen(true);
            setContextMenu(null);
          }}
          onRemove={() => {
            const el = textRef.current;
            if (!el) return;
            const links = el.querySelectorAll('span.pulse-editor-link');
            links.forEach((span) => {
              if (span.textContent?.trim() === contextMenu.link.text && span.getAttribute('data-url') === contextMenu.link.url) {
                span.replaceWith(document.createTextNode(contextMenu.link.text));
              }
            });
            setContextMenu(null);
            setTimeout(() => {
              const markdown = htmlToMarkdown(el.innerHTML);
              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
            }, 0);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      <RefModal
        isOpen={refModalOpen}
        onClose={() => {
          skipBlurRef.current = false;
          setRefModalOpen(false);
        }}
        onConfirm={handleRefConfirm}
        onRemove={existingRefRef.current ? handleRefRemove : undefined}
        defaultUrl={refModalUrl}
        defaultText={refModalText}
        defaultStyle={refModalStyle}
        defaultTarget={refModalTarget}
        defaultRel={refModalRel}
      />
      {refContextMenu && (
        <RefContextMenu
          x={refContextMenu.x}
          y={refContextMenu.y}
          onEdit={() => {
            setRefModalUrl(refContextMenu.ref.url || '');
            setRefModalText(refContextMenu.ref.text || '');
            setRefModalStyle(refContextMenu.ref.style);
            setRefModalTarget(refContextMenu.ref.target || '');
            setRefModalRel(refContextMenu.ref.rel || '');
            existingRefRef.current = refContextMenu.ref;
            existingRefElementRef.current = refContextMenu.element;
            savedRangeRef.current = null;
            setRefModalOpen(true);
            setRefContextMenu(null);
          }}
          onRemove={() => {
            const el = textRef.current;
            if (!el) return;
            if (refContextMenu.element) {
              const next = refContextMenu.element.nextSibling;
              if (next && next.nodeType === Node.TEXT_NODE && next.textContent === '\u200B') {
                next.remove();
              }
              refContextMenu.element.remove();
            }
            setRefContextMenu(null);
            setTimeout(() => {
              const markdown = htmlToMarkdown(el.innerHTML);
              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
            }, 0);
          }}
          onClose={() => setRefContextMenu(null)}
        />
      )}
    </>
  );
}

function EditableBlockquote({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { quote: string; citation?: string; align?: string; citationAlign?: string };
  const align = data.align || 'left';
  const citationAlign = data.citationAlign || 'left';
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const citeRef = useRef<HTMLParagraphElement>(null);
  const activeRef = useRef<'quote' | 'citation'>('quote');

  // Link modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalText, setLinkModalText] = useState('');
  const [linkModalUrl, setLinkModalUrl] = useState('');
  const [linkModalRel, setLinkModalRel] = useState('');
  const [linkModalTarget, setLinkModalTarget] = useState('');
  const savedRangeRef = useRef<Range | null>(null);
  const skipBlurRef = useRef(false);
  const existingLinkRef = useRef<{ text: string; url: string; rel: string; target: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; link: { text: string; url: string; rel: string; target: string } } | null>(null);

  // Ref modal state
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [refModalUrl, setRefModalUrl] = useState('');
  const [refModalText, setRefModalText] = useState('');
  const [refModalStyle, setRefModalStyle] = useState<'numeric' | 'alphabetic' | 'greek' | 'abjad'>('numeric');
  const [refModalTarget, setRefModalTarget] = useState('');
  const [refModalRel, setRefModalRel] = useState('');
  const existingRefRef = useRef<{ url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad'; target?: string; rel?: string } | null>(null);
  const existingRefElementRef = useRef<HTMLElement | null>(null);
  const [refContextMenu, setRefContextMenu] = useState<{ x: number; y: number; ref: { url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad'; target?: string; rel?: string }; element: HTMLElement } | null>(null);

  useLayoutEffect(() => {
    const el = quoteRef.current;
    if (el) {
      el.innerHTML = markdownToHtml(data.quote);
    }
  }, [data.quote]);

  useLayoutEffect(() => {
    const el = citeRef.current;
    if (el) {
      el.innerHTML = markdownToHtml(data.citation || '');
    }
  }, [data.citation]);

  const getActiveEl = () => {
    return activeRef.current === 'citation' ? citeRef.current : quoteRef.current;
  };

  const openLinkModal = (target: 'quote' | 'citation') => {
    activeRef.current = target;
    const el = target === 'citation' ? citeRef.current : quoteRef.current;
    if (!el) return;
    skipBlurRef.current = true;
    const existingLink = getLinkAtCursor(el);
    if (existingLink) {
      setLinkModalText(existingLink.text);
      setLinkModalUrl(existingLink.url);
      setLinkModalRel(existingLink.rel);
      setLinkModalTarget(existingLink.target);
      existingLinkRef.current = existingLink;
      savedRangeRef.current = null;
      setLinkModalOpen(true);
      return;
    }
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingLinkRef.current = null;
    setLinkModalText(selectedText);
    setLinkModalUrl('');
    setLinkModalRel('');
    setLinkModalTarget('');
    setLinkModalOpen(true);
  };

  const handleLinkConfirm = (url: string, rel: string, target: string) => {
    const el = getActiveEl();
    if (!el) return;
    skipBlurRef.current = false;
    const parts: string[] = [];
    if (rel) parts.push(`rel="${rel}"`);
    if (target) parts.push(`target="${target}"`);
    const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';
    const markdownText = `[${linkModalText}](${url})${attrs}`;
    if (existingLinkRef.current) {
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(markdownText));
        }
      });
    } else if (savedRangeRef.current) {
      el.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
      document.execCommand('insertText', false, markdownText);
    }
    skipBlurRef.current = false;
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    const field = activeRef.current;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, [field]: markdown } }));
    }, 0);
  };

  const handleLinkRemove = () => {
    const el = getActiveEl();
    if (!el) return;
    if (existingLinkRef.current) {
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(existingLinkRef.current.text));
        }
      });
    }
    skipBlurRef.current = false;
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    const field = activeRef.current;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, [field]: markdown } }));
    }, 0);
  };

  const openRefModal = (target: 'quote' | 'citation') => {
    activeRef.current = target;
    const el = target === 'citation' ? citeRef.current : quoteRef.current;
    if (!el) return;
    skipBlurRef.current = true;
    const existingRef = getRefAtCursor(el);
    if (existingRef) {
      setRefModalUrl(existingRef.url || '');
      setRefModalText(existingRef.text || '');
      setRefModalStyle(existingRef.style);
      setRefModalTarget(existingRef.target || '');
      setRefModalRel(existingRef.rel || '');
      existingRefRef.current = existingRef;
      existingRefElementRef.current = getRefElementAtCursor(el);
      savedRangeRef.current = null;
      setRefModalOpen(true);
      return;
    }
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingRefRef.current = null;
    existingRefElementRef.current = null;
    setRefModalText(selectedText);
    setRefModalUrl('');
    setRefModalStyle('numeric');
    setRefModalTarget('');
    setRefModalRel('');
    setRefModalOpen(true);
  };

  const handleRefConfirm = (url: string, text: string, style: 'numeric' | 'alphabetic' | 'greek' | 'abjad', target: string, rel: string) => {
    const el = getActiveEl();
    if (!el) return;
    skipBlurRef.current = false;
    const parts: string[] = [];
    parts.push(`text="${text}"`);
    parts.push(`style="${style}"`);
    if (target) parts.push(`target="${target}"`);
    if (rel) parts.push(`rel="${rel}"`);
    const attrs = `{${parts.join(' ')}}`;
    const markdownText = `[ref](${url})${attrs}`;
    if (existingRefElementRef.current) {
      existingRefElementRef.current.replaceWith(document.createTextNode(markdownText));
    } else if (savedRangeRef.current) {
      el.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
        selection.collapseToEnd();
      }
      document.execCommand('insertText', false, markdownText);
    }
    skipBlurRef.current = false;
    setRefModalOpen(false);
    existingRefRef.current = null;
    existingRefElementRef.current = null;
    savedRangeRef.current = null;
    const field = activeRef.current;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, [field]: markdown } }));
    }, 0);
  };

  const handleRefRemove = () => {
    const el = getActiveEl();
    if (!el) return;
    skipBlurRef.current = false;
    if (existingRefElementRef.current) {
      const next = existingRefElementRef.current.nextSibling;
      if (next && next.nodeType === Node.TEXT_NODE && next.textContent === '\u200B') {
        next.remove();
      }
      existingRefElementRef.current.remove();
      existingRefElementRef.current = null;
    }
    skipBlurRef.current = false;
    setRefModalOpen(false);
    existingRefRef.current = null;
    savedRangeRef.current = null;
    const field = activeRef.current;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, [field]: markdown } }));
    }, 0);
  };

  const makeEditableHandlers = (target: 'quote' | 'citation') => ({
    onBlur: (e: React.FocusEvent<HTMLParagraphElement>) => {
      if (skipBlurRef.current) return;
      const markdown = htmlToMarkdown(e.currentTarget.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, [target]: markdown } }));
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLParagraphElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openLinkModal(target);
      }
    },
    onContextMenu: (e: React.MouseEvent<HTMLParagraphElement>) => {
      const link = getLinkFromEvent(e);
      if (link) {
        e.preventDefault();
        activeRef.current = target;
        setContextMenu({ x: e.clientX, y: e.clientY, link });
        return;
      }
      const ref = getRefFromEvent(e);
      const refEl = getRefElementFromEvent(e);
      if (ref && refEl) {
        e.preventDefault();
        activeRef.current = target;
        setRefContextMenu({ x: e.clientX, y: e.clientY, ref, element: refEl });
      }
    },
  });

  return (
    <div className="pulse-editor-blockquote relative rounded-xl border border-[var(--neutral-200)] bg-gradient-to-br from-[var(--pulse-off-white)] via-white to-[var(--pulse-jasmine-light)] p-5 shadow-sm">
      {/* Decorative large quote mark */}
      <div className="pointer-events-none absolute left-3 top-1 select-none font-serif text-6xl leading-none text-[var(--pulse-jasmine)] opacity-70" aria-hidden="true">
        &#8220;
      </div>

      {/* Quote text */}
      <div className="relative z-10 flex items-start gap-2" style={{ textAlign: align as any }}>
        <p
          ref={quoteRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[1.5em] flex-1 pl-6 text-lg font-medium leading-relaxed text-[var(--pulse-black)] outline-none"
          {...makeEditableHandlers('quote')}
        />
        <div className="flex shrink-0 gap-1">
          <StudioTooltip text="Link selected text (Ctrl+K)" side="top">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => openLinkModal('quote')}
              className="rounded-md border border-[var(--neutral-200)] bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-600)] shadow-sm hover:bg-[var(--pulse-jasmine-light)] hover:text-[var(--pulse-black)] transition-colors"
            >
              Link
            </button>
          </StudioTooltip>
          <StudioTooltip text="Add reference citation" side="top">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => openRefModal('quote')}
              className="rounded-md border border-[var(--neutral-200)] bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-600)] shadow-sm hover:bg-[var(--pulse-jasmine-light)] hover:text-[var(--pulse-black)] transition-colors"
            >
              Ref
            </button>
          </StudioTooltip>
        </div>
      </div>

      {/* Citation */}
      <div className="relative z-10 mt-3 flex items-start gap-2" style={{ textAlign: citationAlign as any }}>
        <p
          ref={citeRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[1.2em] flex-1 text-sm font-semibold uppercase tracking-wide text-[var(--neutral-500)] outline-none placeholder:text-[var(--neutral-400)]"
          data-placeholder="Citation (optional)"
          {...makeEditableHandlers('citation')}
        />
        <div className="flex shrink-0 gap-1">
          <StudioTooltip text="Link selected text (Ctrl+K)" side="top">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => openLinkModal('citation')}
              className="rounded-md border border-[var(--neutral-200)] bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-600)] shadow-sm hover:bg-[var(--pulse-jasmine-light)] hover:text-[var(--pulse-black)] transition-colors"
            >
              Link
            </button>
          </StudioTooltip>
          <StudioTooltip text="Add reference citation" side="top">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => openRefModal('citation')}
              className="rounded-md border border-[var(--neutral-200)] bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-600)] shadow-sm hover:bg-[var(--pulse-jasmine-light)] hover:text-[var(--pulse-black)] transition-colors"
            >
              Ref
            </button>
          </StudioTooltip>
        </div>
      </div>

      {/* Alignment controls */}
      <div className="relative z-10 mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--neutral-200)] pt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-400)]">Quote</span>
        <div className="flex flex-wrap gap-1">
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, align: a } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                align === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--pulse-jasmine-light)] hover:text-[var(--pulse-black)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="mx-1 h-4 w-px bg-[var(--neutral-200)]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-400)]">Citation</span>
        <div className="flex flex-wrap gap-1">
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, citationAlign: a } }))}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                citationAlign === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--pulse-jasmine-light)] hover:text-[var(--pulse-black)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => {
          skipBlurRef.current = false;
          setLinkModalOpen(false);
        }}
        onConfirm={handleLinkConfirm}
        onRemove={linkModalUrl ? handleLinkRemove : undefined}
        defaultText={linkModalText}
        defaultUrl={linkModalUrl}
        defaultRel={linkModalRel}
        defaultTarget={linkModalTarget}
      />
      {contextMenu && (
        <LinkContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            setLinkModalText(contextMenu.link.text);
            setLinkModalUrl(contextMenu.link.url);
            setLinkModalRel(contextMenu.link.rel);
            setLinkModalTarget(contextMenu.link.target);
            existingLinkRef.current = contextMenu.link;
            savedRangeRef.current = null;
            setLinkModalOpen(true);
            setContextMenu(null);
          }}
          onRemove={() => {
            const el = getActiveEl();
            if (!el) return;
            const links = el.querySelectorAll('span.pulse-editor-link');
            links.forEach((span) => {
              if (span.textContent?.trim() === contextMenu.link.text && span.getAttribute('data-url') === contextMenu.link.url) {
                span.replaceWith(document.createTextNode(contextMenu.link.text));
              }
            });
            setContextMenu(null);
            setTimeout(() => {
              const markdown = htmlToMarkdown(el.innerHTML);
              const field = activeRef.current;
              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, [field]: markdown } }));
            }, 0);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      <RefModal
        isOpen={refModalOpen}
        onClose={() => {
          skipBlurRef.current = false;
          setRefModalOpen(false);
        }}
        onConfirm={handleRefConfirm}
        onRemove={existingRefRef.current ? handleRefRemove : undefined}
        defaultUrl={refModalUrl}
        defaultText={refModalText}
        defaultStyle={refModalStyle}
        defaultTarget={refModalTarget}
        defaultRel={refModalRel}
      />
      {refContextMenu && (
        <RefContextMenu
          x={refContextMenu.x}
          y={refContextMenu.y}
          onEdit={() => {
            setRefModalUrl(refContextMenu.ref.url || '');
            setRefModalText(refContextMenu.ref.text || '');
            setRefModalStyle(refContextMenu.ref.style);
            setRefModalTarget(refContextMenu.ref.target || '');
            setRefModalRel(refContextMenu.ref.rel || '');
            existingRefRef.current = refContextMenu.ref;
            existingRefElementRef.current = refContextMenu.element;
            savedRangeRef.current = null;
            setRefModalOpen(true);
            setRefContextMenu(null);
          }}
          onRemove={() => {
            const el = getActiveEl();
            if (!el) return;
            if (refContextMenu.element) {
              const next = refContextMenu.element.nextSibling;
              if (next && next.nodeType === Node.TEXT_NODE && next.textContent === '\u200B') {
                next.remove();
              }
              refContextMenu.element.remove();
            }
            setRefContextMenu(null);
            setTimeout(() => {
              const markdown = htmlToMarkdown(el.innerHTML);
              const field = activeRef.current;
              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, [field]: markdown } }));
            }, 0);
          }}
          onClose={() => setRefContextMenu(null)}
        />
      )}
    </div>
  );
}

const CODE_LANGUAGES = ['typescript', 'tsx', 'javascript', 'jsx', 'json', 'html', 'css', 'markdown', 'bash', 'python', 'go', 'rust'];
const CODE_MODES: { value: 'show' | 'run' | 'demo'; label: string; icon: React.ElementType }[] = [
  { value: 'show', label: 'Show', icon: Eye },
  { value: 'run', label: 'Run', icon: Play },
  { value: 'demo', label: 'Demo', icon: Sparkles },
];

function EditableCode({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { code: string; language: string; showLineNumbers?: boolean; mode?: 'show' | 'run' | 'demo'; hideChrome?: boolean; demoTitle?: string };
  const mode = data.mode ?? 'show';
  const hideChrome = data.hideChrome ?? true;
  const demoTitle = data.demoTitle ?? 'Live Demo';
  const [activeTab, setActiveTab] = useState<'code' | 'output'>('code');
  const [runKey, setRunKey] = useState(0);
  const outputIframeRef = useRef<HTMLIFrameElement>(null);

  const isRunnable = ['javascript', 'typescript', 'tsx', 'jsx', 'html', 'css', 'json'].includes(data.language);

  // Set iframe srcdoc whenever output tab becomes active or run is triggered
  useEffect(() => {
    if (activeTab === 'output' && outputIframeRef.current && isRunnable) {
      outputIframeRef.current.srcdoc = createSandboxHtml(data.code, data.language);
    }
  }, [activeTab, runKey, data.code, data.language, isRunnable]);

  const handleRun = useCallback(() => {
    if (mode === 'run') {
      setActiveTab('output');
      setRunKey(k => k + 1);
    }
  }, [mode]);

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={data.language}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, language: e.target.value } }))}
          className="rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] outline-none"
        >
          {CODE_LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        {/* Mode toggle */}
        <div className="inline-flex items-center rounded-lg border border-[var(--neutral-200)] bg-white overflow-hidden">
          {CODE_MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, mode: m.value } }))}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[var(--pulse-red)] text-white'
                    : 'text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]'
                }`}
                title={m.label}
              >
                <Icon className="h-3 w-3" />
                {m.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-[var(--neutral-600)]">
          <input
            type="checkbox"
            checked={data.showLineNumbers ?? true}
            onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, showLineNumbers: e.target.checked } }))}
            className="h-4 w-4 accent-[var(--pulse-red)]"
          />
          Line numbers
        </label>

        {mode === 'demo' && (
          <>
            <label className="flex items-center gap-1.5 text-xs text-[var(--neutral-600)]">
              <input
                type="checkbox"
                checked={hideChrome}
                onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, hideChrome: e.target.checked } }))}
                className="h-4 w-4 accent-[var(--pulse-red)]"
              />
              Clean result
            </label>
            {!hideChrome && (
              <input
                type="text"
                value={demoTitle}
                onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, demoTitle: e.target.value } }))}
                placeholder="Demo title"
                className="rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] outline-none w-28"
              />
            )}
          </>
        )}
      </div>

      {/* Code editor */}
      {mode === 'show' && (
        <div className="pulse-editor-code-block">
          <div className="pulse-editor-code-header">
            <Terminal className="h-3.5 w-3.5 text-[var(--pulse-red)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
              {data.language}
            </span>
          </div>
          <textarea
            value={data.code}
            onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, code: e.target.value } }))}
            rows={Math.max(4, data.code.split('\n').length)}
            className="pulse-editor-code-textarea"
            placeholder="Type your code here..."
            spellCheck={false}
          />
        </div>
      )}

      {mode === 'run' && (
        <div className="pulse-editor-code-block" data-active-tab={activeTab}>
          <div className="pulse-editor-code-header">
            <Terminal className="h-3.5 w-3.5 text-[var(--pulse-red)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
              {data.language}
            </span>
            <div className="pulse-code-tabs" style={{ marginLeft: 'auto' }}>
              <button
                className={`pulse-code-tab ${activeTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                Code
              </button>
              <button
                className={`pulse-code-tab ${activeTab === 'output' ? 'active' : ''}`}
                onClick={() => setActiveTab('output')}
              >
                Output
              </button>
            </div>
            <button onClick={handleRun} className="pulse-code-run-btn" style={{ marginLeft: '0.5rem' }}>
              <Play className="h-3 w-3" />
              Run
            </button>
          </div>
          <div className="pulse-code-body" style={{ overflowX: 'visible' }}>
            <div className="pulse-code-panel" data-panel="code" style={{ display: activeTab === 'code' ? 'block' : 'none' }}>
              <textarea
                value={data.code}
                onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, code: e.target.value } }))}
                rows={Math.max(4, data.code.split('\n').length)}
                className="pulse-editor-code-textarea"
                placeholder="Type your code here..."
                spellCheck={false}
              />
            </div>
            <div className="pulse-code-panel" data-panel="output" style={{ display: activeTab === 'output' ? 'block' : 'none' }}>
              {isRunnable && (
                <iframe
                  ref={outputIframeRef}
                  title="Code output"
                  sandbox="allow-scripts"
                  style={{ width: '100%', minHeight: '120px', border: 'none', display: 'block', background: '#1e1e2e' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {mode === 'demo' && (
        <div className="pulse-editor-code-block">
          <div className="pulse-editor-code-header">
            <Terminal className="h-3.5 w-3.5 text-[var(--pulse-red)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
              {data.language}
            </span>
          </div>
          <textarea
            value={data.code}
            onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, code: e.target.value } }))}
            rows={Math.max(4, data.code.split('\n').length)}
            className="pulse-editor-code-textarea"
            placeholder="Type your code here..."
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}

const ABJAD_LETTERS = [
  'ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن',
  'س', 'ع', 'ف', 'ص', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ',
];

function getAbjadMarker(index: number): string {
  if (index < 1) return 'ا';
  if (index <= ABJAD_LETTERS.length) return ABJAD_LETTERS[index - 1];
  const cycles = Math.floor((index - 1) / ABJAD_LETTERS.length);
  const remainder = ((index - 1) % ABJAD_LETTERS.length) + 1;
  const letter = ABJAD_LETTERS[remainder - 1];
  return cycles > 0 ? `${letter}(${cycles + 1})` : letter;
}

function EditableList({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { style: 'unordered' | 'numeric' | 'roman' | 'abjad'; items: string[]; align?: string };
  const align = data.align || 'left';
  const ListTag = data.style === 'unordered' ? 'ul' : 'ol';
  const listStyleClass =
    data.style === 'unordered' ? 'list-disc' :
    data.style === 'roman' ? 'list-[upper-roman]' :
    data.style === 'abjad' ? 'pulse-editor-list-abjad' :
    'list-decimal';

  const styleOptions: { value: typeof data.style; label: string }[] = [
    { value: 'unordered', label: 'Bullet' },
    { value: 'numeric', label: 'Numbered' },
    { value: 'roman', label: 'Roman' },
    { value: 'abjad', label: 'ابجد' },
  ];

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalText, setLinkModalText] = useState('');
  const [linkModalUrl, setLinkModalUrl] = useState('');
  const [linkModalRel, setLinkModalRel] = useState('');
  const [linkModalTarget, setLinkModalTarget] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const skipBlurRef = useRef(false);
  const existingLinkRef = useRef<{ text: string; url: string; rel: string; target: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; link: { text: string; url: string; rel: string; target: string }; itemIndex: number } | null>(null);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [refModalUrl, setRefModalUrl] = useState('');
  const [refModalText, setRefModalText] = useState('');
  const [refModalStyle, setRefModalStyle] = useState<'numeric' | 'alphabetic' | 'greek' | 'abjad'>('numeric');
  const [refModalTarget, setRefModalTarget] = useState('');
  const [refModalRel, setRefModalRel] = useState('');
  const existingRefRef = useRef<{ url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad'; target?: string; rel?: string } | null>(null);
  const [refContextMenu, setRefContextMenu] = useState<{ x: number; y: number; ref: { url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad'; target?: string; rel?: string }; itemIndex: number } | null>(null);

  // Sync innerHTML only for non-focused items to avoid wiping unsaved edits
  useLayoutEffect(() => {
    data.items.forEach((item, i) => {
      const el = itemRefs.current[i];
      if (!el) return;
      if (document.activeElement === el) return;
      const expected = markdownToHtml(item);
      if (el.innerHTML !== expected) {
        el.innerHTML = expected;
      }
    });
  }, [data.items]);

  const openLinkModal = (itemIndex: number) => {
    const el = itemRefs.current[itemIndex];
    if (!el) return;
    skipBlurRef.current = true;
    setActiveItemIndex(itemIndex);

    const existingLink = getLinkAtCursor(el);
    if (existingLink) {
      setLinkModalText(existingLink.text);
      setLinkModalUrl(existingLink.url);
      setLinkModalRel(existingLink.rel);
      setLinkModalTarget(existingLink.target);
      existingLinkRef.current = existingLink;
      savedRangeRef.current = null;
      setLinkModalOpen(true);
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingLinkRef.current = null;
    setLinkModalText(selectedText);
    setLinkModalUrl('');
    setLinkModalRel('');
    setLinkModalTarget('');
    setLinkModalOpen(true);
  };

  const handleLinkConfirm = (url: string, rel: string, target: string) => {
    if (activeItemIndex === null) return;
    const el = itemRefs.current[activeItemIndex];
    if (!el) return;
    skipBlurRef.current = false;
    const parts: string[] = [];
    if (rel) parts.push(`rel="${rel}"`);
    if (target) parts.push(`target="${target}"`);
    const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';
    const markdownText = `[${linkModalText}](${url})${attrs}`;

    if (existingLinkRef.current) {
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(markdownText));
        }
      });
    } else if (savedRangeRef.current) {
      el.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
      document.execCommand('insertText', false, markdownText);
    }

    skipBlurRef.current = false;
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    setActiveItemIndex(null);
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      const next = [...data.items];
      next[activeItemIndex] = markdown;
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
    }, 0);
  };

  const handleLinkRemove = () => {
    if (activeItemIndex === null) return;
    const el = itemRefs.current[activeItemIndex];
    if (!el) return;
    skipBlurRef.current = false;

    if (existingLinkRef.current) {
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(existingLinkRef.current.text));
        }
      });
    }

    skipBlurRef.current = false;
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    setActiveItemIndex(null);
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      const next = [...data.items];
      next[activeItemIndex] = markdown;
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
    }, 0);
  };

  const openRefModal = (itemIndex: number) => {
    const el = itemRefs.current[itemIndex];
    if (!el) return;
    skipBlurRef.current = true;
    setActiveItemIndex(itemIndex);
    const existingRef = getRefAtCursor(el);
    if (existingRef) {
      setRefModalUrl(existingRef.url || '');
      setRefModalText(existingRef.text || '');
      setRefModalStyle(existingRef.style);
      setRefModalTarget(existingRef.target || '');
      setRefModalRel(existingRef.rel || '');
      existingRefRef.current = existingRef;
      savedRangeRef.current = null;
      setRefModalOpen(true);
      return;
    }
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingRefRef.current = null;
    setRefModalText(selectedText);
    setRefModalUrl('');
    setRefModalStyle('numeric');
    setRefModalTarget('');
    setRefModalRel('');
    setRefModalOpen(true);
  };

  const handleRefConfirm = (url: string, text: string, style: 'numeric' | 'alphabetic' | 'greek' | 'abjad', target: string, rel: string) => {
    if (activeItemIndex === null) return;
    const el = itemRefs.current[activeItemIndex];
    if (!el) return;
    skipBlurRef.current = false;
    const parts: string[] = [];
    parts.push(`text="${text}"`);
    parts.push(`style="${style}"`);
    if (target) parts.push(`target="${target}"`);
    if (rel) parts.push(`rel="${rel}"`);
    const attrs = `{${parts.join(' ')}}`;
    const markdownText = `[ref](${url})${attrs}`;

    // Find and replace existing ref by matching attributes (robust against re-renders)
    if (existingRefRef.current) {
      const refs = el.querySelectorAll('span.pulse-editor-ref');
      let replaced = false;
      refs.forEach((span) => {
        if (!replaced &&
            span.getAttribute('data-url') === existingRefRef.current?.url &&
            span.getAttribute('data-text') === existingRefRef.current?.text &&
            span.getAttribute('data-style') === existingRefRef.current?.style) {
          span.replaceWith(document.createTextNode(markdownText));
          replaced = true;
        }
      });
      if (!replaced && savedRangeRef.current) {
        el.focus();
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(savedRangeRef.current);
          selection.collapseToEnd();
        }
        document.execCommand('insertText', false, markdownText);
      }
    } else if (savedRangeRef.current) {
      el.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
        selection.collapseToEnd();
      }
      document.execCommand('insertText', false, markdownText);
    }

    skipBlurRef.current = false;
    setRefModalOpen(false);
    existingRefRef.current = null;
    savedRangeRef.current = null;
    setActiveItemIndex(null);
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      const next = [...data.items];
      next[activeItemIndex] = markdown;
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
    }, 0);
  };

  const handleRefRemove = () => {
    if (activeItemIndex === null) return;
    const el = itemRefs.current[activeItemIndex];
    if (!el) return;
    skipBlurRef.current = false;

    if (existingRefRef.current) {
      const refs = el.querySelectorAll('span.pulse-editor-ref');
      refs.forEach((span) => {
        if (span.getAttribute('data-url') === existingRefRef.current?.url &&
            span.getAttribute('data-text') === existingRefRef.current?.text &&
            span.getAttribute('data-style') === existingRefRef.current?.style) {
          const next = span.nextSibling;
          if (next && next.nodeType === Node.TEXT_NODE && next.textContent === '\u200B') {
            next.remove();
          }
          span.remove();
        }
      });
    }

    skipBlurRef.current = false;
    setRefModalOpen(false);
    existingRefRef.current = null;
    savedRangeRef.current = null;
    setActiveItemIndex(null);
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      const next = [...data.items];
      next[activeItemIndex] = markdown;
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
    }, 0);
  };

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, itemIndex: number) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openLinkModal(itemIndex);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      const next = [...data.items];
      next.splice(itemIndex + 1, 0, '');
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
      setTimeout(() => {
        const newEl = itemRefs.current[itemIndex + 1];
        if (newEl) {
          newEl.focus();
          const selection = window.getSelection();
          const range = document.createRange();
          range.setStart(newEl, 0);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  };

  return (
    <>
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <select
            value={data.style || 'unordered'}
            onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, style: e.target.value as typeof data.style } }))}
            className="rounded-md border border-[var(--neutral-200)] bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-700)] outline-none focus:border-[var(--pulse-red)]"
          >
            {styleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="h-4 w-px bg-[var(--neutral-200)]" />
          {(['left','center','right','justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, align: a } }))}
              className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                align === a ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
              }`}
            >
              {a}
            </button>
          ))}
          <StudioTooltip text="Link selected text in focused item (Ctrl+K)" side="top">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => focusedItemIndex !== null && openLinkModal(focusedItemIndex)}
              className="rounded-md border border-[var(--neutral-200)] bg-white px-2 py-1 text-[10px] font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] disabled:opacity-40"
              disabled={focusedItemIndex === null}
            >
              Link
            </button>
          </StudioTooltip>
          <StudioTooltip text="Add reference to focused item" side="top">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => focusedItemIndex !== null && openRefModal(focusedItemIndex)}
              className="rounded-md border border-[var(--neutral-200)] bg-white px-2 py-1 text-[10px] font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] disabled:opacity-40"
              disabled={focusedItemIndex === null}
            >
              Ref
            </button>
          </StudioTooltip>
        </div>
        <ListTag className={listStyleClass} style={{ textAlign: align as any }}>
          {data.items.map((item, i) => (
            <li key={i} className="mb-2" data-marker={data.style === 'abjad' ? getAbjadMarker(i + 1) : undefined}>
              <div className="flex items-start gap-2">
                <div
                  ref={(el) => { itemRefs.current[i] = el; }}
                  contentEditable
                  suppressContentEditableWarning
                  className="min-w-0 flex-1 min-h-[1.5em] rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-sm text-[var(--neutral-700)] outline-none"
                  style={{ textAlign: align as any }}
                  onFocus={() => setFocusedItemIndex(i)}
                  onBlur={(e) => {
                    setFocusedItemIndex((prev) => prev === i ? null : prev);
                    if (skipBlurRef.current) return;
                    const markdown = htmlToMarkdown(e.currentTarget.innerHTML);
                    const next = [...data.items];
                    next[i] = markdown;
                    adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
                  }}
                  onKeyDown={(e) => handleItemKeyDown(e, i)}
                  onContextMenu={(e) => {
                    const link = getLinkFromEvent(e);
                    if (link) {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, link, itemIndex: i });
                      return;
                    }
                    const ref = getRefFromEvent(e);
                    const refEl = getRefElementFromEvent(e);
                    if (ref && refEl) {
                      e.preventDefault();
                      setRefContextMenu({ x: e.clientX, y: e.clientY, ref, itemIndex: i });
                    }
                  }}
                />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      const next = data.items.filter((_, idx) => idx !== i);
                      itemRefs.current = itemRefs.current.filter((_, idx) => idx !== i);
                      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next.length ? next : [''] } }));
                    }}
                    className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ListTag>
        <button
          onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: [...data.items, ''] } }))}
          className="mt-2 inline-flex items-center gap-1 rounded-md bg-[var(--neutral-100)] px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-200)]"
        >
          <Plus className="h-3 w-3" />
          Add item
        </button>
      </div>
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => {
          skipBlurRef.current = false;
          setLinkModalOpen(false);
          setActiveItemIndex(null);
        }}
        onConfirm={handleLinkConfirm}
        onRemove={linkModalUrl ? handleLinkRemove : undefined}
        defaultText={linkModalText}
        defaultUrl={linkModalUrl}
        defaultRel={linkModalRel}
        defaultTarget={linkModalTarget}
      />
      {contextMenu && (
        <LinkContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            setLinkModalText(contextMenu.link.text);
            setLinkModalUrl(contextMenu.link.url);
            setLinkModalRel(contextMenu.link.rel);
            setLinkModalTarget(contextMenu.link.target);
            existingLinkRef.current = contextMenu.link;
            savedRangeRef.current = null;
            setActiveItemIndex(contextMenu.itemIndex);
            setLinkModalOpen(true);
            setContextMenu(null);
          }}
          onRemove={() => {
            const el = itemRefs.current[contextMenu.itemIndex];
            if (!el) return;
            const links = el.querySelectorAll('span.pulse-editor-link');
            links.forEach((span) => {
              if (span.textContent?.trim() === contextMenu.link.text && span.getAttribute('data-url') === contextMenu.link.url) {
                span.replaceWith(document.createTextNode(contextMenu.link.text));
              }
            });
            setContextMenu(null);
            setTimeout(() => {
              const markdown = htmlToMarkdown(el.innerHTML);
              const next = [...data.items];
              next[contextMenu.itemIndex] = markdown;
              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
            }, 0);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      <RefModal
        isOpen={refModalOpen}
        onClose={() => {
          skipBlurRef.current = false;
          setRefModalOpen(false);
          setActiveItemIndex(null);
        }}
        onConfirm={handleRefConfirm}
        onRemove={existingRefRef.current ? handleRefRemove : undefined}
        defaultUrl={refModalUrl}
        defaultText={refModalText}
        defaultStyle={refModalStyle}
        defaultTarget={refModalTarget}
        defaultRel={refModalRel}
      />
      {refContextMenu && (
        <RefContextMenu
          x={refContextMenu.x}
          y={refContextMenu.y}
          onEdit={() => {
            setRefModalUrl(refContextMenu.ref.url || '');
            setRefModalText(refContextMenu.ref.text || '');
            setRefModalStyle(refContextMenu.ref.style);
            setRefModalTarget(refContextMenu.ref.target || '');
            setRefModalRel(refContextMenu.ref.rel || '');
            existingRefRef.current = refContextMenu.ref;
            savedRangeRef.current = null;
            setActiveItemIndex(refContextMenu.itemIndex);
            setRefModalOpen(true);
            setRefContextMenu(null);
          }}
          onRemove={() => {
            const el = itemRefs.current[refContextMenu.itemIndex];
            if (!el) return;
            const refs = el.querySelectorAll('span.pulse-editor-ref');
            refs.forEach((span) => {
              if (span.getAttribute('data-url') === refContextMenu.ref.url &&
                  span.getAttribute('data-text') === refContextMenu.ref.text &&
                  span.getAttribute('data-style') === refContextMenu.ref.style) {
                const next = span.nextSibling;
                if (next && next.nodeType === Node.TEXT_NODE && next.textContent === '\u200B') {
                  next.remove();
                }
                span.remove();
              }
            });
            setRefContextMenu(null);
            setTimeout(() => {
              const markdown = htmlToMarkdown(el.innerHTML);
              const next = [...data.items];
              next[refContextMenu.itemIndex] = markdown;
              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
            }, 0);
          }}
          onClose={() => setRefContextMenu(null)}
        />
      )}
    </>
  );
}

function GenericBlockPlaceholder({ block }: { block: Block<BlockData> }) {
  const Icon = blockTypeToIcon[block.type] || FileText;
  const label = blockTypeToLabel[block.type] || block.type;
  return (
    <div className="flex items-center gap-4 rounded-xl border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
        <Icon className="h-5 w-5 text-[var(--neutral-500)]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--pulse-black)]">{label}</p>
        <p className="text-xs text-[var(--neutral-500)]">
          This block is rendered in the preview pane on the right.
        </p>
      </div>
    </div>
  );
}

function EditableBlock({
  block,
  adapter,
  isFirst,
  isLast,
  index,
  total,
  commentCount,
  activeCommentCount,
  onCommentClick,
  onAddComment,
  isPulsing,
}: {
  block: Block<BlockData>;
  adapter: EditorStateAdapter<Block<BlockData>>;
  isFirst: boolean;
  isLast: boolean;
  index: number;
  total: number;
  commentCount?: number;
  activeCommentCount?: number;
  onCommentClick?: () => void;
  onAddComment?: () => void;
  isPulsing?: boolean;
}) {
  const [isActive, setIsActive] = useState(false);
  const [moveTarget, setMoveTarget] = useState('');

  const content = useMemo(() => {
    switch (block.type) {
      case 'heading': return <EditableHeading block={block} adapter={adapter} />;
      case 'text': return <EditableText block={block} adapter={adapter} />;
      case 'blockquote': return <EditableBlockquote block={block} adapter={adapter} />;
      case 'code': return <EditableCode block={block} adapter={adapter} />;
      case 'code-sandbox': return <EditableCodeSandbox block={block} adapter={adapter} />;
      case 'list': return <EditableList block={block} adapter={adapter} />;
      case 'callout': return <EditableCallout block={block} adapter={adapter} />;
      case 'horizontal-rule': return <EditableHorizontalRule />;
      case 'link': return <EditableLink block={block} adapter={adapter} />;
      case 'image': return <EditableImage block={block} adapter={adapter} />;
      case 'video': return <EditableVideo block={block} adapter={adapter} />;
      case 'audio': return <EditableAudio block={block} adapter={adapter} />;
      case 'embed': return <EditableEmbed block={block} adapter={adapter} />;
      case 'file': return <EditableFile block={block} adapter={adapter} />;
      case 'table': return <EditableTable block={block} adapter={adapter} />;
      case 'alert': return <EditableAlert block={block} adapter={adapter} />;
      case 'quiz': return <EditableQuiz block={block} adapter={adapter} />;
      case 'poll': return <EditablePoll block={block} adapter={adapter} />;
      case 'accordion': return <EditableAccordion block={block} adapter={adapter} />;
      case 'tabs': return <EditableTabs block={block} adapter={adapter} />;
      case 'toggle': return <EditableToggle block={block} adapter={adapter} />;
      case 'spoiler': return <EditableSpoiler block={block} adapter={adapter} />;
      case 'flashcard': return <EditableFlashcard block={block} adapter={adapter} />;
      case 'timeline': return <EditableTimeline block={block} adapter={adapter} />;
      case 'comparison': return <EditableComparison block={block} adapter={adapter} />;
      case 'before-after': return <EditableBeforeAfter block={block} adapter={adapter} />;
      case 'chart': return <EditableChart block={block} adapter={adapter} />;
      case 'map': return <EditableMap block={block} adapter={adapter} />;
      case 'math-equation': return <EditableMath block={block} adapter={adapter} />;
      case 'diagram': return <EditableDiagram block={block} adapter={adapter} />;
      case 'manga-panel': return <EditableManga block={block} adapter={adapter} />;
      case 'speech-bubble': return <EditableSpeechBubble block={block} adapter={adapter} />;
      case 'card': return <EditableCard block={block} adapter={adapter} />;
      case 'gallery': return <EditableGallery block={block} adapter={adapter} />;
      case 'carousel': return <EditableCarousel block={block} adapter={adapter} />;
      case 'hero-section': return <EditableHeroSection block={block} adapter={adapter} />;
      case 'annotated-image': return <EditableAnnotatedImage block={block} adapter={adapter} />;
      default: return <GenericBlockPlaceholder block={block} />;
    }
  }, [block, adapter]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== block.id) {
          const fromIdx = adapter.getSnapshot().document.blocks.findIndex((b) => b.id === draggedId);
          const toIdx = adapter.getSnapshot().document.blocks.findIndex((b) => b.id === block.id);
          if (fromIdx !== -1 && toIdx !== -1) {
            adapter.moveBlock(draggedId, toIdx);
          }
        }
      }}
      data-block-id={block.id}
      className={`group relative flex items-start gap-2 rounded-xl border border-transparent bg-white p-4 shadow-sm transition-all transition-shadow duration-500 hover:border-[var(--neutral-200)] ${
        isActive ? 'border-[var(--pulse-red)]/30 ring-1 ring-[var(--pulse-red)]/20' : ''
      } ${isPulsing ? 'animate-block-pulse' : ''}`}
      onClick={() => setIsActive(true)}
      onBlur={() => setIsActive(false)}
      tabIndex={-1}
    >
      {/* Subtle left-edge marker for active comments */}
      {activeCommentCount !== undefined && activeCommentCount > 0 && (
        <StudioTooltip text={`${activeCommentCount} unresolved comment${activeCommentCount > 1 ? 's' : ''}`} side="left">
          <button
            onClick={(e) => { e.stopPropagation(); onCommentClick?.(); }}
            className="absolute -left-[3px] top-3 bottom-3 w-[3px] rounded-full bg-amber-400/80 hover:bg-amber-500 transition-colors"
          />
        </StudioTooltip>
      )}

      {/* Left controls: drag handle + block number */}
      <div className="flex flex-col items-center gap-1 pt-1">
        <StudioTooltip text="Drag to reorder" side="left">
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', block.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="cursor-grab active:cursor-grabbing rounded p-1 text-[var(--neutral-300)] hover:text-[var(--neutral-500)]"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </StudioTooltip>
        <span className="text-[9px] font-bold text-[var(--neutral-400)]">{index + 1}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {content}
      </div>

      {/* Comment indicator (always visible when comments exist) */}
      {commentCount !== undefined && commentCount > 0 && (
        <StudioTooltip text={`${commentCount} comment${commentCount > 1 ? 's' : ''}`} side="right">
          <button
            onClick={(e) => { e.stopPropagation(); onCommentClick?.(); }}
            className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full ml-2 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 shadow-sm hover:bg-amber-200 transition-colors"
          >
            <MessageSquare className="h-2.5 w-2.5" />
            {commentCount}
          </button>
        </StudioTooltip>
      )}

      {/* Hover actions */}
      <div className="absolute -right-2 -top-2 hidden items-center gap-1 rounded-lg border border-[var(--neutral-200)] bg-white p-1 shadow-sm group-hover:flex">
        <StudioTooltip text="Move up" side="top">
          <button
            onClick={() => { const idx = adapter.getSnapshot().document.blocks.findIndex((b) => b.id === block.id); if (idx > 0) adapter.moveBlock(block.id, idx - 1); }}
            disabled={isFirst}
            className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] disabled:opacity-30"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
        </StudioTooltip>
        <StudioTooltip text="Move down" side="top">
          <button
            onClick={() => { const idx = adapter.getSnapshot().document.blocks.findIndex((b) => b.id === block.id); if (idx < total - 1) adapter.moveBlock(block.id, idx + 1); }}
            disabled={isLast}
            className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)] disabled:opacity-30"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </StudioTooltip>
        <div className="mx-0.5 h-3 w-px bg-[var(--neutral-200)]" />
        <div className="flex items-center gap-1 px-1">
          <span className="text-[9px] text-[var(--neutral-400)]">Move to</span>
          <input
            type="number"
            min={1}
            max={total}
            value={moveTarget}
            onChange={(e) => setMoveTarget(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                let target = parseInt(moveTarget, 10);
                if (!isNaN(target)) {
                  if (target < 1) target = 1;
                  if (target > total) target = total;
                  adapter.moveBlock(block.id, target - 1);
                }
                setMoveTarget('');
              }
            }}
            onBlur={() => {
              let target = parseInt(moveTarget, 10);
              if (!isNaN(target)) {
                if (target < 1) target = 1;
                if (target > total) target = total;
                adapter.moveBlock(block.id, target - 1);
              }
              setMoveTarget('');
            }}
            placeholder="#"
            className="w-8 rounded border border-[var(--neutral-200)] px-1 py-0.5 text-[10px] text-center outline-none focus:border-[var(--pulse-red)]"
          />
        </div>
        <div className="mx-0.5 h-3 w-px bg-[var(--neutral-200)]" />
        <StudioTooltip text="Add comment to this block" side="top">
          <button
            onClick={() => onAddComment?.()}
            className="rounded p-1 text-[var(--neutral-400)] hover:bg-amber-50 hover:text-amber-600"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
        </StudioTooltip>
        <StudioTooltip text="Duplicate" side="top">
          <button
            onClick={() => {
              const dup = { ...block, id: `dup-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Block<BlockData>;
              adapter.insertBlock(dup, index + 1);
            }}
            className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </StudioTooltip>
        <StudioTooltip text="Duplicate without content" side="top">
          <button
            onClick={() => {
              const blockDef = BUILTIN_BLOCK_DEFINITIONS.find(d => d.type === block.type);
              const rawDefault = blockDef
                ? (typeof blockDef.defaultData === 'function' ? blockDef.defaultData() : blockDef.defaultData)
                : {};
              const emptyData = rawDefault ? JSON.parse(JSON.stringify(rawDefault)) : {};
              const dup = {
                ...block,
                id: `dup-${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: emptyData,
              } as Block<BlockData>;
              adapter.insertBlock(dup, index + 1);
            }}
            className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-red)]"
          >
            <CopyX className="h-3.5 w-3.5" />
          </button>
        </StudioTooltip>
        <StudioTooltip text="Delete" side="top">
          <button
            onClick={() => adapter.removeBlock(block.id)}
            className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-red)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </StudioTooltip>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Canvas Component â”€â”€â”€

export default function StudioBlockCanvas({
  adapter,
  blocks,
  blockCommentCounts,
  blockActiveCommentCounts,
  pulseBlockId,
  onBlockCommentClick,
  onAddBlockComment,
}: {
  adapter: EditorStateAdapter<Block<BlockData>> | null;
  blocks: Block<BlockData>[];
  blockCommentCounts?: Record<string, number>;
  blockActiveCommentCounts?: Record<string, number>;
  pulseBlockId?: string | null;
  onBlockCommentClick?: (blockId: string) => void;
  onAddBlockComment?: (blockId: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [positionMode, setPositionMode] = useState<{ type: string } | null>(null);
  const positionInputRef = useRef<HTMLInputElement>(null);

  // Globally renumber all inline references so they are sequential across blocks
  useLayoutEffect(() => {
    const container = editorRef.current;
    if (!container) return;
    const refs = container.querySelectorAll('.pulse-editor-ref');
    refs.forEach((span, index) => {
      const style = (span.getAttribute('data-style') || 'numeric') as import('@pulse/blocks').ReferenceStyle;
      span.textContent = formatReferenceNumber(index + 1, style);
    });
  });

  const allDefs = useMemo(() => [...(BUILTIN_BLOCK_DEFINITIONS as unknown as any[])], []);
  const closePalette = useCallback(() => {
    setShowPalette(false);
    setPositionMode(null);
  }, []);

  function parsePath(query: string): { category: string | null; blockQuery: string } {
    const trimmed = query.trim().toLowerCase();
    const hasTrigger = trimmed.startsWith('/');
    if (!hasTrigger) return { category: activeCategory === 'All' ? null : activeCategory, blockQuery: trimmed };
    const parts = trimmed.slice(1).split('/').filter(Boolean);
    if (parts.length === 0) return { category: null, blockQuery: '' };
    if (parts.length === 1) {
      // Could be category or block
      const catMatch = allDefs.find((d) => (d.config?.category || 'basic').toLowerCase() === parts[0]);
      if (catMatch) return { category: catMatch.config?.category || 'basic', blockQuery: '' };
      return { category: null, blockQuery: parts[0] };
    }
    // length >= 2: first part is category, rest is block query
    const category = parts[0];
    const blockQuery = parts.slice(1).join(' ');
    return { category, blockQuery };
  }

  function tabComplete(query: string): string {
    const trimmed = query.trim().toLowerCase();
    const hasTrigger = trimmed.startsWith('/');
    if (!hasTrigger) {
      const match = allDefs.find((d) => (blockTypeToLabel[d.type] || d.type).toLowerCase().startsWith(trimmed));
      return match ? `/${blockTypeToLabel[match.type] || match.type}`.toLowerCase().replace(/\s+/g, '-') : query;
    }

    // Special case: cycle through heading levels with Tab
    const headingMatch = trimmed.match(/^\/heading[-\s]*(\d)?$/);
    if (headingMatch) {
      const currentLevel = headingMatch[1] ? parseInt(headingMatch[1], 10) : 0;
      const nextLevel = currentLevel >= 6 ? 1 : currentLevel + 1;
      return `/heading-${nextLevel}`;
    }

    const parts = trimmed.slice(1).split('/').filter(Boolean);
    if (parts.length === 0) return query;
    if (parts.length === 1) {
      const prefix = parts[0];
      const catMatch = Array.from(new Set(allDefs.map((d) => d.config?.category || 'basic')))
        .find((c) => c.toLowerCase().startsWith(prefix));
      if (catMatch) return `/${catMatch.toLowerCase()}/`;
      const blockMatch = allDefs.find((d) => (blockTypeToLabel[d.type] || d.type).toLowerCase().startsWith(prefix));
      if (blockMatch) return `/${(blockTypeToLabel[blockMatch.type] || blockMatch.type).toLowerCase().replace(/\s+/g, '-')}`;
    }
    if (parts.length >= 2) {
      const category = parts[0];
      const blockPrefix = parts[1];
      const blockMatch = allDefs
        .filter((d) => (d.config?.category || 'basic').toLowerCase() === category)
        .find((d) => (blockTypeToLabel[d.type] || d.type).toLowerCase().startsWith(blockPrefix));
      if (blockMatch) return `/${category}/${(blockTypeToLabel[blockMatch.type] || blockMatch.type).toLowerCase().replace(/\s+/g, '-')}`;
    }
    return query;
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ or Cmd+/ opens palette from anywhere; plain / opens only when not typing in an input/textarea/contenteditable
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowPalette(true);
        return;
      }
      if (e.key === '/' && !e.shiftKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName || '')) {
        const target = e.target as HTMLElement;
        if (target.isContentEditable) return;
        e.preventDefault();
        setShowPalette(true);
      }
      if (e.key === 'Escape' && (showPalette || positionMode)) {
        e.preventDefault();
        e.stopPropagation();
        closePalette();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closePalette, positionMode, showPalette]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allDefs.forEach((d) => cats.add(d.config?.category || 'basic'));
    return ['All', ...Array.from(cats).sort()];
  }, [allDefs]);

  const { category: pathCategory, blockQuery } = useMemo(() => parsePath(paletteQuery), [paletteQuery]);

  const filteredDefs = useMemo(() => {
    let defs = [...allDefs];
    const effectiveCategory = pathCategory ?? (activeCategory !== 'All' ? activeCategory : null);
    if (effectiveCategory) {
      defs = defs.filter((d) => (d.config?.category || 'basic').toLowerCase() === effectiveCategory.toLowerCase());
    }
    let headingMatch: RegExpMatchArray | null = null;
    if (blockQuery.trim()) {
      const q = blockQuery.toLowerCase();
      headingMatch = q.match(/^heading[-\s]*(\d)?/);
      defs = defs.filter((d) => {
        const label = (blockTypeToLabel[d.type] || d.name).toLowerCase();
        if (headingMatch && d.type === 'heading') return true;
        return label.includes(q);
      });
    }
    // Expand heading into levels when heading is in results
    const hasHeading = defs.some((d) => d.type === 'heading');
    if (hasHeading) {
      const nonHeadings = defs.filter((d) => d.type !== 'heading');
      const headingDef = defs.find((d) => d.type === 'heading');
      const requestedLevel = headingMatch?.[1] ? parseInt(headingMatch[1], 10) : null;
      const levels = requestedLevel && requestedLevel >= 1 && requestedLevel <= 6
        ? [requestedLevel]
        : [1, 2, 3, 4, 5, 6];
      const headingLevels = levels.map((level) => ({
        ...headingDef,
        _headingLevel: level,
      }));
      return [...nonHeadings, ...headingLevels];
    }
    return defs;
  }, [activeCategory, pathCategory, blockQuery, allDefs]);

  const insertAtPosition = (type: string, pos?: number, dataOverrides?: Record<string, unknown>) => {
    if (!adapter) return;
    const block = createStudioBlock(type, dataOverrides);
    adapter.insertBlock(block);
    if (typeof pos === 'number' && pos >= 0) {
      const current = adapter.getSnapshot().document.blocks;
      const currentIdx = current.findIndex((b) => b.id === block.id);
      if (currentIdx !== -1 && currentIdx !== pos && pos < current.length) {
        adapter.moveBlock(block.id, pos);
      }
    }
    adapter.setFocusedBlock(block.id);
    setShowPalette(false);
    setPaletteQuery('');
    setPositionMode(null);
  };

  const insert = (type: string, dataOverrides?: Record<string, unknown>) => insertAtPosition(type, undefined, dataOverrides);

  const breadcrumb = useMemo(() => {
    const trimmed = paletteQuery.trim().toLowerCase();
    const hasTrigger = trimmed.startsWith('/');
    if (!hasTrigger) return null;
    const parts = trimmed.slice(1).split('/').filter(Boolean);
    return parts;
  }, [paletteQuery]);

  return (
    <>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--neutral-500)]">
          Pulse editor canvas
        </p>
        <p className="mt-2 text-sm text-[var(--neutral-600)]">
          Type <kbd className="rounded bg-white px-1 py-0.5 font-mono text-xs">/</kbd> to open the command palette, or click "Add a block" below. Drag the handle on the left to reorder blocks. Type a position number and press Enter to move instantly.
        </p>
      </div>

      <div ref={editorRef} className="pulse-editor space-y-3">
        {blocks.map((block, i) => (
          <EditableBlock
            key={block.id}
            block={block}
            adapter={adapter!}
            isFirst={i === 0}
            isLast={i === blocks.length - 1}
            index={i}
            total={blocks.length}
            commentCount={blockCommentCounts?.[block.id]}
            activeCommentCount={blockActiveCommentCounts?.[block.id]}
            isPulsing={pulseBlockId === block.id}
            onCommentClick={() => onBlockCommentClick?.(block.id)}
            onAddComment={() => onAddBlockComment?.(block.id)}
          />
        ))}
      </div>

      <button
        onClick={() => setShowPalette(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--neutral-200)] py-3 text-sm font-medium text-[var(--neutral-500)] transition-colors hover:border-[var(--pulse-red)] hover:text-[var(--pulse-red)]"
      >
        <Plus className="h-5 w-5" />
        Add a block
      </button>

      {/* Command Palette */}
      <AnimatePresence>
        {showPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24 backdrop-blur-sm"
            onClick={closePalette}
          >
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 border-b border-[var(--neutral-200)] p-4">
                <Command className="h-5 w-5 text-[var(--neutral-400)]" />
                <div className="flex flex-1 flex-col">
                  {breadcrumb && breadcrumb.length > 0 && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] text-[var(--neutral-400)]">
                      <span className="rounded bg-[var(--neutral-100)] px-1.5 py-0.5 font-mono">/</span>
                      {breadcrumb.map((part, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="font-semibold text-[var(--pulse-black)]">{part}</span>
                          {i < breadcrumb.length - 1 && <span className="text-[var(--neutral-300)]">/</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    autoFocus
                    type="text"
                    placeholder="Type /category/block or \\search..."
                    value={paletteQuery}
                    onChange={(e) => setPaletteQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const completed = tabComplete(paletteQuery);
                        if (completed !== paletteQuery) setPaletteQuery(completed);
                      }
                      if (e.key === 'Enter' && !e.shiftKey && filteredDefs.length > 0) {
                        e.preventDefault();
                        const first = filteredDefs[0];
                        const dataOverrides = (first as any)._headingLevel ? { level: (first as any)._headingLevel } : undefined;
                        insert(first.type, dataOverrides);
                      }
                      if (e.key === 'Enter' && e.shiftKey && filteredDefs.length > 0) {
                        e.preventDefault();
                        setPositionMode({ type: filteredDefs[0].type });
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        e.stopPropagation();
                        closePalette();
                      }
                    }}
                    className="w-full bg-transparent text-[var(--pulse-black)] outline-none placeholder:text-[var(--neutral-400)]"
                  />
                </div>
                <button onClick={closePalette} className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!positionMode && (
                <>
                  <div className="flex flex-wrap gap-2 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)] px-4 py-3">
                    {categories.map((cat) => {
                      const isActive = activeCategory === cat;
                      const catColor = cat === 'media' ? (isActive ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50') :
                        cat === 'interactive' ? (isActive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50') :
                        cat === 'advanced' ? (isActive ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50') :
                        (isActive ? 'bg-[var(--pulse-black)] text-white border-[var(--pulse-black)]' : 'bg-white text-[var(--neutral-600)] border-[var(--neutral-200)] hover:bg-[var(--neutral-100)]');
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${catColor}`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-2.5 overflow-y-auto p-4 sm:grid-cols-2">
                    {filteredDefs.map((def, idx) => {
                      const Icon = blockTypeToIcon[def.type] || FileText;
                      const headingLevel = (def as any)._headingLevel;
                      const label = headingLevel ? `Heading ${headingLevel}` : (blockTypeToLabel[def.type] || def.name);
                      const description = headingLevel ? `H${headingLevel} section divider` : (blockTypeToDescription[def.type] || def.config?.category || 'basic');
                      const dataOverrides = headingLevel ? { level: headingLevel } : undefined;
                      const category = def.config?.category || 'basic';
                      const categoryColor = category === 'media' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        category === 'interactive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        category === 'advanced' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                        'bg-[var(--neutral-100)] text-[var(--neutral-600)] border-[var(--neutral-200)]';
                      const isFirst = idx === 0;
                      return (
                        <button
                          key={headingLevel ? `heading-${headingLevel}` : def.type}
                          onClick={() => insert(def.type, dataOverrides)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              insert(def.type, dataOverrides);
                            }
                            if (e.key === 'Enter' && e.shiftKey) {
                              e.preventDefault();
                              setPositionMode({ type: def.type });
                            }
                          }}
                          className={`group relative flex items-start gap-3.5 rounded-xl border p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isFirst ? 'border-[var(--pulse-red)]/40 bg-[var(--pulse-red)]/[0.03] shadow-sm ring-1 ring-[var(--pulse-red)]/10' : 'border-[var(--neutral-200)] bg-white hover:border-[var(--pulse-red)]/30'}`}
                        >
                          {/* Active indicator stripe */}
                          <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-opacity ${isFirst ? 'bg-[var(--pulse-red)] opacity-100' : 'bg-[var(--pulse-red)] opacity-0 group-hover:opacity-100'}`} />

                          {/* Icon */}
                          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-105 ${isFirst ? 'bg-[var(--pulse-red)]/10 border-[var(--pulse-red)]/20' : 'bg-[var(--neutral-50)] border-[var(--neutral-200)] group-hover:bg-[var(--pulse-red)]/5 group-hover:border-[var(--pulse-red)]/20'}`}>
                            <Icon className={`h-[18px] w-[18px] transition-colors ${isFirst ? 'text-[var(--pulse-red)]' : 'text-[var(--neutral-500)] group-hover:text-[var(--pulse-red)]'}`} />
                          </div>

                          {/* Text */}
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex items-baseline gap-2">
                              <span className="truncate text-sm font-bold leading-none text-[var(--pulse-black)]">{label}</span>
                              <span className={`shrink-0 rounded-full border px-2 py-[2px] text-[9px] font-bold uppercase tracking-wider leading-none whitespace-nowrap ${categoryColor}`}>
                                {category}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--neutral-500)]">{description}</p>
                          </div>

                          {/* Add hint */}
                          <div className="mt-1 flex shrink-0 flex-col items-end gap-1">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${isFirst ? 'border-[var(--pulse-red)]/30 bg-[var(--pulse-red)]/10 text-[var(--pulse-red)]' : 'border-[var(--neutral-200)] bg-white text-[var(--neutral-400)] opacity-0 group-hover:opacity-100 group-hover:border-[var(--pulse-red)]/30 group-hover:text-[var(--pulse-red)]'}`}>
                              <Plus className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[9px] font-medium text-[var(--neutral-400)] opacity-0 transition-opacity group-hover:opacity-100">
                              Shift+Enter
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {positionMode && (
                <div className="p-4">
                  <p className="mb-2 text-sm font-semibold text-[var(--pulse-black)]">Insert at position</p>
                  <div className="flex items-center gap-2">
                    <input
                      ref={positionInputRef}
                      autoFocus
                      type="number"
                      min={1}
                      max={blocks.length + 1}
                      placeholder="#"
                      className="w-20 rounded-lg border border-[var(--neutral-200)] px-3 py-2 text-sm outline-none focus:border-[var(--pulse-red)]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          let target = parseInt((e.target as HTMLInputElement).value, 10);
                          if (isNaN(target)) return;
                          if (target < 1) target = 1;
                          if (target > blocks.length + 1) target = blocks.length + 1;
                          insertAtPosition(positionMode.type, target - 1);
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          e.stopPropagation();
                          closePalette();
                        }
                      }}
                    />
                    <span className="text-xs text-[var(--neutral-500)]">of {blocks.length + 1}</span>
                    <button
                      onClick={() => setPositionMode(null)}
                      className="ml-auto rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-2 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        let target = parseInt(positionInputRef.current?.value || '', 10);
                        if (isNaN(target)) return;
                        if (target < 1) target = 1;
                        if (target > blocks.length + 1) target = blocks.length + 1;
                        insertAtPosition(positionMode.type, target - 1);
                      }}
                      className="rounded-lg bg-[var(--pulse-red)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--pulse-red-dark)]"
                    >
                      Insert
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
