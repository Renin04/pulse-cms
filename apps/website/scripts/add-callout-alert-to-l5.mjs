import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const slug = 'l5-advanced-blocks-qa';

async function main() {
  const entry = await prisma.entry.findFirst({
    where: { slug },
  });
  if (!entry) {
    console.error('Entry not found');
    process.exit(1);
  }

  const blocks = JSON.parse(entry.blocks || '[]');
  blocks.push(
    { id: 'callout-1', type: 'callout', data: { variant: 'info', title: 'Callout', body: 'Highlight important context for readers.', icon: 'i' } },
    { id: 'alert-1', type: 'alert', data: { severity: 'info', title: 'Alert', message: 'Important status update.', dismissible: true, isDismissed: false } }
  );

  await prisma.entry.update({
    where: { id: entry.id },
    data: { blocks: JSON.stringify(blocks) },
  });

  console.log('Added Callout and Alert blocks to', slug);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
