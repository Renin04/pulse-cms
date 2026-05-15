'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Command, Keyboard, MousePointer, Plus,
  Trash2, Copy, X, Eye, EyeOff, Type, Heading,
  List, Code, Quote, MessageSquare, Image as ImageIcon,
  Table, CheckSquare, BarChart3, Map, Calculator, HelpCircle,
  LayoutGrid, Video, Music, Globe, BookOpen, Clock, Layers,
  Monitor, FileText, Star, Share2, Bookmark, GitBranch,
  ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react';
import { createEditorStateAdapter, type EditorStateAdapter } from '@pulse/editor';
import type { Block, BlockData } from '@pulse/core';
import { PulseRenderer, registerBuiltinRenderers, RendererRegistry } from '@pulse/renderer';
import {
  registerBuiltinBlocks,
  BUILTIN_BLOCK_DEFINITIONS,
} from '@pulse/blocks';
import SpotlightCard from '../components/SpotlightCard';
import {
  EditableHorizontalRule, EditableLink, EditableImage, EditableVideo, EditableAudio,
  EditableEmbed, EditableFile, EditableTable, EditableAlert, EditableQuiz, EditablePoll,
  EditableAccordion, EditableTabs, EditableToggle, EditableSpoiler, EditableFlashcard,
  EditableTimeline, EditableComparison, EditableBeforeAfter, EditableChart, EditableMap,
  EditableMath, EditableDiagram, EditableManga, EditableSpeechBubble, EditableCard,
  EditableGallery, EditableCarousel, EditableHeroSection, EditableAnnotatedImage,
  LinkModal, LinkContextMenu, RefModal, RefContextMenu,
  markdownToHtml, htmlToMarkdown,
  getLinkAtCursor, getLinkFromEvent, getRefAtCursor, getRefFromEvent,
} from '../components/StudioBlockEditors';

// Ensure builtin blocks and renderers are registered once
let registryReady = false;
function ensureRegistry() {
  if (!registryReady) {
    registerBuiltinBlocks();
    registerBuiltinRenderers(RendererRegistry.getInstance());
    registryReady = true;
  }
}

