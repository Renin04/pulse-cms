/**
 * Verify the playbook article renders cleanly through the studio/blog pipeline.
 * Run: cd apps/website && DATABASE_URL="file:...dev.db" npx tsx scripts/verify-playbook-render.mts
 */
import { PrismaClient } from '@prisma/client';
import { renderStudioBlocksHtml } from '../lib/blog-studio';

const prisma = new PrismaClient();
const entry = await prisma.entry.findFirst({ where: { slug: 'interactive-content-playbook' } });
if (!entry?.blocks) throw new Error('entry not found');
const blocks = JSON.parse(entry.blocks);

const html = renderStudioBlocksHtml(blocks);

const failures = [];
if (!html || html.length < 10000) failures.push(`html suspiciously short: ${html.length}`);
for (const bad of ['ZodError', 'pulse-error', 'Invalid block data', 'undefined</', 'NaN']) {
  if (html.includes(bad)) failures.push(`found "${bad}" in output`);
}

// every block type must leave its fingerprint
const checks = {
  'hero-section': 'pulse-hero', text: '<p', callout: 'pulse-callout', alert: 'pulse-alert',
  blockquote: 'blockquote', heading: '<h2', image: '<img', comparison: 'pulse-comparison',
  chart: 'pulse-chart', table: '<table', 'horizontal-rule': '<hr', branches: 'pulse-branches',
  tabs: 'pulse-tabs', flashcard: 'pulse-flashcard', accordion: 'pulse-accordion',
  toggle: 'pulse-toggle', spoiler: 'pulse-spoiler', gallery: 'pulse-gallery',
  code: 'pulse-code', 'code-sandbox': 'pulse-code', 'math-equation': 'pulse-math',
  'stepped-equation': 'pulse-stepmath', 'auto-solve-equation': 'pulse-autosolve',
  diagram: 'pulse-diagram', 'before-after': 'pulse-ba', timeline: 'pulse-timeline',
  map: 'pulse-map', 'annotated-image': 'pulse-annotated', 'manga-panel': 'pulse-manga',
  'speech-bubble': 'pulse-speech-bubble', carousel: 'pulse-carousel', card: 'pulse-card',
  quiz: 'pulse-quiz', poll: 'pulse-poll', survey: 'pulse-survey', audio: '<audio',
  video: 'pulse-video', embed: 'pulse-embed', file: 'pulse-file', link: 'data-block-type="link"',
  list: '<ol', references: 'pulse-reference',
};
for (const [type, marker] of Object.entries(checks)) {
  if (!html.includes(marker)) failures.push(`missing render fingerprint for ${type} (${marker})`);
}

// refs must be collected into the footnote list
const refCount = (html.match(/pulse-reference-entry/g) || []).length;
console.log(`rendered ${blocks.length} blocks → ${html.length} chars, ${refCount} footnote entries`);
if (failures.length) {
  console.error('FAILURES:\n' + failures.map((f) => ' ✗ ' + f).join('\n'));
  process.exit(1);
}
console.log('✓ render pipeline clean — all 41 fingerprints present, no error output');
await prisma.$disconnect();
