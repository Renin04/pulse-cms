const { z } = require('zod');

const entrySchema = z.object({
  id: z.string().min(1),
  contentTypeId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  status: z.enum(['draft', 'review', 'scheduled', 'published', 'archived']),
  fieldValues: z.array(z.object({ fieldId: z.string().min(1), value: z.unknown() })),
  blocks: z.array(z.custom()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const testBlock = {
  id: 'block-abc123',
  type: 'code',
  data: {
    code: "console.log('hello')",
    language: 'javascript',
    theme: 'github-dark',
    showLineNumbers: true,
    mode: 'demo',
    hideChrome: true,
    demoTitle: 'Live Demo',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const testEntry = {
  id: 'entry-1',
  contentTypeId: 'blog',
  title: 'Test',
  slug: 'test',
  status: 'draft',
  fieldValues: [],
  blocks: [testBlock],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const validated = entrySchema.parse(testEntry);
console.log('Original mode:', testEntry.blocks[0].data.mode);
console.log('Validated mode:', validated.blocks[0].data.mode);

function cloneBlocks(blocks) {
  return JSON.parse(JSON.stringify(blocks));
}

const existing = { ...testEntry };
const updates = { blocks: cloneBlocks([testBlock]) };
const updated = { ...existing, ...updates, id: existing.id };
const validated2 = entrySchema.parse(updated);
console.log('After update mode:', validated2.blocks[0].data.mode);