const blockTypeToIcon: Record<string, React.ElementType> = {
  text: Type,
  heading: Heading,
  list: List,
  code: Code,
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

function getBlockDefaultData(type: string): BlockData {
  const def = BUILTIN_BLOCK_DEFINITIONS.find((d) => d.type === type);
  if (!def) return {};
  const defaultData = typeof def.defaultData === 'function' ? def.defaultData() : def.defaultData;
  return { ...defaultData } as BlockData;
}

function createDemoBlock(type: string): Block<BlockData> {
  const now = new Date().toISOString();
  return {
    id: `block-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`,
    type,
    data: getBlockDefaultData(type),
    createdAt: now,
    updatedAt: now,
  };
}

function renderPreviewHtml(blocks: Block<BlockData>[]): string {
  ensureRegistry();
  const renderer = new PulseRenderer();
  return renderer.renderDocument(blocks).html;
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
  const savedRangeRef = useRef<Range | null>(null);
  const existingLinkRef = useRef<{ text: string; url: string; rel: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; link: { text: string; url: string; rel: string } } | null>(null);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [refModalUrl, setRefModalUrl] = useState('');
  const [refModalText, setRefModalText] = useState('');
  const [refModalStyle, setRefModalStyle] = useState<'numeric' | 'alphabetic' | 'greek' | 'abjad'>('numeric');
  const existingRefRef = useRef<{ url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad' } | null>(null);
  const [refContextMenu, setRefContextMenu] = useState<{ x: number; y: number; ref: { url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad' } } | null>(null);

  useEffect(() => {
    const el = headingRef.current;
    if (el) {
      el.innerHTML = markdownToHtml(data.text);
    }
  }, [data.text]);

  const openLinkModal = () => {
    const el = headingRef.current;
    if (!el) return;

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
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingLinkRef.current = null;
    setLinkModalText(selectedText);
    setLinkModalUrl('');
    setLinkModalRel('');
    setLinkModalOpen(true);
  };

  const handleLinkConfirm = (url: string, rel: string) => {
    const el = headingRef.current;
    if (!el) return;
    const relPart = rel ? `{rel="${rel}"}` : '';
    const markdownText = `[${linkModalText}](${url})${relPart}`;

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

    if (existingLinkRef.current) {
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(existingLinkRef.current.text));
        }
      });
    }

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
    const existingRef = getRefAtCursor(el);
    if (existingRef) {
      setRefModalUrl(existingRef.url || '');
      setRefModalText(existingRef.text || '');
      setRefModalStyle(existingRef.style);
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
    setRefModalOpen(true);
  };

  const handleRefConfirm = (url: string, text: string, style: 'numeric' | 'alphabetic' | 'greek' | 'abjad') => {
    const el = headingRef.current;
    if (!el) return;
    const markdownText = `[ref](${url}){text="${text}" style="${style}"}`;
    if (existingRefRef.current) {
      const refs = el.querySelectorAll('span.pulse-editor-ref');
      refs.forEach((span) => {
        if (span.textContent?.trim() === existingRefRef.current?.text && span.getAttribute('data-url') === existingRefRef.current?.url) {
          span.replaceWith(document.createTextNode(markdownText));
        }
      });
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
    setRefModalOpen(false);
    existingRefRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
    }, 0);
  };

  const handleRefRemove = () => {
    const el = headingRef.current;
    if (!el) return;
    if (existingRefRef.current) {
      const refs = el.querySelectorAll('span.pulse-editor-ref');
      refs.forEach((span) => {
        if (span.textContent?.trim() === existingRefRef.current?.text && span.getAttribute('data-url') === existingRefRef.current?.url) {
          span.replaceWith(document.createTextNode(existingRefRef.current.text || ''));
        }
      });
    }
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
          ref={headingRef}
          contentEditable
          suppressContentEditableWarning
          className="min-w-0 flex-1 font-bold text-[var(--pulse-black)] outline-none"
          style={{ fontSize: data.level === 1 ? '2rem' : data.level === 2 ? '1.5rem' : '1.25rem' }}
          onBlur={(e) => {
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
            if (ref) {
              e.preventDefault();
              setRefContextMenu({ x: e.clientX, y: e.clientY, ref });
            }
          }}
        />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkModal}
          className="mt-1 rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
          title="Link selected text (Ctrl+K)"
        >
          Link
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={openRefModal}
          className="mt-1 rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
          title="Add reference citation"
        >
          Ref
        </button>
      </div>
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onConfirm={handleLinkConfirm}
        onRemove={linkModalUrl ? handleLinkRemove : undefined}
        defaultText={linkModalText}
        defaultUrl={linkModalUrl}
        defaultRel={linkModalRel}
      />
      {contextMenu && (
        <LinkContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            setLinkModalText(contextMenu.link.text);
            setLinkModalUrl(contextMenu.link.url);
            setLinkModalRel(contextMenu.link.rel);
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
        onClose={() => setRefModalOpen(false)}
        onConfirm={handleRefConfirm}
        onRemove={existingRefRef.current ? handleRefRemove : undefined}
        defaultUrl={refModalUrl}
        defaultText={refModalText}
        defaultStyle={refModalStyle}
      />
      {refContextMenu && (
        <RefContextMenu
          x={refContextMenu.x}
          y={refContextMenu.y}
          onEdit={() => {
            setRefModalUrl(refContextMenu.ref.url || '');
            setRefModalText(refContextMenu.ref.text || '');
            setRefModalStyle(refContextMenu.ref.style);
            existingRefRef.current = refContextMenu.ref;
            savedRangeRef.current = null;
            setRefModalOpen(true);
            setRefContextMenu(null);
          }}
          onRemove={() => {
            const el = headingRef.current;
            if (!el) return;
            const refs = el.querySelectorAll('span.pulse-editor-ref');
            refs.forEach((span) => {
              if (span.textContent?.trim() === refContextMenu.ref.text && span.getAttribute('data-url') === refContextMenu.ref.url) {
                span.replaceWith(document.createTextNode(refContextMenu.ref.text || ''));
              }
            });
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
  const savedRangeRef = useRef<Range | null>(null);
  const existingLinkRef = useRef<{ text: string; url: string; rel: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; link: { text: string; url: string; rel: string } } | null>(null);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [refModalUrl, setRefModalUrl] = useState('');
  const [refModalText, setRefModalText] = useState('');
  const [refModalStyle, setRefModalStyle] = useState<'numeric' | 'alphabetic' | 'greek' | 'abjad'>('numeric');
  const existingRefRef = useRef<{ url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad' } | null>(null);
  const [refContextMenu, setRefContextMenu] = useState<{ x: number; y: number; ref: { url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad' } } | null>(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      el.innerHTML = markdownToHtml(data.text);
    }
  }, [data.text]);

  const openLinkModal = () => {
    const el = textRef.current;
    if (!el) return;

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
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingLinkRef.current = null;
    setLinkModalText(selectedText);
    setLinkModalUrl('');
    setLinkModalRel('');
    setLinkModalOpen(true);
  };

  const handleLinkConfirm = (url: string, rel: string) => {
    const el = textRef.current;
    if (!el) return;
    const relPart = rel ? `{rel="${rel}"}` : '';
    const markdownText = `[${linkModalText}](${url})${relPart}`;

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

    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
    }, 0);
  };

  const handleLinkRemove = () => {
    const el = textRef.current;
    if (!el) return;

    if (existingLinkRef.current) {
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(existingLinkRef.current.text));
        }
      });
    }

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
    const existingRef = getRefAtCursor(el);
    if (existingRef) {
      setRefModalUrl(existingRef.url || '');
      setRefModalText(existingRef.text || '');
      setRefModalStyle(existingRef.style);
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
    setRefModalOpen(true);
  };

  const handleRefConfirm = (url: string, text: string, style: 'numeric' | 'alphabetic' | 'greek' | 'abjad') => {
    const el = textRef.current;
    if (!el) return;
    const markdownText = `[ref](${url}){text="${text}" style="${style}"}`;
    if (existingRefRef.current) {
      const refs = el.querySelectorAll('span.pulse-editor-ref');
      refs.forEach((span) => {
        if (span.textContent?.trim() === existingRefRef.current?.text && span.getAttribute('data-url') === existingRefRef.current?.url) {
          span.replaceWith(document.createTextNode(markdownText));
        }
      });
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
    setRefModalOpen(false);
    existingRefRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, text: markdown } }));
    }, 0);
  };

  const handleRefRemove = () => {
    const el = textRef.current;
    if (!el) return;
    if (existingRefRef.current) {
      const refs = el.querySelectorAll('span.pulse-editor-ref');
      refs.forEach((span) => {
        if (span.textContent?.trim() === existingRefRef.current?.text && span.getAttribute('data-url') === existingRefRef.current?.url) {
          span.replaceWith(document.createTextNode(existingRefRef.current.text || ''));
        }
      });
    }
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
          style={{ textAlign: align as any }}
          onBlur={(e) => {
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
            if (ref) {
              e.preventDefault();
              setRefContextMenu({ x: e.clientX, y: e.clientY, ref });
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
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLinkModal}
            className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--pulse-jasmine)] hover:text-[var(--pulse-black)]"
            title="Link selected text (Ctrl+K)"
          >
            Link
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={openRefModal}
            className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--pulse-jasmine)] hover:text-[var(--pulse-black)]"
            title="Add reference citation"
          >
            Ref
          </button>
        </div>
      </div>
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onConfirm={handleLinkConfirm}
        onRemove={linkModalUrl ? handleLinkRemove : undefined}
        defaultText={linkModalText}
        defaultUrl={linkModalUrl}
        defaultRel={linkModalRel}
      />
      {contextMenu && (
        <LinkContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            setLinkModalText(contextMenu.link.text);
            setLinkModalUrl(contextMenu.link.url);
            setLinkModalRel(contextMenu.link.rel);
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
        onClose={() => setRefModalOpen(false)}
        onConfirm={handleRefConfirm}
        onRemove={existingRefRef.current ? handleRefRemove : undefined}
        defaultUrl={refModalUrl}
        defaultText={refModalText}
        defaultStyle={refModalStyle}
      />
      {refContextMenu && (
        <RefContextMenu
          x={refContextMenu.x}
          y={refContextMenu.y}
          onEdit={() => {
            setRefModalUrl(refContextMenu.ref.url || '');
            setRefModalText(refContextMenu.ref.text || '');
            setRefModalStyle(refContextMenu.ref.style);
            existingRefRef.current = refContextMenu.ref;
            savedRangeRef.current = null;
            setRefModalOpen(true);
            setRefContextMenu(null);
          }}
          onRemove={() => {
            const el = textRef.current;
            if (!el) return;
            const refs = el.querySelectorAll('span.pulse-editor-ref');
            refs.forEach((span) => {
              if (span.textContent?.trim() === refContextMenu.ref.text && span.getAttribute('data-url') === refContextMenu.ref.url) {
                span.replaceWith(document.createTextNode(refContextMenu.ref.text || ''));
              }
            });
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
  const data = block.data as { quote: string; citation?: string };
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalText, setLinkModalText] = useState('');
  const [linkModalUrl, setLinkModalUrl] = useState('');
  const [linkModalRel, setLinkModalRel] = useState('');
  const savedRangeRef = useRef<Range | null>(null);
  const existingLinkRef = useRef<{ text: string; url: string; rel: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; link: { text: string; url: string; rel: string } } | null>(null);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [refModalUrl, setRefModalUrl] = useState('');
  const [refModalText, setRefModalText] = useState('');
  const [refModalStyle, setRefModalStyle] = useState<'numeric' | 'alphabetic' | 'greek' | 'abjad'>('numeric');
  const existingRefRef = useRef<{ url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad' } | null>(null);
  const [refContextMenu, setRefContextMenu] = useState<{ x: number; y: number; ref: { url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad' } } | null>(null);

  useEffect(() => {
    const el = quoteRef.current;
    if (el) {
      el.innerHTML = markdownToHtml(data.quote);
    }
  }, [data.quote]);

  const openLinkModal = () => {
    const el = quoteRef.current;
    if (!el) return;
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
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingLinkRef.current = null;
    setLinkModalText(selectedText);
    setLinkModalUrl('');
    setLinkModalRel('');
    setLinkModalOpen(true);
  };

  const handleLinkConfirm = (url: string, rel: string) => {
    const el = quoteRef.current;
    if (!el) return;
    const relPart = rel ? `{rel="${rel}"}` : '';
    const markdownText = `[${linkModalText}](${url})${relPart}`;
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
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, quote: markdown } }));
    }, 0);
  };

  const handleLinkRemove = () => {
    const el = quoteRef.current;
    if (!el) return;
    if (existingLinkRef.current) {
      const links = el.querySelectorAll('span.pulse-editor-link');
      links.forEach((span) => {
        if (span.textContent?.trim() === existingLinkRef.current?.text && span.getAttribute('data-url') === existingLinkRef.current?.url) {
          span.replaceWith(document.createTextNode(existingLinkRef.current.text));
        }
      });
    }
    setLinkModalOpen(false);
    existingLinkRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, quote: markdown } }));
    }, 0);
  };

  const openRefModal = () => {
    const el = quoteRef.current;
    if (!el) return;
    const existingRef = getRefAtCursor(el);
    if (existingRef) {
      setRefModalUrl(existingRef.url || '');
      setRefModalText(existingRef.text || '');
      setRefModalStyle(existingRef.style);
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
    setRefModalOpen(true);
  };

  const handleRefConfirm = (url: string, text: string, style: 'numeric' | 'alphabetic' | 'greek' | 'abjad') => {
    const el = quoteRef.current;
    if (!el) return;
    const markdownText = `[ref](${url}){text="${text}" style="${style}"}`;
    if (existingRefRef.current) {
      const refs = el.querySelectorAll('span.pulse-editor-ref');
      refs.forEach((span) => {
        if (span.textContent?.trim() === existingRefRef.current?.text && span.getAttribute('data-url') === existingRefRef.current?.url) {
          span.replaceWith(document.createTextNode(markdownText));
        }
      });
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
    setRefModalOpen(false);
    existingRefRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, quote: markdown } }));
    }, 0);
  };

  const handleRefRemove = () => {
    const el = quoteRef.current;
    if (!el) return;
    if (existingRefRef.current) {
      const refs = el.querySelectorAll('span.pulse-editor-ref');
      refs.forEach((span) => {
        if (span.textContent?.trim() === existingRefRef.current?.text && span.getAttribute('data-url') === existingRefRef.current?.url) {
          span.replaceWith(document.createTextNode(existingRefRef.current.text || ''));
        }
      });
    }
    setRefModalOpen(false);
    existingRefRef.current = null;
    savedRangeRef.current = null;
    setTimeout(() => {
      const markdown = htmlToMarkdown(el.innerHTML);
      adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, quote: markdown } }));
    }, 0);
  };

  return (
    <blockquote className="border-l-4 border-[var(--pulse-jasmine)] pl-4 italic text-[var(--neutral-700)]">
      <div className="flex items-start gap-2">
        <p
          ref={quoteRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[1.5em] flex-1 outline-none"
          onBlur={(e) => {
            const markdown = htmlToMarkdown(e.currentTarget.innerHTML);
            adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, quote: markdown } }));
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
            if (ref) {
              e.preventDefault();
              setRefContextMenu({ x: e.clientX, y: e.clientY, ref });
            }
          }}
        />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkModal}
          className="mt-0.5 rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
          title="Link selected text (Ctrl+K)"
        >
          Link
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={openRefModal}
          className="mt-0.5 rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
          title="Add reference citation"
        >
          Ref
        </button>
      </div>
      <input
        value={data.citation || ''}
        onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, citation: e.target.value } }))}
        placeholder="Citation (optional)"
        className="mt-2 w-full bg-transparent text-sm text-[var(--neutral-500)] outline-none placeholder:text-[var(--neutral-400)]"
      />
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onConfirm={handleLinkConfirm}
        onRemove={linkModalUrl ? handleLinkRemove : undefined}
        defaultText={linkModalText}
        defaultUrl={linkModalUrl}
        defaultRel={linkModalRel}
      />
      {contextMenu && (
        <LinkContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            setLinkModalText(contextMenu.link.text);
            setLinkModalUrl(contextMenu.link.url);
            setLinkModalRel(contextMenu.link.rel);
            existingLinkRef.current = contextMenu.link;
            savedRangeRef.current = null;
            setLinkModalOpen(true);
            setContextMenu(null);
          }}
          onRemove={() => {
            const el = quoteRef.current;
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
              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, quote: markdown } }));
            }, 0);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      <RefModal
        isOpen={refModalOpen}
        onClose={() => setRefModalOpen(false)}
        onConfirm={handleRefConfirm}
        onRemove={existingRefRef.current ? handleRefRemove : undefined}
        defaultUrl={refModalUrl}
        defaultText={refModalText}
        defaultStyle={refModalStyle}
      />
      {refContextMenu && (
        <RefContextMenu
          x={refContextMenu.x}
          y={refContextMenu.y}
          onEdit={() => {
            setRefModalUrl(refContextMenu.ref.url || '');
            setRefModalText(refContextMenu.ref.text || '');
            setRefModalStyle(refContextMenu.ref.style);
            existingRefRef.current = refContextMenu.ref;
            savedRangeRef.current = null;
            setRefModalOpen(true);
            setRefContextMenu(null);
          }}
          onRemove={() => {
            const el = quoteRef.current;
            if (!el) return;
            const refs = el.querySelectorAll('span.pulse-editor-ref');
            refs.forEach((span) => {
              if (span.textContent?.trim() === refContextMenu.ref.text && span.getAttribute('data-url') === refContextMenu.ref.url) {
                span.replaceWith(document.createTextNode(refContextMenu.ref.text || ''));
              }
            });
            setRefContextMenu(null);
            setTimeout(() => {
              const markdown = htmlToMarkdown(el.innerHTML);
              adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, quote: markdown } }));
            }, 0);
          }}
          onClose={() => setRefContextMenu(null)}
        />
      )}
    </blockquote>
  );
}

