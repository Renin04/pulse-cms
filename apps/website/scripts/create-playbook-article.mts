/**
 * Create "The Interactive Content Playbook" — the all-blocks masterpiece article.
 * Direct Prisma seed (no dev server needed). Idempotent: replaces the slug if it exists.
 * Run:  cd apps/website && DATABASE_URL="file:./prisma/dev.db" npx tsx scripts/create-playbook-article.mts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SLUG = 'interactive-content-playbook';
const IMG = '/images/interactive-content-playbook';

function uid(prefix = 'b') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}
function B(type, data) {
  const now = new Date().toISOString();
  return { id: uid(), type, data, createdAt: now, updatedAt: now };
}
const TXT = (text) => ({ text, marks: { bold: false, italic: false, underline: false, code: false }, align: 'left' });

function makeBlocks() {
  const blocks = [];

  /* ── ACT 1 — THE PROBLEM ─────────────────────────────────────────── */

  // 1 · Hero
  blocks.push(B('hero-section', {
    title: 'The Static Blog Post Is Dead.',
    subtitle: 'Readers give you eight seconds. Interactive content gives them a reason to stay for eight minutes. This is the playbook — and you will choose how it unfolds.',
    overlayText: 'The Interactive Content Playbook · 2026',
    overlayAlign: 'left',
    overlayFontSize: 'md',
    backgroundType: 'image',
    backgroundImageUrl: `${IMG}/hero.jpeg`,
    backgroundImageFit: 'cover',
    imageScrimOpacity: 0.6,
    titleAlign: 'left',
    subtitleAlign: 'left',
    titleSize: 'xl',
    subtitleSize: 'md',
    ctaLabel: 'Choose your path',
    ctaUrl: '/blog/interactive-content-playbook#choose-your-role',
    ctaAlign: 'left',
    ctaStyle: 'filled',
    ctaBorderRadius: 'pill',
    ctaTarget: '_self',
    geometricForm: 'rings',
    geometricPosition: 'top-right',
    geometricOpacity: 0.18,
    heroHeight: 'tall',
    contentValign: 'bottom',
    entranceAnimation: true,
  }));

  // 2 · Cold open
  blocks.push(B('text', TXT(
    "Eight seconds. That is what the average reader gives a static blog post before deciding its fate [ref](https://marketingltb.com/blog/statistics/interactive-content/){text=\"Interactive Content Statistics — Marketing LTB\"}.\n\nShe opens your article. Her eyes hit the first wall of gray text. Her thumb twitches toward the tab bar. ==She is not lazy — she is voting.== Every reader casts this vote, on every page, every day. And the results are brutal: interactive content earns **two to three times more engagement** than the static kind, and 62% of people say they prefer content they can actually touch [ref](https://s2s.media/blog/interactive-content-gamification-engagement-2025){text=\"Interactive Content & Gamification — S2S Media\"}.\n\nThis article is not *about* that fact. It is {color:#ff2800}built on it{/color}. Every block you are about to meet is live. Three times, the page will stop and ask you to choose. What happens next is, quite literally, up to you."
  )));

  // 3 · Callout
  blocks.push(B('callout', {
    variant: 'tip',
    title: 'The 52.6% rule',
    body: 'Interactive content generates [52.6% more engagement](https://s2s.media/blog/interactive-content-gamification-engagement-2025) than static content — not because readers are children, but because ==attention follows agency==. Give people something to do and they give you something back: time.',
    titleAlign: 'left',
    contentAlign: 'left',
  }));

  // 4 · Alert
  blocks.push(B('alert', {
    severity: 'warning',
    title: 'A gentle warning before we begin',
    message: 'Everything in this article is functional. The polls count, the sandbox runs, the branches remember your choice. If you were planning to skim, the page will notice — it was designed for exactly you.',
    dismissible: true,
    isDismissed: false,
  }));

  // 5 · Blockquote
  blocks.push(B('blockquote', {
    quote: 'People will forget what you said, but they will never forget what you let them do.',
    citation: '— after Maya Angelou, remixed by every UX designer who ever lived',
    align: 'left',
    citationAlign: 'left',
  }));

  // 6 · H2 The problem
  blocks.push(B('heading', { text: 'The eight-second funeral', level: 2, anchorId: 'the-problem' }));

  // 7 · Story
  blocks.push(B('text', TXT(
    "Last winter I watched a friend read a blog post. Or rather, I watched her *not* read it. She opened a 2,000-word essay — a good one, the kind with sentences its author cried over — and within eight seconds she had scrolled to the bottom, scanned for anything that moved, found nothing, and closed the tab.\n\n\"It looked like homework,\" she said.\n\nThe essay did not fail because it was badly written. It failed because it asked for everything and offered nothing. No question to answer. No choice to make. No button that admitted she existed. ==A static page is a monologue; the web was built for dialogue.==\n\nSo here is the deal this article makes with you: `no walls of gray`. When I want to show you data, you will interrogate it. When I want to teach you something, you will test it. And three times — at the crossroads below — you will pick the road."
  )));

  // 8 · Image — attention
  blocks.push(B('image', {
    src: `${IMG}/attention.jpeg`,
    alt: 'A single reader holding a glowing paper book in a dark room full of floating, endlessly scrolling screens',
    title: 'One lit book in a sea of glowing feeds',
    width: 1600,
    height: 900,
    fit: 'cover',
    status: 'ready',
    align: 'center',
    displaySize: 'large',
    caption: 'The last static reader. Attention does not disappear — it migrates to whatever asks something of it.',
    captionAlign: 'center',
  }));

  // 9 · Comparison — 3 columns (static / interactive / branched)
  blocks.push(B('comparison', {
    title: 'Three generations of the blog post',
    align: 'center',
    columns: [
      { id: 'col-static', title: 'Static', subtitle: '1994–2015', accent: '#8a8f98' },
      { id: 'col-interactive', title: 'Interactive', subtitle: '2015–2024', accent: '#0f8a7d' },
      { id: 'col-branched', title: 'Branched', subtitle: '2025 →', accent: '#ff2800', highlight: true, badge: 'You are here' },
    ],
    rows: [
      { id: 'r1', label: 'Reader\'s role', values: ['Audience', 'Participant', 'Co-author'] },
      { id: 'r2', label: 'What they do', values: ['Scroll', 'Click & answer', 'Choose the story itself'] },
      { id: 'r3', label: 'Engagement vs. static', values: ['1× (baseline)', '2–3× (see References)', 'Compounding — every choice is an investment'] },
      { id: 'r4', label: 'What the writer learns', values: ['Pageviews', 'Answers', 'Paths — *which* story each reader wanted'] },
      { id: 'r5', label: 'Feels like', values: ['Homework', 'A quiz show', 'A journey'] },
    ],
  }));

  // 10 · Chart — engagement
  blocks.push(B('chart', {
    title: 'Relative engagement by content format',
    caption: 'Static is the 1× baseline. Interactive range from [industry statistics](https://marketingltb.com/blog/statistics/interactive-content/); the branched bar is the trend those same reports describe for 2025–26. Illustrative midpoint values.',
    titleAlign: 'left',
    captionAlign: 'left',
    chartType: 'bar',
    slices: [],
    categories: ['Static article', 'Interactive (quiz, poll, calc)', 'Branched narrative'],
    series: [
      { id: 'ds-eng', label: 'Relative engagement (×)', values: [1, 2.6, 3.4], color: '#ff2800' },
    ],
    showLegend: false,
    showGrid: true,
    showValues: true,
  }));

  // 11 · Table — the evidence
  blocks.push(B('table', {
    caption: 'What the research says, in one place',
    captionAlign: 'left',
    columns: ['Finding', 'Source', 'Year'],
    columnAligns: ['left', 'left', 'right'],
    rows: [
      ['Interactive content earns 2–3× more engagement than static', '[Marketing LTB](https://marketingltb.com/blog/statistics/interactive-content/)', '2026'],
      ['52.6% more engagement from interactive & gamified content', '[S2S Media](https://s2s.media/blog/interactive-content-gamification-engagement-2025)', '2025'],
      ['62% of users prefer content they can interact with', '[Marketing LTB](https://marketingltb.com/blog/statistics/interactive-content/)', '2026'],
      ['Shoppable/branching video: 9× higher purchase intent', '[MM Communications](https://mmcommunications.vn/en/interactive-video-marketing-shoppable-video-engagement-n571)', '2025'],
      ['Choose-your-own-adventure formats named a defining trend', '[GoViral Digital](https://goviraldigital.com/interactive-storytelling-in-2025/)', '2025'],
    ],
  }));

  // 12 · HR
  blocks.push(B('horizontal-rule', {}));

  /* ── ACT 2 — BRANCH POINT ① ──────────────────────────────────────── */

  // 13 · H2 choose your role
  blocks.push(B('heading', { text: 'First crossroads: who is reading?', level: 2, anchorId: 'choose-your-role' }));

  // 14 · Branch setup
  blocks.push(B('text', TXT(
    "A static article would now lecture all of you identically — the poet and the performance marketer, word for identical word. That is the old way.\n\n==This is your first branch point.== Below are three doors. Behind each is the same playbook, tuned for a different pair of hands. Pick the one that sounds like you. The page will remember — and ==the sections that follow will quietly rearrange themselves around your answer==. Choose, and watch what happens just below the doors."
  )));

  // 15 · BRANCHES #1
  const rolePrompt = 'Which of these sounds most like you?';
  const roleBranches = [
    {
      id: 'role-writer',
      label: 'The Writer',
      description: 'You live and die by the sentence.',
      content: "**Then hear the good news first: interactivity is not the enemy of prose — it is the stage for it.** Your enemy is the wall of gray, not the button.\n\nWatch for three things in what follows: the *tabs* that let one argument breathe in three voices, the *before/after* that proves a single choice rewrites a paragraph's fate, and the *flashcards* that turn your best lines into something readers memorize instead of skim.\n\nYour craft still does the heavy lifting. The blocks just make sure somebody is there to see it.",
    },
    {
      id: 'role-educator',
      label: 'The Educator',
      description: 'You teach, train, or explain for a living.',
      content: "**You already know the secret: people learn by doing, not by reading about doing.** Interactive content is just pedagogy with better branding.\n\nWatch for the *quiz* and *survey* blocks (formative assessment, dressed for the web), the *stepped equation* that reveals a derivation one move at a time, and the *auto-solve* block that lets a student watch the computer think.\n\nEvery example in this playbook doubles as a lesson plan. Steal freely.",
    },
    {
      id: 'role-marketer',
      label: 'The Marketer',
      description: 'You measure things. You want the numbers.',
      content: "**Straight to the point: engagement is the leading indicator, conversion is the lagging one — and interaction moves both.** Shoppable and branching formats show up to 9× higher purchase intent [ref](https://mmcommunications.vn/en/interactive-video-marketing-shoppable-video-engagement-n571){text=\"Interactive Video Marketing 2025 — MM Communications\"}.\n\nWatch for the *poll* (zero-friction micro-conversion), the *chart spec mode* (your data, your way), and the *branch analytics angle*: every path a reader picks is a segment they self-selected into.\n\nThe spreadsheet case is made below. Twice.",
    },
  ];
  blocks.push(B('branches', { prompt: rolePrompt, branches: roleBranches }));

  /* ── GATED SECTIONS — one per role, each bound to branch point ① ──────
     Every block carries wrapper-level meta.gate ({ branchesId, branchId });
     the data schemas stay untouched. All three sections render into the
     initial HTML (SEO/no-JS: everything visible); hydration collapses the
     two losing sections once a path is chosen. The branchesId is derived
     from the exact prompt + branch identity above via stableBranchesId —
     the same deterministic hash the renderer stamps into data-branches-id. */
  const roleBranchesId = stableBranchesId(rolePrompt, roleBranches);
  const BG = (type, data, branchId) => ({
    ...B(type, data),
    meta: { gate: { branchesId: roleBranchesId, branchId } },
  });

  // 15a · WRITER section — signature block: a blockquote about craft
  blocks.push(BG('heading', { text: 'For the Writer: your sentences are safe here', level: 3, anchorId: 'for-the-writer' }, 'role-writer'));
  blocks.push(BG('text', TXT(
    "You picked the path of the sentence, so let us talk about the only thing that has ever made a reader stay: *voice*. Every block in this playbook is machinery; the words are still the show. If you keep one idea from this entire article, keep the one below — it is the writer's whole contract with the interactive age."
  ), 'role-writer'));
  blocks.push(BG('blockquote', {
    quote: 'Interactivity never asks you to write less. It asks you to write sentences worth arriving at — then it builds the road that brings the reader to them.',
    citation: '— the whole playbook, compressed to one breath',
    align: 'left',
    citationAlign: 'left',
  }, 'role-writer'));

  // 15b · EDUCATOR section — signature block: retention-formula refresher
  blocks.push(BG('heading', { text: 'For the Educator: the retention formula, refreshed', level: 3, anchorId: 'for-the-educator' }, 'role-educator'));
  blocks.push(BG('text', TXT(
    "You chose the teaching path, so here is the one model worth keeping in your pocket. You will meet the full derivation in the lab below; consider this the ==pocket refresher== — three steps, no notes, step through them at your own pace."
  ), 'role-educator'));
  blocks.push(BG('stepped-equation', {
    highlightChanges: true,
    align: 'center',
    caption: 'The retention formula: why a lesson that asks something keeps the room.',
    captionAlign: 'center',
    steps: [
      { id: 're1', latex: 'R_n = r \\times R_{n-1}', caption: 'Step 1 — the refresher itself: r is the fraction of learners who continue past each section. Everything else is arithmetic.' },
      { id: 're2', latex: 'R_3 = r^3 \\times R_0', caption: 'Step 2 — three sections in, retention compounds. Small leaks sink long lessons.' },
      { id: 're3', latex: 'R_3 = 0.95^3 \\times R_0 \\approx 0.86 \\times R_0', caption: 'Step 3 — every check for understanding (a quiz, a reveal, a solved step) nudges r toward 0.95. That is formative assessment wearing a web page.' },
    ],
  }, 'role-educator'));

  // 15c · MARKETER section — signature block: funnel-leak bar chart
  blocks.push(BG('heading', { text: 'For the Marketer: where your funnel leaks', level: 3, anchorId: 'for-the-marketer' }, 'role-marketer'));
  blocks.push(BG('text', TXT(
    "You came for the numbers, so here is the uncomfortable one: a static post is a funnel with the same hole at every stage. Watch where the readers fall out — then notice which blocks in this article patch which leak."
  ), 'role-marketer'));
  blocks.push(BG('chart', {
    title: 'Where your funnel leaks',
    caption: 'Share of readers remaining at each stage of a static article (illustrative midpoints from the engagement reports cited above). The final stage barely exists without an interaction to act on.',
    titleAlign: 'left',
    captionAlign: 'left',
    chartType: 'bar',
    slices: [],
    categories: ['Opened', 'Scrolled halfway', 'Finished', 'Acted on it'],
    series: [
      { id: 'ds-funnel', label: 'Readers remaining (%)', values: [100, 41, 17, 4], color: '#ff2800' },
    ],
    showLegend: false,
    showGrid: true,
    showValues: true,
  }, 'role-marketer'));

  /* ── ACT 3 — THE THREE LAWS ──────────────────────────────────────── */

  blocks.push(B('heading', { text: 'The three laws of interactive content', level: 2, anchorId: 'the-laws' }));

  blocks.push(B('tabs', {
    activeTabId: 'law-agency',
    tabsAlign: 'center',
    contentAlign: 'left',
    tabs: [
      { id: 'law-agency', label: 'I · Agency', content: "**The reader must be able to act.** A choice, a vote, a reveal, a slider — anything that acknowledges a hand on the other side of the glass. Agency is why ==the page stops being a poster and becomes a room==. Every block in Pulse exists to serve this law; the *branches* you just used is its purest form." },
      { id: 'law-feedback', label: 'II · Feedback', content: "**Every action must be answered.** Click and the page shrugs? The reader leaves. Click and it *responds* — explains, celebrates, reroutes — and the loop closes. This is why the quiz below ships with per-option explanations, why the spoiler dissolves instead of merely opening, why the sandbox prints its output instantly." },
      { id: 'law-play', label: 'III · Play', content: "**If it is not a little bit fun, it is just a form.** Play is the difference between an interaction and an interruption. Flip a flashcard. Drag the before/after divider. Watch a speech bubble argue with you. {color:#ff2800}Delight is a retention strategy.{/color}" },
    ],
  }));

  blocks.push(B('flashcard', {
    title: 'Memorize the laws',
    shuffle: true,
    cards: [
      { id: 'fc1', front: 'Law I — Agency', back: 'The reader must be able to ACT. Choice, vote, reveal, slider. A page without agency is a poster.', tag: 'The Three Laws' },
      { id: 'fc2', front: 'Law II — Feedback', back: 'Every action must be ANSWERED. Explanations, reveals, reroutes. The loop must close.', tag: 'The Three Laws' },
      { id: 'fc3', front: 'Law III — Play', back: 'If it is not a little bit FUN, it is just a form. Delight is a retention strategy.', tag: 'The Three Laws' },
      { id: 'fc4', front: 'The 8-second rule', back: 'Readers vote with their thumbs in ~8 seconds. Interactivity is how you buy the next eight.', tag: 'Bonus' },
      { id: 'fc5', front: 'The branch test', back: 'Would a reader care which path they picked? If not, it is decoration, not a branch.', tag: 'Bonus' },
    ],
  }));

  blocks.push(B('accordion', {
    allowMultiple: false,
    titleAlign: 'left',
    contentAlign: 'left',
    items: [
      { id: 'faq-cost', title: '“Interactive content is expensive to make.”', content: 'It was, once. That sentence is the fossil of an era when every quiz needed a developer. The block editor changed the economics: the quiz, poll, and branch in this article were assembled in minutes, not sprints. The expensive part is now the *thinking* — and that was always the expensive part.', defaultOpen: false },
      { id: 'faq-seo', title: '“Google can’t crawl interactive pages.”', content: 'A well-built interactive page is *more* crawlable, not less — as long as content ships in the initial HTML. Every branch in this article renders inside native `<details>` elements for exactly that reason: the choice is interactive, the text is all there. Interaction should be a layer, not a lock.', defaultOpen: false },
      { id: 'faq-a11y', title: '“It breaks accessibility.”', content: 'Only if you build it badly. Keyboard-navigable tabs, focusable sliders, `aria-pressed` flips, reduced-motion fallbacks — the blocks in this article carry all of it. Accessibility is not the enemy of interaction; it is interaction done with respect.', defaultOpen: false },
      { id: 'faq-gimmick', title: '“It’s a gimmick. Good writing doesn’t need tricks.”', content: 'Agreed — and nobody is asking the writing to carry fewer gallons of truth. The trick is not the point. The *attention* is. A gimmick evaporates after the click; a well-placed interaction converts a skimmer into a reader who is still here, four scrolls later, reading this sentence.', defaultOpen: false },
    ],
  }));

  blocks.push(B('toggle', {
    label: 'The fourth law I didn’t tell you',
    content: '**Constraint breeds interaction.** The reason most “interactive” pages feel dead is that they offer everything — infinite options, infinite paths, infinite noise. The branch points that work offer *three doors, not thirty*. Choice is a gift only when it is finite, legible, and honest about what is behind each door.',
    defaultOn: false,
    labelAlign: 'left',
    contentAlign: 'left',
  }));

  blocks.push(B('spoiler', {
    label: 'Whatever happened to the eight-second reader?',
    content: 'She came back. Two days later the same essay crossed her feed again — this time with a poll at the top asking a question she had an opinion about. She answered it. Then she read the results. Then, because she was already *there*, she read the first section. The poll did not trick her; it introduced her. She now finishes most of what that author writes.',
    revealed: false,
    labelAlign: 'left',
    contentAlign: 'left',
  }));

  blocks.push(B('gallery', {
    title: 'Three scenes from the interactive age',
    layout: 'grid',
    columns: 3,
    images: [
      { id: 'g-attention', src: `${IMG}/attention.jpeg`, alt: 'A reader with a glowing book among floating screens', caption: 'Attention migrates to whatever asks something of it.', title: 'The migration' },
      { id: 'g-paths', src: `${IMG}/paths.jpeg`, alt: 'Three glowing paths diverging in a forest of book spines', caption: 'Finite doors, honest labels — the anatomy of a good branch.', title: 'The crossroads' },
      { id: 'g-anatomy', src: `${IMG}/anatomy.jpeg`, alt: 'An open magazine with floating interactive widgets above it', caption: 'Prose stays the stage. The blocks are the lighting crew.', title: 'The anatomy' },
    ],
  }));

  return blocks;
}

