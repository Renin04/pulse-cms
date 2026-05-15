'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Play,
  RotateCcw,
  Wand2,
  Type,
  Heading,
  List,
  Image as ImageIcon,
  Code,
  Quote,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  Plus,
  Minus,
  GripVertical,
  Sparkles,
  Terminal,
  MousePointer2,
  Coffee,
  BarChart3,
  Image,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
   Shared editor-like frame
   ─────────────────────────────────────────────────────────────── */
function DemoFrame({ children, title, badge }: { children: React.ReactNode; title: string; badge?: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-[var(--neutral-200)] bg-white shadow-[0_28px_80px_-44px_rgba(17,24,39,0.4)]">
      <div className="flex items-center justify-between border-b border-[var(--neutral-200)] bg-[var(--neutral-50)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-2 text-sm font-semibold text-[var(--pulse-black)]">{title}</span>
        </div>
        {badge && (
          <span className="rounded-full bg-[var(--pulse-jasmine)]/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--pulse-black)]">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function EditorToolbar() {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--neutral-200)] bg-white px-4 py-2">
      <div className="flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-1">
        <span className="rounded p-1 hover:bg-white"><Bold className="h-3.5 w-3.5 text-[var(--neutral-600)]" /></span>
        <span className="rounded p-1 hover:bg-white"><Italic className="h-3.5 w-3.5 text-[var(--neutral-600)]" /></span>
        <span className="rounded p-1 hover:bg-white"><Underline className="h-3.5 w-3.5 text-[var(--neutral-600)]" /></span>
      </div>
      <div className="mx-2 h-4 w-px bg-[var(--neutral-200)]" />
      <div className="flex items-center gap-1 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-1">
        <span className="rounded p-1 hover:bg-white"><AlignLeft className="h-3.5 w-3.5 text-[var(--neutral-600)]" /></span>
        <span className="rounded p-1 hover:bg-white"><List className="h-3.5 w-3.5 text-[var(--neutral-600)]" /></span>
      </div>
      <div className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-[var(--neutral-500)]">
        <Sparkles className="h-3 w-3 text-[var(--pulse-red)]" />
        AI Ready
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   1. Quiz Block
   ─────────────────────────────────────────────────────────────── */
export function QuizDemo() {
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const options = [
    { id: 'a', label: 'Paris', correct: false },
    { id: 'b', label: 'Tokyo', correct: true },
    { id: 'c', label: 'New York', correct: false },
  ];

  return (
    <DemoFrame title="Quiz Block" badge="Interactive">
      <EditorToolbar />
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--pulse-red)]">
          <MousePointer2 className="h-3.5 w-3.5" />
          Quick Check
        </div>
        <p className="mb-4 text-[var(--pulse-black)]">Which city currently holds the most Michelin stars in the world?</p>
        <div className="space-y-2">
          {options.map((opt) => {
            const state = answered && opt.correct ? 'correct' : answered && selected === opt.id ? 'wrong' : 'idle';
            return (
              <button
                key={opt.id}
                onClick={() => { setSelected(opt.id); setAnswered(true); }}
                className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                  state === 'correct'
                    ? 'border-green-400 bg-green-50'
                    : state === 'wrong'
                    ? 'border-red-300 bg-red-50'
                    : 'border-[var(--neutral-200)] bg-white hover:border-[var(--pulse-red)]/40 hover:shadow-sm'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                  state === 'correct' ? 'border-green-500 bg-green-500 text-white' : state === 'wrong' ? 'border-red-400' : 'border-[var(--neutral-300)] group-hover:border-[var(--pulse-red)]'
                }`}>
                  {state === 'correct' && <CheckCircle2 className="h-3.5 w-3.5" />}
                </span>
                <span className="text-sm font-medium text-[var(--pulse-black)]">{opt.label}</span>
                {state === 'correct' && <span className="ml-auto text-xs font-bold text-green-600">Correct</span>}
              </button>
            );
          })}
        </div>
        {answered && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Tokyo has over 200 Michelin-starred restaurants — more than any other city.
          </motion.div>
        )}
      </div>
    </DemoFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   2. Poll Block
   ─────────────────────────────────────────────────────────────── */
export function PollDemo() {
  const [voted, setVoted] = useState<string | null>(null);
  const total = 124;
  const data = [
    { id: 'interactive', label: 'Hands-on projects', count: 89, color: 'from-[var(--pulse-red)] to-[#ff6b4a]' },
    { id: 'static', label: 'Reading articles', count: 24, color: 'from-[var(--neutral-400)] to-[var(--neutral-300)]' },
    { id: 'video', label: 'Watching videos', count: 11, color: 'from-[var(--pulse-jasmine)] to-[#fff5cc]' },
  ];

  return (
    <DemoFrame title="Poll Block" badge="Live Results">
      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--pulse-red)]">
          <BarChart3 className="h-3.5 w-3.5" />
          Live Poll
        </div>
        <p className="mb-4 font-medium text-[var(--pulse-black)]">What is the best way to learn a new skill?</p>
        <div className="space-y-3">
          {data.map((item) => {
            const percent = Math.round((item.count / total) * 100);
            return (
              <button
                key={item.id}
                onClick={() => setVoted(item.id)}
                className="group relative w-full overflow-hidden rounded-xl border border-[var(--neutral-200)] bg-white text-left"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: voted ? `${percent}%` : '0%' }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${item.color}`}
                />
                <div className="relative flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-[var(--pulse-black)]">{item.label}</span>
                  <span className="text-sm font-bold text-[var(--pulse-black)]">
                    {voted ? `${percent}%` : 'Vote'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[var(--neutral-500)]">{voted ? `${total} votes · Live` : 'Cast your vote to see results'}</p>
      </div>
    </DemoFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   3. Branching Story
   ─────────────────────────────────────────────────────────────── */
export function BranchDemo() {
  const [path, setPath] = useState<'start' | 'spring' | 'fall' | 'end'>('start');

  const steps = ['Start', path === 'spring' ? 'Spring' : path === 'fall' ? 'Fall' : '...', path === 'end' ? 'Finish' : '...'];

  return (
    <DemoFrame title="Branching Story" badge="Choose Your Path">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${s !== '...' ? 'bg-[var(--pulse-black)] text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-500)]'}`}>
                {s}
              </span>
              {i < steps.length - 1 && <span className="text-[var(--neutral-300)]">→</span>}
            </div>
          ))}
        </div>

        <div className="min-h-[8.5rem]">
          <AnimatePresence mode="wait">
            {path === 'start' && (
              <motion.div key="start" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                <p className="text-[var(--pulse-black)]">You are planning a trip to Kyoto. Which season calls to you?</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setPath('spring')} className="rounded-xl bg-[var(--pulse-black)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:bg-[var(--pulse-red)] transition-colors">
                    🌸 Spring
                  </button>
                  <button onClick={() => setPath('fall')} className="rounded-xl border border-[var(--neutral-200)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--pulse-black)] hover:border-[var(--pulse-red)] hover:shadow-sm transition-all">
                    🍁 Fall
                  </button>
                </div>
              </motion.div>
            )}
            {path === 'spring' && (
              <motion.div key="spring" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                <p className="text-[var(--pulse-black)]">Perfect. In spring, Maruyama Park is filled with cherry blossoms. Take a morning walk along the Philosopher&apos;s Path before the crowds arrive.</p>
                <button onClick={() => setPath('end')} className="text-sm font-bold text-[var(--pulse-red)] hover:underline">Finish the guide →</button>
              </motion.div>
            )}
            {path === 'fall' && (
              <motion.div key="fall" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                <p className="text-[var(--pulse-black)]">Excellent choice. Fall brings fiery maple leaves to Eikando Temple. Don&apos;t miss the sunset view from Kiyomizu-dera.</p>
                <button onClick={() => setPath('end')} className="text-sm font-bold text-[var(--pulse-red)] hover:underline">Finish the guide →</button>
              </motion.div>
            )}
            {path === 'end' && (
              <motion.div key="end" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <p className="text-[var(--pulse-black)]">You just experienced branching content — the same post adapts to the reader. That is the Pulse difference.</p>
                <button onClick={() => setPath('start')} className="inline-flex items-center gap-2 rounded-xl border border-[var(--neutral-200)] bg-white px-4 py-2 text-sm font-medium text-[var(--neutral-600)] hover:border-[var(--pulse-red)] hover:text-[var(--pulse-black)] transition-all">
                  <RotateCcw className="h-4 w-4" /> Restart
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DemoFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   4. Manga Panel
   ─────────────────────────────────────────────────────────────── */
export function MangaDemo() {
  const [panel, setPanel] = useState(0);
  const captions = ['Tap to continue', 'Grind the beans', 'Pour & enjoy'];

  return (
    <DemoFrame title="Manga Panel" badge="Visual Story">
      <div className="p-5 sm:p-6">
        <div
          className="grid cursor-pointer gap-2 rounded-xl bg-[var(--pulse-black)] p-3 shadow-inner"
          onClick={() => setPanel((p) => (p + 1) % 3)}
        >
          <div className="flex gap-2">
            <div className={`relative flex-1 overflow-hidden rounded-lg bg-gradient-to-br from-[var(--pulse-red)] to-[#ff6b4a] p-5 transition-all duration-500 ${panel >= 1 ? 'opacity-100' : 'opacity-50'}`}>
              <Coffee className="h-6 w-6 text-white" />
              {panel >= 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-2 left-2 rounded-lg bg-white/20 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
                  Step 1
                </motion.div>
              )}
            </div>
            <div className={`relative w-1/3 overflow-hidden rounded-lg bg-[var(--pulse-jasmine)] p-4 transition-all duration-500 ${panel >= 2 ? 'opacity-100' : 'opacity-50'}`}>
              <div className="h-2 w-10 rounded bg-[var(--pulse-black)]/20" />
              {panel >= 2 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-2 right-2 rounded-full bg-[var(--pulse-black)]/10 px-2 py-0.5 text-[9px] font-bold text-[var(--pulse-black)]">
                  End
                </motion.div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <div className={`w-1/3 rounded-lg bg-white/10 p-4 transition-all duration-500 ${panel >= 2 ? 'opacity-100' : 'opacity-50'}`} />
            <div className={`flex-1 rounded-lg bg-gradient-to-br from-[var(--pulse-jasmine)] to-[#fff5cc] p-5 transition-all duration-500 ${panel >= 1 ? 'opacity-100' : 'opacity-50'}`}>
              <div className="h-2 w-14 rounded bg-[var(--pulse-black)]/20" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--neutral-600)]">{captions[panel]}</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-2 w-2 rounded-full transition-colors ${i === panel ? 'bg-[var(--pulse-red)]' : 'bg-[var(--neutral-200)]'}`} />
            ))}
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   5. Code Playground
   ─────────────────────────────────────────────────────────────── */
export function CodePlaygroundDemo() {
  const [code, setCode] = useState('const flavors = ["mocha", "latte", "espresso"];\nconsole.log(flavors.map(f => f.toUpperCase()));');
  const [output, setOutput] = useState('');

  const run = () => {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(code);
      setOutput(String(result));
    } catch (e) {
      setOutput(String(e));
    }
  };

  const lines = code.split('\n');

  return (
    <DemoFrame title="Code Playground" badge="Live Execution">
      <EditorToolbar />
      <div className="p-0">
        <div className="relative">
          <div className="flex min-h-[7rem] w-full overflow-hidden rounded-b-[1.6rem] bg-[#0d0d0e]">
            <div className="border-r border-white/10 bg-white/5 py-3 pl-4 pr-3 text-right text-xs font-mono text-white/30 select-none">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              aria-label="Code editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent p-3 font-mono text-sm text-[#a5ffce] outline-none placeholder:text-white/20"
              spellCheck={false}
            />
          </div>
          <button
            onClick={run}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--pulse-jasmine)] px-3 py-1.5 text-xs font-bold text-[var(--pulse-black)] shadow hover:bg-[#fff5cc]"
          >
            <Play className="h-3 w-3" /> Run
          </button>
        </div>
        <div className="mx-4 mb-4 mt-4 rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-3">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
            <Terminal className="h-3 w-3" />
            Output
          </div>
          <pre className="font-mono text-sm text-[var(--pulse-black)]">{output || '// Click Run to see output'}</pre>
        </div>
      </div>
    </DemoFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   6. Flashcard
   ─────────────────────────────────────────────────────────────── */
export function FlashcardDemo() {
  const [flipped, setFlipped] = useState(false);

  return (
    <DemoFrame title="Flashcard" badge="Learning">
      <div className="flex justify-center py-6">
        <div
          onClick={() => setFlipped((f) => !f)}
          className="relative h-44 w-72 cursor-pointer perspective-[1000px]"
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full w-full rounded-2xl border border-[var(--neutral-200)] bg-white shadow-xl"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6" style={{ backfaceVisibility: 'hidden' }}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pulse-jasmine)]">
                <Sparkles className="h-5 w-5 text-[var(--pulse-black)]" />
              </div>
              <p className="text-center text-lg font-bold text-[var(--pulse-black)]">What is Pulse?</p>
              <p className="mt-1 text-sm text-[var(--neutral-500)]">Click to reveal</p>
            </div>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--pulse-jasmine)] to-[#fff5cc] px-6"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-center font-semibold leading-relaxed text-[var(--pulse-black)]">
                An interactive publishing engine that turns static posts into experiences.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </DemoFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   7. Timeline
   ─────────────────────────────────────────────────────────────── */
export function TimelineDemo() {
  const [active, setActive] = useState(0);
  const events = [
    { year: '1991', title: 'The Web goes public', desc: 'Tim Berners-Lee releases the World Wide Web to the world.' },
    { year: '2004', title: 'Web 2.0 begins', desc: 'Blogs, wikis, and social media turn readers into participants.' },
    { year: '2010', title: 'The mobile shift', desc: 'More people browse on phones than desktops. Attention spans start shrinking.' },
    { year: '2026', title: 'Pulse era', desc: 'Static blogs die. Interactive publishing becomes the new standard.' },
  ];

  return (
    <DemoFrame title="Timeline" badge="Scroll Narrative">
      <div className="p-5 sm:p-6">
        <div className="relative pl-4">
          <div className="absolute bottom-0 left-[0.6rem] top-0 w-px bg-[var(--neutral-200)]" />
          <div className="space-y-3">
            {events.map((ev, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative flex w-full items-start gap-4 rounded-xl border p-3 text-left transition-all ${
                  active === i ? 'border-[var(--pulse-red)]/20 bg-[var(--pulse-jasmine)]/20' : 'border-transparent bg-[var(--neutral-50)] hover:bg-[var(--neutral-100)]'
                }`}
              >
                <span className={`absolute left-[-0.85rem] top-[1.1rem] h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm ${active === i ? 'bg-[var(--pulse-red)]' : 'bg-[var(--neutral-300)]'}`} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-red)]">{ev.year}</p>
                  <p className="font-semibold text-[var(--pulse-black)]">{ev.title}</p>
                  {active === i && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-1 text-sm text-[var(--neutral-600)]">
                      {ev.desc}
                    </motion.p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   8. AI Builder
   ─────────────────────────────────────────────────────────────── */
function useTyping(text: string, speed = 40) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplay('');
    const id = setInterval(() => {
      setDisplay(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return display;
}

export function AiBuilderDemo() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const placeholder = useTyping('a pricing table with three tiers');

  const generate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setResult(null);
    setTimeout(() => {
      setGenerating(false);
      setResult(`Generated a "${prompt}" block with schema, editor UI, and renderer support.`);
    }, 1500);
  };

  return (
    <DemoFrame title="AI Block Builder" badge="Generative">
      <div className="p-5 sm:p-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              aria-label="Block generation prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generate()}
              placeholder={placeholder}
              className="w-full rounded-xl border border-[var(--neutral-200)] bg-white px-4 py-2.5 text-sm text-[var(--pulse-black)] outline-none placeholder:text-[var(--neutral-400)] focus:border-[var(--pulse-red)]"
            />
            {!prompt && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--neutral-400)]">
                AI is listening...
              </span>
            )}
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--pulse-black)] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-[var(--pulse-red)] disabled:opacity-60"
          >
            <Wand2 className="h-4 w-4" />
            {generating ? 'Building...' : 'Build'}
          </button>
        </div>

        {generating && (
          <div className="mt-4 rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--pulse-black)]">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--neutral-300)] border-t-[var(--pulse-red)]" />
              Generating block...
            </div>
            <div className="space-y-2">
              {['Schema', 'Editor UI', 'Renderer', 'Tests'].map((step, i) => (
                <div key={step} className="flex items-center gap-2 text-xs text-[var(--neutral-600)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--pulse-red)]" />
                  {step}
                  <span className="ml-auto text-[10px] text-[var(--neutral-400)]">
                    {i < 2 ? 'Done' : i === 2 ? 'In progress' : 'Queued'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {result}
          </motion.div>
        )}
      </div>
    </DemoFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   9. Slash Commands
   ─────────────────────────────────────────────────────────────── */
export function SlashCommandsDemo() {
  const [query, setQuery] = useState('/');
  const [inserted, setInserted] = useState<string | null>(null);

  const commands = [
    { id: 'text', icon: Type, label: 'Text', shortcut: '/text' },
    { id: 'heading', icon: Heading, label: 'Heading', shortcut: '/h1' },
    { id: 'list', icon: List, label: 'Bullet List', shortcut: '/list' },
    { id: 'image', icon: ImageIcon, label: 'Image', shortcut: '/image' },
    { id: 'code', icon: Code, label: 'Code', shortcut: '/code' },
    { id: 'quote', icon: Quote, label: 'Quote', shortcut: '/quote' },
  ];

  const filtered = commands.filter((c) => c.shortcut.includes(query.toLowerCase()));

  return (
    <DemoFrame title="Slash Commands" badge="Speed">
      <div className="relative p-5 sm:p-6">
        <div className="rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-4 py-3 font-mono text-sm text-[var(--pulse-black)]">
          {query}
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[var(--pulse-red)]" />
        </div>

        <div className="mt-3 rounded-xl border border-[var(--neutral-200)] bg-white p-2 shadow-xl">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-400)]">
            Commands
          </div>
          {filtered.map((cmd, idx) => (
            <button
              key={cmd.id}
              onClick={() => { setInserted(cmd.label); setQuery('/'); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${idx === 0 ? 'bg-[var(--neutral-50)]' : 'hover:bg-[var(--neutral-50)]'}`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--neutral-200)] bg-white">
                <cmd.icon className="h-3.5 w-3.5 text-[var(--neutral-500)]" />
              </div>
              <span className="text-sm font-medium text-[var(--pulse-black)]">{cmd.label}</span>
              <span className="ml-auto text-xs font-mono text-[var(--neutral-400)]">{cmd.shortcut}</span>
              {idx === 0 && <span className="ml-2 text-[10px] font-bold text-[var(--neutral-400)]">ENTER</span>}
            </button>
          ))}
        </div>

        {inserted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-lg bg-[var(--pulse-jasmine)]/30 px-3 py-2 text-sm text-[var(--pulse-black)]">
            Inserted <strong>{inserted}</strong> block
          </motion.div>
        )}
      </div>
    </DemoFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   10. Interactive Chart
   ─────────────────────────────────────────────────────────────── */
export function ChartDemo() {
  const [hovered, setHovered] = useState<number | null>(null);
  const data = [
    { label: 'Finland', value: 12, start: '#FF2800', end: '#ff6b4a' },
    { label: 'Norway', value: 10, start: '#FFE695', end: '#fff5cc' },
    { label: 'Iceland', value: 9, start: '#373737', end: '#6b6b6b' },
  ];

  return (
    <DemoFrame title="Interactive Chart" badge="Data Viz">
      <div className="p-5 sm:p-6">
        <div className="mb-3 text-sm font-medium text-[var(--pulse-black)]">Coffee consumption per capita (kg/year)</div>
        <div className="flex items-end gap-3 rounded-xl bg-[var(--neutral-50)] p-4">
          {data.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${d.value * 14}px` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="w-full max-w-[3rem] cursor-pointer rounded-t-lg transition-opacity"
                style={{
                  background: `linear-gradient(180deg, ${d.start}, ${d.end})`,
                  opacity: hovered === null || hovered === i ? 1 : 0.35,
                }}
              />
              <span className="text-[11px] font-semibold text-[var(--neutral-600)]">{d.label}</span>
            </div>
          ))}
        </div>
        {hovered !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-center text-sm font-bold text-[var(--pulse-black)]">
            {data[hovered].label}: <span style={{ color: data[hovered].start }}>{data[hovered].value} kg</span>
          </motion.div>
        )}
      </div>
    </DemoFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   11. Before / After
   ─────────────────────────────────────────────────────────────── */
export function BeforeAfterDemo() {
  const [slider, setSlider] = useState(50);

  return (
    <DemoFrame title="Before / After" badge="Comparison">
      <div className="p-5 sm:p-6">
        <div
          className="relative h-44 w-full cursor-ew-resize overflow-hidden rounded-xl"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            setSlider(pct);
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--neutral-100)]">
            <Image className="h-8 w-8 text-[var(--neutral-400)]" />
            <span className="text-sm font-bold text-[var(--neutral-400)]">Raw photo</span>
            <span className="text-xs text-[var(--neutral-400)]">Flat colors</span>
          </div>
          <div
            className="absolute inset-y-0 left-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-[var(--pulse-jasmine)] to-[#fff5cc]"
            style={{ width: `${slider}%` }}
          >
            <Image className="h-8 w-8 text-[var(--pulse-black)]" />
            <span className="text-sm font-bold text-[var(--pulse-black)]">Pulse edit</span>
            <span className="text-xs font-semibold text-[var(--pulse-black)]/70">Rich contrast</span>
          </div>
          <div
            className="absolute inset-y-0 flex items-center justify-center rounded-full border-2 border-white bg-white shadow-lg"
            style={{ left: `${slider}%`, transform: 'translateX(-50%)', width: 28, height: 28 }}
          >
            <GripVertical className="h-4 w-4 text-[var(--neutral-400)]" />
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-[var(--neutral-500)]">Drag to compare</p>
      </div>
    </DemoFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   12. Accordion
   ─────────────────────────────────────────────────────────────── */
export function AccordionDemo() {
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    { q: 'What makes Pulse different?', a: 'Pulse treats every post as an interactive experience, not a flat document.' },
    { q: 'Do I need to code?', a: 'No. The editor is visual. But developers can extend it with custom blocks.' },
    { q: 'Can I use it with Next.js?', a: 'Yes. Pulse ships adapters for Next.js, Nuxt, and Astro.' },
  ];

  return (
    <DemoFrame title="Accordion Block" badge="Compact">
      <div className="space-y-2 p-5 sm:p-6">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-[var(--neutral-200)] bg-white">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold text-[var(--pulse-black)]">{item.q}</span>
              <div className={`flex h-6 w-6 items-center justify-center rounded-md border border-[var(--neutral-200)] bg-[var(--neutral-50)] transition-all ${open === i ? 'rotate-180' : ''}`}>
                {open === i ? <Minus className="h-3 w-3 text-[var(--neutral-500)]" /> : <Plus className="h-3 w-3 text-[var(--neutral-500)]" />}
              </div>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-3 text-sm leading-relaxed text-[var(--neutral-600)]">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </DemoFrame>
  );
}
