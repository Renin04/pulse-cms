'use client';

import { useMemo, useState } from 'react';
import {
  Type,
  Heading,
  List,
  Image as ImageIcon,
  Code,
  Quote,
  Sparkles,
  MousePointer,
  Keyboard,
  Eye,
  Workflow,
  PanelsTopLeft,
  Wand2,
} from 'lucide-react';

const blockTypes = [
  { icon: Type, label: 'Text', shortcut: '/text' },
  { icon: Heading, label: 'Heading', shortcut: '/h1' },
  { icon: List, label: 'List', shortcut: '/list' },
  { icon: ImageIcon, label: 'Image', shortcut: '/image' },
  { icon: Code, label: 'Code', shortcut: '/code' },
  { icon: Quote, label: 'Quote', shortcut: '/quote' },
];

const modes = [
  { id: 'compose', label: 'Compose', icon: PanelsTopLeft },
  { id: 'preview', label: 'Rendered', icon: Eye },
  { id: 'system', label: 'Command map', icon: Workflow },
] as const;

type DemoMode = (typeof modes)[number]['id'];

export default function DemoEmbed() {
  const [activeMode, setActiveMode] = useState<DemoMode>('compose');
  const [transitionTick, setTransitionTick] = useState(0);
  const [demoText, setDemoText] = useState(
    'Pulse helps teams turn static posts into richer product stories.'
  );

  const wordCount = useMemo(
    () => (demoText.trim() ? demoText.trim().split(/\s+/).length : 0),
    [demoText],
  );

  const handleModeChange = (mode: DemoMode) => {
    if (mode === activeMode) return;
    setActiveMode(mode);
    setTransitionTick((value) => value + 1);
  };

  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/76 shadow-[0_28px_80px_-44px_rgba(17,24,39,0.55)] backdrop-blur-xl">
      <div className="pointer-events-none absolute right-8 top-8 grid grid-cols-5 gap-1.5 opacity-50">
        {Array.from({ length: 25 }).map((_, index) => (
          <span
            key={index}
            className="h-2.5 w-2.5 rounded-[4px] bg-[var(--pulse-red)]/15"
            style={{ opacity: index % 4 === 0 ? 1 : 0.45 }}
          />
        ))}
      </div>

      <div className="border-b border-[var(--neutral-200)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,249,235,0.7))] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="pulse-kicker mb-2">Interactive state switcher</p>
            <h3 className="text-2xl font-bold text-[var(--pulse-black)]">
              Compose, inspect, and preview the same content flow
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleModeChange(mode.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  activeMode === mode.id
                    ? 'bg-[var(--pulse-black)] text-white shadow-[0_14px_26px_-18px_rgba(17,24,39,0.7)]'
                    : 'bg-white text-[var(--neutral-600)] hover:bg-[var(--pulse-jasmine-light)] hover:text-[var(--pulse-black)]'
                }`}
              >
                <mode.icon className="h-4 w-4" />
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="demo-tool-selector inline-flex flex-wrap items-center gap-2 rounded-full border border-[var(--neutral-200)] bg-white/90 p-2 shadow-[0_18px_34px_-30px_rgba(17,24,39,0.35)]">
            {blockTypes.slice(0, 5).map((block) => (
              <span
                key={block.label}
                className="demo-tool-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--neutral-500)]"
              >
                <block.icon className="h-3.5 w-3.5" />
                {block.label}
              </span>
            ))}
          </div>
        </div>

        <div className="demo-mode-track mt-4 grid gap-2 sm:grid-cols-3">
          {[
            ['Compose', 'Write, insert, and guide the structure.'],
            ['Rendered', 'See the same story become a reading surface.'],
            ['System', 'Inspect the block logic behind the output.'],
          ].map(([title, text], index) => {
            const mode = modes[index].id;

            return (
              <button
                key={title}
                type="button"
                onClick={() => handleModeChange(mode)}
                className={`demo-mode-card rounded-[1.1rem] border px-4 py-3 text-left transition-all duration-300 ${
                  activeMode === mode
                    ? 'border-[var(--pulse-red)]/20 bg-[var(--pulse-jasmine-light)]'
                    : 'border-[var(--neutral-200)] bg-white/72 hover:bg-white'
                }`}
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--neutral-400)]">
                  0{index + 1}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--pulse-black)]">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--neutral-600)]">{text}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="border-b border-[var(--neutral-200)] p-5 sm:p-6 xl:border-b-0 xl:border-r">
          <div className="mb-4 flex items-center gap-2 rounded-full border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--neutral-500)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--pulse-red)]" />
            {activeMode === 'compose'
              ? 'Editor state'
              : activeMode === 'preview'
                ? 'Rendered state'
                : 'System state'}
          </div>

          <div className="demo-pixel-shell rounded-[1.6rem] border border-[var(--neutral-200)] bg-white p-4 shadow-[0_18px_34px_-30px_rgba(17,24,39,0.5)] sm:p-5">
            <div key={transitionTick} className="demo-pixel-overlay" aria-hidden="true">
              {Array.from({ length: 24 }).map((_, index) => (
                <span
                  key={`${transitionTick}-${index}`}
                  className="demo-pixel-overlay__cell"
                  style={{ animationDelay: `${index * 18}ms` }}
                />
              ))}
            </div>
            <div key={activeMode} className="demo-pixel-surface space-y-5">
              {activeMode === 'compose' ? (
                <>
                <div>
                  <h4 className="text-2xl font-bold text-[var(--pulse-black)]">
                    Welcome to Pulse
                  </h4>
                  <p className="mt-2 text-[var(--neutral-600)] leading-7">
                    Type{' '}
                    <kbd className="rounded bg-[var(--neutral-100)] px-2 py-1 text-sm font-mono text-[var(--pulse-red)]">
                      /
                    </kbd>{' '}
                    to insert rich blocks, call AI actions, or shape a guided content experience.
                  </p>
                </div>

                <div className="relative">
                  <textarea
                    value={demoText}
                    onChange={(event) => setDemoText(event.target.value)}
                    placeholder="Try typing here..."
                    className="min-h-[10rem] w-full rounded-[1.2rem] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4 text-[var(--pulse-black)] outline-none placeholder:text-[var(--neutral-400)] focus:border-[var(--pulse-red)] focus:ring-2 focus:ring-[var(--pulse-red)]/20"
                  />

                  {demoText.startsWith('/') && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-3 rounded-[1rem] border border-[var(--neutral-200)] bg-white p-2 shadow-xl">
                      <div className="px-2 py-1 text-xs font-medium text-[var(--neutral-500)]">
                        Commands
                      </div>
                      {blockTypes.map((block) => (
                        <button
                          key={block.label}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-[var(--neutral-100)]"
                          onClick={() => setDemoText('')}
                        >
                          <block.icon className="h-4 w-4 text-[var(--neutral-500)]" />
                          <span className="text-sm text-[var(--pulse-black)]">{block.label}</span>
                          <span className="ml-auto text-xs text-[var(--neutral-400)]">
                            {block.shortcut}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pulse-jasmine)]/35 px-3 py-1 text-sm text-[var(--pulse-black)]">
                    <MousePointer className="h-3.5 w-3.5" />
                    Drag & Drop
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pulse-jasmine)]/35 px-3 py-1 text-sm text-[var(--pulse-black)]">
                    <Keyboard className="h-3.5 w-3.5" />
                    Keyboard shortcuts
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pulse-red)]/10 px-3 py-1 text-sm text-[var(--pulse-red)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI ready
                  </span>
                </div>
                </>
              ) : null}

              {activeMode === 'preview' ? (
                <>
                <div className="rounded-[1.2rem] bg-[linear-gradient(145deg,rgba(255,249,235,0.9),rgba(255,255,255,1))] p-5">
                  <p className="pulse-kicker mb-2">Rendered article</p>
                  <h4 className="text-2xl font-bold text-[var(--pulse-black)]">
                    How product teams can publish stories that actually teach
                  </h4>
                  <p className="mt-3 text-[var(--neutral-600)] leading-7">
                    Pulse lets you combine explanation, interaction, and visual proof so a
                    single post can educate, demonstrate, and convert.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1rem] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
                    <p className="text-sm font-semibold text-[var(--pulse-black)]">Interactive proof block</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--neutral-600)]">
                      Show the workflow while the reader is still inside the story.
                    </p>
                  </div>
                  <div className="rounded-[1rem] bg-[var(--pulse-black)] p-4 text-white">
                    <p className="text-sm font-semibold">Guided conversion moment</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      Move from explanation to action with contextual CTAs and demos.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['Demo', 'Quiz', 'Callout', 'Timeline', 'Code'].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--neutral-700)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                </>
              ) : null}

              {activeMode === 'system' ? (
                <div className="grid gap-4 md:grid-cols-2">
                {blockTypes.map((block) => (
                  <div
                    key={block.label}
                    className="rounded-[1rem] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-xl bg-white p-2 shadow-sm">
                        <block.icon className="h-4 w-4 text-[var(--pulse-red)]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--pulse-black)]">{block.label}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--neutral-400)]">
                          {block.shortcut}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-[var(--neutral-600)]">
                      Add this block through slash commands, toolbar shortcuts, or inline prompts.
                    </p>
                  </div>
                ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-[linear-gradient(180deg,rgba(250,250,250,0.8),rgba(255,245,204,0.38))] p-5 sm:p-6">
          <div className="rounded-[1.5rem] border border-white/80 bg-white/88 p-5 shadow-[0_18px_34px_-30px_rgba(17,24,39,0.5)]">
            <p className="pulse-kicker mb-3">State explanation</p>
            <h4 className="text-xl font-bold text-[var(--pulse-black)]">
              {activeMode === 'compose'
                ? 'Authoring stays fast and expressive'
                : activeMode === 'preview'
                  ? 'Output feels like a designed experience'
                  : 'Commands stay discoverable and structured'}
            </h4>
            <p className="mt-3 text-sm leading-7 text-[var(--neutral-600)]">
              {activeMode === 'compose'
                ? 'This mode emphasizes speed: shortcuts, inline actions, and AI support stay close to the writer.'
                : activeMode === 'preview'
                  ? 'This mode shows how the same content becomes a richer narrative with proof, pacing, and interaction.'
                  : 'This mode makes the system legible by exposing the building blocks behind the experience.'}
            </p>

            <div className="mt-6 space-y-3">
              {[
                {
                  icon: PanelsTopLeft,
                  title: 'Editor surface',
                  text: 'Structured enough for teams, still fluid enough for creators.',
                },
                {
                  icon: Wand2,
                  title: 'AI assistance',
                  text: 'Ideas, rewrites, and suggestions appear where the content lives.',
                },
                {
                  icon: Workflow,
                  title: 'Publishing logic',
                  text: 'Blocks and rendering rules stay connected from authoring to output.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1rem] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white p-2 shadow-sm">
                      <item.icon className="h-4 w-4 text-[var(--pulse-red)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--pulse-black)]">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--neutral-600)]">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-[1.1rem] border border-[var(--neutral-200)] bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--neutral-500)]">
            <div className="flex items-center gap-4">
              <span>{demoText.length} characters</span>
              <span>{wordCount} words</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              Ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
