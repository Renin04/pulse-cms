import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const contentTypeId = 'f5955419-8f50-4c4f-8165-8e3399f33915';
const slug = 'l5-advanced-blocks-qa';

const blocks = [
  { id: 'table-1', type: 'table', data: { columns: ['Feature', 'Status'], rows: [['Table', 'OK']], caption: 'Test table' } },
  { id: 'chart-1', type: 'chart', data: { title: 'Q1 Stats', chartType: 'bar', labels: ['Jan', 'Feb'], datasets: [{ id: 'ds1', label: 'Sales', values: [100, 200] }] } },
  { id: 'map-1', type: 'map', data: { provider: 'openstreetmap', latitude: 35.6892, longitude: 51.389, zoom: 10, label: 'Test map' } },
  { id: 'math-1', type: 'math-equation', data: { latex: 'E = mc^2', displayMode: true } },
  { id: 'diagram-1', type: 'diagram', data: { engine: 'mermaid', source: 'graph TD\n  A --> B', caption: 'Test diagram' } },
  { id: 'manga-1', type: 'manga-panel', data: { title: 'Test Manga', layout: 'two-up', panels: [{ id: 'p1', caption: 'Panel 1' }, { id: 'p2', caption: 'Panel 2' }], readingDirection: 'rtl' } },
  { id: 'speech-1', type: 'speech-bubble', data: { speaker: 'Test', text: 'Hello world', tone: 'neutral', align: 'left' } },
  { id: 'card-1', type: 'card', data: { title: 'Test Card', body: 'Card body text' } },
  { id: 'gallery-1', type: 'gallery', data: { title: 'Test Gallery', layout: 'grid', columns: 2, images: [{ id: 'g1', src: 'https://example.com/1.jpg', alt: 'Image 1' }] } },
  { id: 'carousel-1', type: 'carousel', data: { slides: [{ id: 's1', title: 'Slide 1', body: 'Body 1' }], autoplay: false, intervalMs: 5000, showIndicators: true } },
  { id: 'timeline-1', type: 'timeline', data: { title: 'Test Timeline', entries: [{ id: 't1', title: 'Event 1', date: '2026-01-01T00:00:00.000Z', description: 'Desc' }] } },
  { id: 'comparison-1', type: 'comparison', data: { leftTitle: 'A', rightTitle: 'B', rows: [{ id: 'r1', label: 'Speed', leftValue: 'Fast', rightValue: 'Slow' }] } },
  { id: 'beforeafter-1', type: 'before-after', data: { beforeUrl: 'https://example.com/before.jpg', afterUrl: 'https://example.com/after.jpg', beforeLabel: 'Before', afterLabel: 'After', position: 50 } },
  { id: 'hero-1', type: 'hero-section', data: { title: 'Test Hero', subtitle: 'Hero subtitle', backgroundUrl: 'https://example.com/hero.jpg', ctaLabel: 'Go', ctaUrl: 'https://example.com' } },
  { id: 'annotated-1', type: 'annotated-image', data: { imageUrl: 'https://example.com/annotated.jpg', alt: 'Annotated', hotspots: [{ id: 'h1', x: 50, y: 50, label: 'Spot' }] } },
];

async function main() {
  // Delete existing test entry
  await prisma.entry.deleteMany({ where: { slug, contentTypeId } });

  // Get admin user
  const admin = await prisma.user.findFirst({ where: { email: 'mmshfa@pulse.local' } });
  if (!admin) {
    console.error('Admin user not found');
    process.exit(1);
  }

  const entry = await prisma.entry.create({
    data: {
      contentTypeId,
      title: 'L-5 Advanced Blocks QA Test Post',
      slug,
      status: 'published',
      fieldValues: JSON.stringify({
        excerpt: 'Test post for L-5 advanced blocks QA',
        eyebrow: 'QA Test',
        featured: false,
      }),
      blocks: JSON.stringify(blocks),
      metadata: JSON.stringify({
        seoTitle: 'L-5 Advanced Blocks QA',
        seoDescription: 'Test post for advanced blocks',
      }),
      authorId: admin.id,
      publishedAt: new Date(),
    },
  });

  console.log('Created entry:', entry.id, entry.slug);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