export { makeBlocks };

/* ── ACT 4 — THE LAB (proof, not promises) ─────────────────────────── */
export function makeBlocks2() {
  const IMG = '/images/interactive-content-playbook';
  const uid = (p = 'b') => `${p}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  const B = (type, data) => { const now = new Date().toISOString(); return { id: uid(), type, data, createdAt: now, updatedAt: now }; };
  const TXT = (text) => ({ text, marks: { bold: false, italic: false, underline: false, code: false }, align: 'left' });
  const blocks = [];

  blocks.push(B('horizontal-rule', {}));
  blocks.push(B('heading', { text: 'Enough theory. Into the lab.', level: 2, anchorId: 'the-lab' }));

  blocks.push(B('text', TXT(
    "Everything above was argument. Everything below is ==evidence you can touch==. Score a hook, run the simulations, solve the equation, drag the divider. This is the part of the static article where I would normally beg you to trust me."
  )));

  // Code — run mode: The 8-Second Hook Tester (visible code + Run button + output panel)
  blocks.push(B('code', {
    code: `// THE 8-SECOND HOOK TESTER — press Run: three intros face the Three Laws.\nconst laws = {\n  // Law I · Agency — the reader must be able to act.\n  Agency:   { test: /you|your|choose|press|pick|imagine|[?]/i, low: 3, high: 9, tip: 'hand the reader something to DO' },\n  // Law II · Feedback — every action must be answered.\n  Feedback: { test: /because|answer|secret|find out|how to|result/i, low: 2, high: 8, tip: 'promise every click an ANSWER' },\n  // Law III · Play — if it is not fun, it is just a form.\n  Play:     { test: /!|—|never|dead|funeral|worse|[.][.][.]/i, low: 4, high: 8, tip: 'a spark of FUN buys the next eight seconds' },\n};\nconst intros = [\n  'Content marketing is important. This article explains why.',\n  'Your last reader gave you eight seconds. Here is how to keep the next eight.',\n  'She closed the tab at second seven — and you are about to find out why. Ready?',\n];\nconst bar = (n) => '█'.repeat(n) + '░'.repeat(10 - n);\nintros.forEach((intro, i) => {\n  console.log('Intro #' + (i + 1) + ': "' + intro + '"');\n  let total = 0;\n  for (const [law, { test, low, high, tip }] of Object.entries(laws)) {\n    const score = test.test(intro) ? high : low;\n    total += score;\n    console.log('  ' + law.padEnd(9) + bar(score) + ' ' + score + '/10  ' + tip);\n  }\n  const verdict = total >= 22 ? 'HOOK HOLDS — the reader stays' : total >= 14 ? 'WOBBLY — one law is missing' : 'FUNERAL — tab closes at 0:08';\n  console.log('  verdict: ' + verdict + '  (' + total + '/30)');\n  console.log('');\n});\nconsole.log('The rewrite rule: find the lowest bar and raise that law first.');`,
    language: 'javascript',
    theme: 'github-dark',
    showLineNumbers: true,
    mode: 'run',
  }));

  // Code — demo mode (auto-runs, code hidden)
  blocks.push(B('code', {
    code: `// The Attention Simulator — 10,000 readers, two article formats\nfunction simulate(format) {\n  let finished = 0;\n  const completionRate = format === 'static' ? 0.21 : 0.63;\n  for (let i = 0; i < 10000; i++) {\n    if (Math.random() < completionRate) finished++;\n  }\n  return finished;\n}\nconst staticFans = simulate('static');\nconst interactiveFans = simulate('interactive');\nconsole.log('Static article:      ' + staticFans + ' finishers');\nconsole.log('Interactive article: ' + interactiveFans + ' finishers');\nconsole.log('Uplift: ' + (interactiveFans / staticFans).toFixed(1) + 'x more readers reached the end');`,
    language: 'javascript',
    theme: 'github-dark',
    showLineNumbers: false,
    mode: 'demo',
    demoTitle: 'The Attention Simulator — running on page load, just like it will on yours',
  }));

  // Code sandbox — reader-editable
  blocks.push(B('code-sandbox', {
    code: `// Your turn. Change the rates and run it.\nconst yourStaticRate = 0.21;   // what fraction finishes a static post?\nconst yourInteractiveRate = 0.63;\n\nconst readers = 10000;\nconsole.log('Out of ' + readers + ' readers...');\nconsole.log('  static:      ' + Math.round(readers * yourStaticRate) + ' finish');\nconsole.log('  interactive: ' + Math.round(readers * yourInteractiveRate) + ' finish');\nconsole.log('You just recovered ' + Math.round(readers * (yourInteractiveRate - yourStaticRate)) + ' readers.');`,
    language: 'javascript',
    theme: 'github-dark',
    showLineNumbers: true,
    readOnly: false,
  }));

  // Math equation
  blocks.push(B('math-equation', {
    latex: 'E = \\frac{A \\times F}{R}',
    displayMode: true,
    align: 'center',
    caption: 'The Engagement Equation: Agency times Feedback, divided by fRiction. The entire playbook in three letters.',
    captionAlign: 'center',
  }));

  // Stepped equation — why interaction compounds
  blocks.push(B('stepped-equation', {
    highlightChanges: true,
    align: 'center',
    caption: 'Why branches compound: each choice invests the reader in the next one.',
    captionAlign: 'center',
    steps: [
      { id: 'st1', latex: 'R_n = r \\times R_{n-1}', caption: 'Let r be the fraction of readers who continue after each section.' },
      { id: 'st2', latex: 'R_3 = r \\times r \\times r \\times R_0', caption: 'After three sections, retention multiplies out.' },
      { id: 'st3', latex: 'R_3 = r^3 \\times R_0', caption: 'Same thing, compressed. This is where static posts die.' },
      { id: 'st4', latex: 'R_3 = 0.8^3 \\times R_0 = 0.51 \\times R_0', caption: 'Static: r ≈ 0.8 per section. Half your readers are gone by section three.' },
      { id: 'st5', latex: 'R_3 = 0.95^3 \\times R_0 = 0.86 \\times R_0', caption: 'Interactive: a choice made is an investment made — r climbs toward 0.95.' },
    ],
  }));

  // Auto-solve
  blocks.push(B('auto-solve-equation', {
    equation: '3x + 12 = 60',
    align: 'center',
    caption: 'A static post kept 12 readers to the end. Interactive tripled the finishers and added 12 more. Press Run and watch the computer solve for the static audience — step by step, no AI, exact arithmetic.',
    captionAlign: 'center',
  }));

  // Diagram — the reader decision loop
  blocks.push(B('diagram', {
    mode: 'flow',
    title: 'The reader decision loop',
    titleAlign: 'center',
    caption: 'Every eight seconds, every reader re-runs this loop. Interactive blocks live on the green path.',
    captionAlign: 'center',
    source: `graph TD\n  A[Opens article] --> B{Anything to do?}\n  B -->|No| C[Skims]\n  C --> D{In 8 seconds?}\n  D -->|Yes| E[Closes tab]\n  B -->|Yes| F[Acts: votes, chooses, runs]\n  F --> G[Gets feedback]\n  G --> H[Invested]\n  H --> A`,
  }));

  // Before/After — text mode
  blocks.push(B('before-after', {
    mode: 'text',
    beforeUrl: '',
    afterUrl: '',
    beforeLabel: 'The static way',
    afterLabel: 'The interactive way',
    position: 50,
    aspectRatio: '16:9',
    beforeText: "**How to choose a fruit.**\n\nThere are many factors in choosing a fruit. Ripeness matters, as does aroma, weight, and seasonality. Experts recommend considering all of these elements carefully before making a purchase decision.",
    afterText: "**How to choose a fruit.**\n\n*Press it gently.* Yields a little? Ready. Sniff the stem end — ==no aroma, no flavor==. Heavier than it looks? Juicy. Three senses, ten seconds, one perfect fruit.",
    beforeAlign: 'left',
    afterAlign: 'left',
    caption: 'Same information. Drag the divider — which half would your eight-second reader finish?',
    captionAlign: 'center',
  }));

  // Timeline
  blocks.push(B('timeline', {
    title: 'A brief history of the blog post',
    calendarMode: 'gregorian',
    layout: 'alternating',
    align: 'left',
    entries: [
      { id: 'tl1', title: 'The weblog is born', date: '1994-01-01', description: 'Justin Hall begins publishing links and diary entries. The reader\'s job: scroll.' },
      { id: 'tl2', title: 'The comment era', date: '2005-01-01', description: 'Readers get their first input device: the comment box. Interaction begins at the bottom of the page.' },
      { id: 'tl3', title: 'The feed swallows the blog', date: '2012-01-01', description: 'Social cards and infinite feeds compress attention. The eight-second rule is born.' },
      { id: 'tl4', title: 'Widgets fight back', date: '2016-01-01', description: 'Calculators, embeds, and AMP pages prove utility beats verbosity. Readers stay for tools.' },
      { id: 'tl5', title: 'Interactive goes mainstream', date: '2020-01-01', description: 'Quizzes, scrollytelling, and playable explainers win awards — and analytics dashboards.' },
      { id: 'tl6', title: 'The branched era', date: '2026-01-01', description: 'Readers stop consuming the story and start choosing it. You are reading one.', linkLabel: 'This very article', linkUrl: '#choose-your-role' },
    ],
  }));

  // Map
  blocks.push(B('map', {
    provider: 'openstreetmap',
    latitude: 25,
    longitude: 15,
    zoom: 2,
    label: 'Somewhere on this map, a reader is giving a static post eight seconds right now.',
    caption: 'The global reader: every timezone, one behavior. (Offline? The styled fallback card has you covered.)',
    captionAlign: 'center',
  }));

  // Annotated image
  blocks.push(B('annotated-image', {
    imageUrl: `${IMG}/anatomy.jpeg`,
    alt: 'An open magazine on a dark desk with floating interactive widgets above it',
    caption: 'The anatomy of an interactive page — tap the markers.',
    hotspots: [
      { id: 'hs-quiz', x: 25, y: 25, label: 'The hook', description: 'A question in the first screenful buys the next eight seconds. Quizzes and polls are the cheapest agency you can give a reader.' },
      { id: 'hs-branch', x: 52, y: 22, label: 'The branch', description: 'A visible fork: the reader stops consuming the story and starts choosing it. This is the block this article is built around.' },
      { id: 'hs-play', x: 72, y: 16, label: 'The play layer', description: 'Video, audio, sandboxes — anything that responds. Feedback closes the loop that agency opens.' },
      { id: 'hs-chart', x: 75, y: 32, label: 'The proof', description: 'Data the reader can interrogate beats data the reader must trust. Charts earn their place when they answer a question already asked.' },
    ],
  }));

  // Manga panel — text mode
  blocks.push(B('manga-panel', {
    title: 'The Static Post: a tragedy in three panels',
    layout: 'strip',
    readingDirection: 'ltr',
    panels: [
      { id: 'mp1', mode: 'text', textContent: 'PANEL ONE — A static blog post sits in a browser tab, perfectly formatted, utterly unread. Outside the window, eight seconds tick by.', caption: '9:00:00 AM', dialogue: '"I was written with love. Why won\'t anyone stay?"', backgroundColor: '#1c1c22', textColor: '#f5f2ea' },
      { id: 'mp2', mode: 'text', textContent: 'PANEL TWO — Next door, an interactive article glows. A reader clicks, votes, flips a card, chooses a path. Time stops behaving normally.', caption: '9:00:08 AM', dialogue: '"Eight seconds in and they\'re just getting started."', backgroundColor: '#3d1512', textColor: '#ffe9d6' },
      { id: 'mp3', mode: 'text', textContent: 'PANEL THREE — The static post, reborn as a branched article, walks into the light. Same words. New physics.', caption: 'The next day', dialogue: '"Turns out I didn\'t need better sentences. I needed doors."', backgroundColor: '#0f2a26', textColor: '#d9f7ef' },
    ],
  }));

  // Speech bubble
  blocks.push(B('speech-bubble', {
    speaker: 'The Static Post',
    text: 'In my day, readers had attention spans! We didn\'t need buttons and branches and — and — agency! We had *paragraphs*!',
    tone: 'angry',
    align: 'right',
    title: 'Overheard at the content retirement home',
    titleAlign: 'right',
  }));

  // Carousel
  blocks.push(B('carousel', {
    slides: [
      { id: 'sl1', title: 'Format 1 · The Poll', body: 'One question, one click, instant results. The lowest-friction interaction that exists — and still a small contract signed between reader and page.' },
      { id: 'sl2', title: 'Format 2 · The Branch', body: 'The reader picks what happens next. Highest investment of any format, because every other format can live *inside* it.', mediaUrl: `${IMG}/paths.jpeg`, mediaFit: 'cover' },
      { id: 'sl3', title: 'Format 3 · The Sandbox', body: 'Let readers run the numbers themselves. Trust is no longer requested — it is computed, live, by the reader\'s own hand.' },
      { id: 'sl4', title: 'Format 4 · The Flashcard', body: 'Your best ideas, packaged for memory instead of scrolling. Readers don\'t reread articles; they re-flip decks.', mediaUrl: `${IMG}/attention.jpeg`, mediaFit: 'cover' },
    ],
    autoplay: false,
    intervalMs: 6000,
    showIndicators: true,
    showArrows: true,
  }));

  // Card — Pulse CTA
  blocks.push(B('card', {
    title: 'Built with Pulse, obviously',
    body: 'Every block in this article — the branches, the simulator, the stepped equations, all forty of them — is a native Pulse block. No embeds, no iframes-from-elsewhere, no plugins held together with hope.',
    backgroundType: 'gradient',
    backgroundGradient: 'linear-gradient(135deg, #1c1c22 0%, #3d1512 55%, #ff2800 140%)',
    geometricForm: 'hexagon',
    geometricPosition: 'bottom-right',
    geometricOpacity: 0.14,
    titleColor: '#ffffff',
    bodyColor: '#f5f2ea',
    titleAlign: 'left',
    bodyAlign: 'left',
    ctaLabel: 'Open the studio',
    ctaLinkUrl: '/demo',
    ctaAlign: 'left',
    ctaStyle: 'filled',
    ctaBgColor: '#ffffff',
    ctaTextColor: '#1c1c22',
    ctaBorderRadius: 'pill',
    ctaTarget: '_self',
    cardPadding: 'lg',
    cardRadius: 'xl',
    overlayText: 'The engine, itself',
    overlayAlign: 'left',
    overlayFontSize: 'sm',
  }));

  /* ── ACT 5 — BRANCH POINT ② ──────────────────────────────────────── */

  blocks.push(B('horizontal-rule', {}));
  blocks.push(B('heading', { text: 'Second crossroads: pick your first experiment', level: 2, anchorId: 'first-experiment' }));
  blocks.push(B('text', TXT(
    "Theory is over and the lab is closed. Now the playbook forks by ==ambition==. Three doors again — small, medium, and weekend-sized. Behind each: a concrete recipe, not a pep talk."
  )));

  blocks.push(B('branches', {
    prompt: 'How much time will you give your first interactive piece?',
    branches: [
      { id: 'exp-five-min', label: 'Five minutes', description: 'One small win, today.', content: "**The 5-minute poll recipe.**\n\n1. Find the sentence in your current draft that states an opinion.\n2. Turn it into a question your reader already has an answer to.\n3. Put a poll on it — two to five options, no more.\n4. Ship it.\n\nThat's it. You have not written a word more, but your article now *asks* something. Tomorrow, check the votes: every one of them is a reader who stayed past eight seconds." },
      { id: 'exp-weekend', label: 'A weekend', description: 'Branch a tutorial.', content: "**The weekend branch recipe.**\n\n1. Take your best-performing how-to article.\n2. Find the paragraph where you wrote \"if you're a beginner… but if you're advanced…\" — every tutorial has one.\n3. Replace it with a branch point: one door per skill level.\n4. Move the matched advice behind each door.\n\nYou have just done the single highest-leverage edit in interactive content: ==one article that is three articles== — with analytics on which readers picked which life." },
      { id: 'exp-rebuild', label: 'A full rebuild', description: 'Interactive-first, from the outline up.', content: "**The full-rebuild recipe.**\n\n1. Outline as usual — then mark every section with one of the three laws: does this section give *agency*, *feedback*, or *play*?\n2. Any section marked none gets rewritten until it earns one.\n3. Put the first branch point before the halfway line; the second near the end.\n4. Close with a question the reader answers *about themselves* — a poll, a survey, a quiz.\n\nThis article was built with exactly this recipe. Check the outline: problem → choice → laws → lab → choice → vote → choice. Nothing here is decorative." },
    ],
  }));

  return blocks;
}