function EditableCode({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { code: string; language: string; showLineNumbers?: boolean };
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <select
          value={data.language}
          onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, language: e.target.value } }))}
          className="rounded-lg border border-[var(--neutral-200)] bg-white px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] outline-none"
        >
          {['typescript', 'tsx', 'javascript', 'jsx', 'json', 'html', 'css', 'markdown', 'bash', 'python', 'go', 'rust'].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-[var(--neutral-600)]">
          <input
            type="checkbox"
            checked={data.showLineNumbers ?? true}
            onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, showLineNumbers: e.target.checked } }))}
            className="h-4 w-4 accent-[var(--pulse-red)]"
          />
          Line numbers
        </label>
      </div>
      <textarea
        value={data.code}
        onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, code: e.target.value } }))}
        rows={4}
        className="w-full rounded-xl border border-[var(--neutral-200)] bg-[#0d0d0e] p-3 font-mono text-sm text-[#a5ffce] outline-none"
      />
    </div>
  );
}

function EditableList({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { style: 'ordered' | 'unordered'; items: string[] };
  const ListTag = data.style === 'ordered' ? 'ol' : 'ul';
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {(['unordered', 'ordered'] as const).map((s) => (
          <button
            key={s}
            onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, style: s } }))}
            className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
              data.style === s ? 'bg-[var(--pulse-red)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
            }`}
          >
            {s === 'unordered' ? 'Bullet' : 'Numbered'}
          </button>
        ))}
      </div>
      <ListTag className={data.style === 'ordered' ? 'list-decimal' : 'list-disc'}>
        {data.items.map((item, i) => (
          <li key={i} className="mb-2">
            <div className="flex items-start gap-2">
              <input
                value={item}
                onChange={(e) => {
                  const next = [...data.items];
                  next[i] = e.target.value;
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next } }));
                }}
                className="min-w-0 flex-1 rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-sm text-[var(--neutral-700)] outline-none"
              />
              <button
                onClick={() => {
                  const next = data.items.filter((_, idx) => idx !== i);
                  adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: next.length ? next : [''] } }));
                }}
                className="text-[var(--neutral-400)] hover:text-[var(--pulse-red)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ListTag>
      <button
        onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, items: [...data.items, 'New item'] } }))}
        className="mt-2 inline-flex items-center gap-1 rounded-md bg-[var(--neutral-100)] px-2 py-1 text-xs font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-200)]"
      >
        <Plus className="h-3 w-3" />
        Add item
      </button>
    </div>
  );
}

function EditableCallout({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { variant: string; title?: string; body: string };
  const variantColors: Record<string, string> = {
    note: 'bg-blue-500/10 text-blue-700 border-blue-200',
    info: 'bg-sky-500/10 text-sky-700 border-sky-200',
    tip: 'bg-green-500/10 text-green-700 border-green-200',
    warning: 'bg-amber-500/10 text-amber-700 border-amber-200',
    success: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${variantColors[data.variant] || variantColors.note}`}>
      <div className="mb-2 flex items-center gap-2">
        {(['note', 'info', 'tip', 'warning', 'success'] as const).map((v) => (
          <button
            key={v}
            onClick={() => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, variant: v } }))}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              data.variant === v ? 'bg-white/80 text-[var(--pulse-black)]' : 'bg-white/40 text-[var(--neutral-600)]'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <input
        value={data.title || ''}
        onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))}
        placeholder="Title"
        className="mb-2 w-full bg-transparent text-sm font-bold outline-none placeholder:text-current/50"
      />
      <textarea
        value={data.body}
        onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, body: e.target.value } }))}
        rows={2}
        className="w-full bg-transparent text-sm outline-none placeholder:text-current/50"
        placeholder="Body text..."
      />
    </div>
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
}: {
  block: Block<BlockData>;
  adapter: EditorStateAdapter<Block<BlockData>>;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isActive, setIsActive] = useState(false);

  const content = useMemo(() => {
    switch (block.type) {
      case 'heading': return <EditableHeading block={block} adapter={adapter} />;
      case 'text': return <EditableText block={block} adapter={adapter} />;
      case 'blockquote': return <EditableBlockquote block={block} adapter={adapter} />;
      case 'code': return <EditableCode block={block} adapter={adapter} />;
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
      className={`group relative rounded-xl border border-transparent bg-white p-4 shadow-sm transition-all hover:border-[var(--neutral-200)] ${
        isActive ? 'border-[var(--pulse-red)]/30 ring-1 ring-[var(--pulse-red)]/20' : ''
      }`}
      onClick={() => setIsActive(true)}
      onBlur={() => setIsActive(false)}
      tabIndex={-1}
    >
      {/* Hover actions */}
      <div className="absolute -right-2 -top-2 hidden items-center gap-1 rounded-lg border border-[var(--neutral-200)] bg-white p-1 shadow-sm group-hover:flex">
        {!isFirst && (
          <button
            onClick={() => {
              const idx = adapter.getSnapshot().document.blocks.findIndex((b) => b.id === block.id);
              if (idx > 0) adapter.moveBlock(block.id, idx - 1);
            }}
            className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={() => {
              const idx = adapter.getSnapshot().document.blocks.findIndex((b) => b.id === block.id);
              adapter.moveBlock(block.id, idx + 1);
            }}
            className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => {
            const dup = { ...block, id: `dup-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Block<BlockData>;
            adapter.insertBlock(dup);
          }}
          className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]"
          title="Duplicate"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => adapter.removeBlock(block.id)}
          className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-red)]"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {content}
    </div>
  );
}

// â”€â”€â”€ Main Demo Editor â”€â”€â”€

export default function PulseDemoEditor() {
  ensureRegistry();
  const adapterRef = useRef<EditorStateAdapter<Block<BlockData>> | null>(null);
  const [blocks, setBlocks] = useState<Block<BlockData>[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  if (!adapterRef.current) {
    adapterRef.current = createEditorStateAdapter<Block<BlockData>>({
      document: {
        id: 'pulse-demo',
        metadata: { title: 'Pulse Demo' },
        blocks: [
          createDemoBlock('heading'),
          createDemoBlock('text'),
        ],
      },
    });
  }
  const adapter = adapterRef.current;

  useEffect(() => {
    const unsubscribe = adapter.subscribe((snapshot) => {
      setBlocks(snapshot.document.blocks);
    });
    return unsubscribe;
  }, [adapter]);

  // Keyboard shortcut: / opens palette when not in input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName || '')) {
        e.preventDefault();
        setShowPalette(true);
      }
      if (e.key === 'Escape') {
        setShowPalette(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const previewHtml = useMemo(() => renderPreviewHtml(blocks), [blocks]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    BUILTIN_BLOCK_DEFINITIONS.forEach((d) => cats.add(d.config?.category || 'basic'));
    return ['All', ...Array.from(cats).sort()];
  }, []);

  const filteredDefs = useMemo(() => {
    let defs = [...BUILTIN_BLOCK_DEFINITIONS] as any[];
    if (activeCategory !== 'All') {
      defs = defs.filter((d) => d.config?.category === activeCategory);
    }
    if (paletteQuery.trim()) {
      const q = paletteQuery.toLowerCase();
      defs = defs.filter((d) => (blockTypeToLabel[d.type] || d.name).toLowerCase().includes(q));
    }
    return defs;
  }, [activeCategory, paletteQuery]);

  const insertBlock = (type: string) => {
    const newBlock = createDemoBlock(type);
    adapter.insertBlock(newBlock);
    setShowPalette(false);
    setPaletteQuery('');
  };

  const resetDoc = () => {
    const next = createEditorStateAdapter<Block<BlockData>>({
      document: {
        id: 'pulse-demo',
        metadata: { title: 'Pulse Demo' },
        blocks: [createDemoBlock('heading'), createDemoBlock('text')],
      },
    });
    adapterRef.current = next;
    setBlocks(next.getSnapshot().document.blocks);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff9eb] to-[#fff9eb] pt-24 pb-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--pulse-black)]">
              <Sparkles className="h-6 w-6 text-[var(--pulse-red)]" />
              Pulse Demo Editor
            </h1>
            <p className="mt-1 text-sm text-[var(--neutral-600)]">
              Try the real Pulse block editor. Type <kbd className="rounded bg-white px-1 py-0.5 text-xs font-mono">/</kbd> for commands.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-sm text-[var(--neutral-500)] sm:flex">
              <span className="flex items-center gap-1">
                <Keyboard className="h-4 w-4" />
                / for blocks
              </span>
              <span className="text-[var(--neutral-300)]">|</span>
              <span className="flex items-center gap-1">
                <MousePointer className="h-4 w-4" />
                Hover to reorder
              </span>
            </div>
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--neutral-200)] bg-white px-3 py-2 text-sm font-medium text-[var(--neutral-700)] shadow-sm hover:bg-[var(--neutral-50)]"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Hide preview' : 'Show preview'}
            </button>
            <button
              onClick={resetDoc}
              className="rounded-xl bg-[var(--pulse-black)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--pulse-red)]"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Editor + Preview */}
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          {/* Editor canvas */}
          <SpotlightCard
            className="min-h-[60vh] rounded-2xl border border-white/60 bg-white/60 p-5 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-6"
            spotlightColor="rgba(255, 40, 0, 0.08)"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--neutral-500)]">
                Editor Canvas
              </span>
              <span className="text-xs text-[var(--neutral-500)]">
                {blocks.length} blocks Â· {blocks.reduce((acc, b) => acc + JSON.stringify(b.data).length, 0)} chars
              </span>
            </div>

            <div className="space-y-3">
              {blocks.map((block, i) => (
                <EditableBlock
                  key={block.id}
                  block={block}
                  adapter={adapter}
                  isFirst={i === 0}
                  isLast={i === blocks.length - 1}
                />
              ))}
            </div>

            <button
              onClick={() => setShowPalette(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--neutral-200)] py-4 text-sm font-medium text-[var(--neutral-500)] transition-colors hover:border-[var(--pulse-red)] hover:text-[var(--pulse-red)]"
            >
              <Plus className="h-5 w-5" />
              Add a block
            </button>
          </SpotlightCard>

          {/* Preview pane */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:sticky lg:top-24 lg:self-start"
              >
                <SpotlightCard
                  className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-xl shadow-black/5 backdrop-blur-xl"
                  spotlightColor="rgba(255, 40, 0, 0.08)"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--neutral-500)]">
                      Live Preview
                    </span>
                    <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <div
                    className="prose prose-sm max-w-none rounded-xl border border-[var(--neutral-200)] bg-white p-4 sm:p-5"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </SpotlightCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Command Palette */}
      <AnimatePresence>
        {showPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24 backdrop-blur-sm"
            onClick={() => setShowPalette(false)}
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
                <input
                  autoFocus
                  type="text"
                  placeholder="Search blocks..."
                  value={paletteQuery}
                  onChange={(e) => setPaletteQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[var(--pulse-black)] outline-none placeholder:text-[var(--neutral-400)]"
                />
                <button onClick={() => setShowPalette(false)} className="rounded p-1 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)] p-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      activeCategory === cat
                        ? 'bg-[var(--pulse-black)] text-white'
                        : 'bg-white text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid gap-2 overflow-y-auto p-3 sm:grid-cols-2">
                {filteredDefs.map((def) => {
                  const Icon = blockTypeToIcon[def.type] || FileText;
                  const label = blockTypeToLabel[def.type] || def.name;
                  return (
                    <button
                      key={def.type}
                      onClick={() => insertBlock(def.type)}
                      className="group flex items-center gap-3 rounded-xl border border-[var(--neutral-200)] bg-white p-3 text-left transition-all hover:border-[var(--pulse-red)]/30 hover:bg-[var(--pulse-red)]/5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--neutral-100)] transition-colors group-hover:bg-white">
                        <Icon className="h-4 w-4 text-[var(--neutral-600)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[var(--pulse-black)]">{label}</p>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--neutral-500)]">{def.config?.category || 'basic'}</p>
                      </div>
                      <Plus className="h-4 w-4 text-[var(--neutral-400)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