/* ── ACT 6 — THE VOTE + MEDIA TOUR + BRANCH ③ + CLOSE ──────────────── */
export function makeBlocks3() {
  const uid = (p = 'b') => `${p}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  const B = (type, data) => { const now = new Date().toISOString(); return { id: uid(), type, data, createdAt: now, updatedAt: now }; };
  const TXT = (text) => ({ text, marks: { bold: false, italic: false, underline: false, code: false }, align: 'left' });
  const blocks = [];

  blocks.push(B('heading', { text: 'Now it’s your turn to answer', level: 2, anchorId: 'the-vote' }));

  blocks.push(B('quiz', {
    question: 'Without scrolling back: how long does the average reader give a static post before deciding its fate?',
    allowMultiple: false,
    randomizeOptions: true,
    showExplanations: true,
    align: 'left',
    successMessage: 'Exactly — and you just proved the point by remembering an interactive number.',
    failureMessage: 'Fair — the number is less important than what you do about it.',
    options: [
      { id: 'q1', text: 'About 30 seconds', isCorrect: false, explanation: 'That was the 2012 number. The feed has compressed attention since then.' },
      { id: 'q2', text: 'About 8 seconds', isCorrect: true, explanation: 'Correct. Eight seconds — the “eight-second funeral” from Act 1. You retained it, which is more than a static page could count on.' },
      { id: 'q3', text: 'A full two minutes', isCorrect: false, explanation: 'Only your mother reads for two minutes. Everyone else votes with their thumb far earlier.' },
      { id: 'q4', text: 'However long the headline is good', isCorrect: false, explanation: 'A great headline buys the click, not the stay. Interaction buys the stay.' },
    ],
  }));

  blocks.push(B('poll', {
    question: 'Which format will you try first?',
    allowMultiple: false,
    align: 'left',
    explanation: 'Every vote here is a reader who made it to the end of a 3,000-word article. That is the entire thesis, demonstrated.',
    options: [
      { id: 'p1', label: 'A poll — the 5-minute win', votes: 0 },
      { id: 'p2', label: 'A branch point in a tutorial', votes: 0 },
      { id: 'p3', label: 'A quiz with real explanations', votes: 0 },
      { id: 'p4', label: 'A code sandbox or simulator', votes: 0 },
      { id: 'p5', label: 'Flashcards of my best ideas', votes: 0 },
    ],
  }));

  blocks.push(B('survey', {
    title: 'Your interactive profile',
    description: 'Three questions. Results feed the next edition of this playbook — and yes, admins can see the aggregate in the studio.',
    questions: [
      { id: 'sv1', prompt: 'Which hat do you wear most?', type: 'single', required: true, options: ['Writer', 'Educator', 'Marketer', 'Developer', 'Chaos generalist'] },
      { id: 'sv2', prompt: 'Which formats have you already shipped?', type: 'multi', required: false, options: ['Polls', 'Quizzes', 'Branches / choose-your-path', 'Calculators / sandboxes', 'None yet — this is day one'] },
      { id: 'sv3', prompt: 'How likely are you to add one interactive block to your next post?', type: 'rating', required: true, scaleMax: 5 },
    ],
  }));

  blocks.push(B('heading', { text: 'The media tour', level: 2, anchorId: 'media-tour' }));
  blocks.push(B('text', TXT(
    "Interaction is not only buttons. It is ==any element that responds== — to a click, a scroll, a choice, a download. Here is the full supporting cast, each doing its one job well."
  )));

  blocks.push(B('audio', {
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Focus Ambient #1',
    artist: 'SoundHelix (demo stream)',
    caption: 'The reading soundtrack — because atmosphere is also a retention tool.',
    captionAlign: 'left',
    autoplay: false,
    loop: false,
  }));

  blocks.push(B('video', {
    url: 'https://www.youtube.com/watch?v=D9Ihs241zeg',
    provider: 'youtube',
    title: 'The Danger of a Single Story — Chimamanda Ngozi Adichie',
    caption: 'Twenty minutes on why one narrative is never enough — the philosophical root of branched content. (Click to load; privacy mode on.)',
    captionAlign: 'left',
    autoplay: false,
    startAtSeconds: 0,
    privacyMode: true,
  }));

  blocks.push(B('embed', {
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX9Rwf3t1xU27',
    title: 'Deep focus, while you draft',
    provider: 'spotify',
    aspectRatio: '16:9',
    allowFullscreen: false,
  }));

  blocks.push(B('file', {
    name: 'The Interactive Content Checklist.pdf',
    url: '/downloads/interactive-content-checklist.pdf',
    sizeBytes: 1899,
    mimeType: 'application/pdf',
    description: 'Ten questions to ask before you hit publish — the whole playbook compressed to one page. Print it. Tape it to the wall.',
    descriptionAlign: 'left',
    openInNewTab: true,
    enablePreview: true,
  }));

  blocks.push(B('link', {
    text: 'Interactive Content Statistics: 95+ Stats & Insights',
    url: 'https://marketingltb.com/blog/statistics/interactive-content/',
    title: 'The source behind every number in this article',
    openInNewTab: true,
    align: 'left',
  }));

  blocks.push(B('list', {
    style: 'numeric',
    align: 'left',
    items: [
      '**Hook early.** One interactive element in the first screenful — a poll, a choice, anything with a pulse.',
      '**Ask questions readers can actually answer.** Opinion beats trivia; self-knowledge beats both.',
      '**Branch at real forks.** If you wrote “it depends,” you found a branch point.',
      '**Close every loop.** Every click deserves feedback: an explanation, a reveal, a result.',
      '**Keep choices finite.** Three doors, not thirty. Labels honest about what’s behind them.',
      '**Ship content in the HTML.** Interactivity as a layer, not a lock — crawlers and no-JS readers get everything.',
      '**Let readers verify.** Sandboxes and demos turn “trust me” into “run it yourself.”',
      '**Package the best parts for memory.** Flashcards > rereading.',
      '**Respect the reduced-motion reader.** Delight must be optional, never mandatory.',
      '**Measure paths, not just pageviews.** Which branch won tells you what to write next.',
    ],
  }));

  /* ── BRANCH POINT ③ ──────────────────────────────────────────────── */

  blocks.push(B('horizontal-rule', {}));
  blocks.push(B('heading', { text: 'Final crossroads: how deep do you go?', level: 2, anchorId: 'last-choice' }));
  blocks.push(B('text', TXT("One last choice, and then the credits. ==Both doors lead to the same ending== — one just takes the scenic route through the machinery.")));

  blocks.push(B('branches', {
    prompt: 'Pick your exit:',
    branches: [
      { id: 'exit-scenic', label: 'The scenic route', description: 'Show me how the machine works.', content: "**Then look down.**\n\nBelow this branch you’ll find the article’s own footnotes — every statistic hyperlinked to its source, because interactive trust is still trust. The in-text superscripts (¹²³) are references you can click both ways: down to the source, back up to the sentence.\n\nUnder the hood, this page is forty block types speaking one language: zod-validated data in, deterministic HTML out, hydration as a thin layer on top. The branches you chose are stored only on *your* device — no account, no cookie banner, no tracking. Interaction without surveillance is possible. This page is the proof." },
      { id: 'exit-direct', label: 'Straight to the outro', description: 'I’ve seen enough — take me home.', content: "**Then you already know the secret.**\n\nThe static post isn’t dying because readers got worse. It’s dying because pages finally learned to listen. Give your next reader one thing to do — just one — and watch what happens to your eight seconds.\n\nScroll on. The last word is yours." },
    ],
  }));

  /* ── CLOSE ───────────────────────────────────────────────────────── */

  blocks.push(B('callout', {
    variant: 'success',
    title: 'TL;DR for the skimmers (we see you)',
    body: 'Static asks readers to give. Interactive asks readers to *do* — and doing is what makes them stay. Start with one poll, branch one tutorial, and measure what your eight seconds become.',
    titleAlign: 'left',
    contentAlign: 'left',
  }));

  blocks.push(B('text', TXT(
    "You came here eight seconds at a time. You voted, flipped, solved, dragged, and chose — three times. Whatever path you took, you didn’t *read* this article. You {color:#ff2800}travelled{/color} it.\n\nThat is the whole playbook. The static page was a monologue; you just spent ten minutes in a dialogue. Your readers are not asking for more of your words. They are asking for a door, a button, a voice.\n\n==Give them one.== Start with the poll. We’ll be counting."
  )));

  return blocks;
}

/* ── DB seeding ────────────────────────────────────────────────────── */
import { BUILTIN_BLOCK_DEFINITIONS, stableBranchesId } from '@pulse/blocks';

async function main() {
  const blocks = [...makeBlocks(), ...makeBlocks2(), ...makeBlocks3()];

  // 1 · Validate every block against its zod schema
  const defs = new Map(BUILTIN_BLOCK_DEFINITIONS.map((d) => [d.type, d]));
  let failures = 0;
  const typeCounts = new Map();
  for (const block of blocks) {
    typeCounts.set(block.type, (typeCounts.get(block.type) || 0) + 1);
    const def = defs.get(block.type);
    if (!def) { console.error(`✗ unknown block type: ${block.type}`); failures++; continue; }
    const result = def.schema.safeParse(block.data);
    if (!result.success) {
      failures++;
      console.error(`✗ ${block.type}: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' | ')}`);
    }
  }
  console.log(`\nBlock coverage (${typeCounts.size} types, ${blocks.length} blocks):`);
  console.log([...typeCounts.entries()].map(([t, n]) => `  ${t}${n > 1 ? ' ×' + n : ''}`).join('\n'));
  const missing = [...defs.keys()].filter((t) => !typeCounts.has(t) && t !== 'reference');
  if (missing.length) console.log('  (not used:', missing.join(', '), ')');
  if (failures > 0) {
    console.error(`\n✗ ${failures} block(s) failed validation — aborting before DB write.`);
    process.exit(1);
  }
  console.log('\n✓ all blocks valid');

  // 2 · Upsert the entry
  const excerpt = 'Readers give you eight seconds. Interactive content gives them a reason to stay. Choose your own path through the playbook — three times.';
  const fieldValues = [
    { fieldId: 'excerpt', value: excerpt },
    { fieldId: 'eyebrow', value: 'The Interactive Content Playbook' },
    { fieldId: 'author', value: 'Pulse Editorial' },
    { fieldId: 'tags', value: ['interactive content', 'content marketing', 'engagement', 'blogging', 'choose your own adventure', 'pulse'] },
    { fieldId: 'featured', value: true },
    { fieldId: 'featuredImage', value: `${IMG}/hero.jpeg` },
    { fieldId: 'featuredImageAlt', value: 'A reader standing at a crossroads of three glowing paths through a forest of book pages' },
  ];
  const metadata = {
    seoTitle: 'The Interactive Content Playbook: Choose Your Own Adventure | Pulse',
    seoDescription: 'Interactive content earns 2–3× more engagement than static posts. Learn the three laws, run the simulators, and choose your own adventure — three branch points inside.',
    seoKeywords: 'interactive content, interactive blog posts, choose your own adventure, branching narrative, content engagement, interactive storytelling, reader engagement',
    ogImage: `${IMG}/hero.jpeg`,
    canonicalUrl: `/blog/${SLUG}`,
  };

  const contentType = await prisma.contentType.findUnique({ where: { slug: 'blog_post' } });
  if (!contentType) throw new Error('content type blog_post not found');
  const existing = await prisma.entry.findFirst({ where: { slug: SLUG, contentTypeId: contentType.id } });
  if (existing) {
    await prisma.entry.delete({ where: { id: existing.id } });
    console.log('↺ replaced existing entry', existing.id);
  }

  const entry = await prisma.entry.create({
    data: {
      contentTypeId: contentType.id,
      title: 'The Interactive Content Playbook: Choose Your Own Adventure',
      slug: SLUG,
      status: 'published',
      publishedAt: new Date(),
      fieldValues: JSON.stringify(fieldValues),
      blocks: JSON.stringify(blocks),
      metadata: JSON.stringify(metadata),
      origin: 'seed',
    },
  });

  console.log('\n✓ PUBLISHED');
  console.log('  entry id:', entry.id);
  console.log('  url:      /blog/' + SLUG);
}

main()
  .catch((err) => { console.error('FAILED:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
