import { BlogStudioWorkspace, renderStudioBlocksHtml } from './apps/website/lib/blog-studio'
import { DocumentState } from './packages/core/src/state/DocumentState'
import { setCodeBlockHighlighter } from './packages/blocks/src/CodeBlock'

// Mock highlighter
setCodeBlockHighlighter({
  codeToHtml(code, options) {
    return `<pre><code>${code}</code></pre>`
  }
})

// Initial blocks with a code block in demo mode
const initialBlocks = [
  {
    id: 'block-heading-1',
    type: 'heading',
    data: { text: 'Test Post', level: 1, anchorId: 'test-post' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'block-code-1',
    type: 'code',
    data: {
      code: 'console.log("hello")',
      language: 'javascript',
      theme: 'github-dark',
      showLineNumbers: true,
      mode: 'demo',
      hideChrome: true,
      demoTitle: 'Live Demo',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]

// Step 1: Create initial workspace
const workspace = new BlogStudioWorkspace({
  entries: [{
    id: 'entry-1',
    slug: 'test-post',
    title: 'Test Post',
    status: 'draft' as any,
    excerpt: 'Test excerpt',
    eyebrow: 'Test',
    author: 'Test Author',
    tags: [],
    featured: false,
    blocks: initialBlocks as any,
    publishedAt: null,
    scheduledAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }],
  timeline: []
})

// Step 2: Get entry and verify preview HTML
const entryBefore = workspace.getEntry('test-post')
console.log('Before save:')
console.log('  blocks[1].data.mode:', (entryBefore.blocks[1] as any).data.mode)
console.log('  html contains iframe:', entryBefore.html.includes('<iframe'))

// Step 3: Simulate editor state adapter
const docState = new DocumentState({
  id: 'test-post',
  blocks: entryBefore.blocks as any
})

const editorBlocks = docState.getSnapshot().blocks
console.log('  editorBlocks[1].data.mode:', (editorBlocks[1] as any).data.mode)

// Step 4: Simulate save - update workspace with editorBlocks
const updatedEntry = workspace.updateEntry('test-post', {
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'Test excerpt',
  eyebrow: 'Test',
  author: 'Test Author',
  tags: [],
  featured: false,
  blocks: editorBlocks as any,
})
console.log('After updateEntry:')
console.log('  updated.blocks[1].data.mode:', (updatedEntry.blocks[1] as any).data.mode)
console.log('  updated.html contains iframe:', updatedEntry.html.includes('<iframe'))

// Step 5: Get new snapshot
const nextSnapshot = workspace.toSnapshot()
console.log('Snapshot:')
console.log('  entries[0].blocks[1].data.mode:', (nextSnapshot.entries[0].blocks[1] as any).data.mode)

// Step 6: Create new workspace from snapshot (simulating React re-render)
const newWorkspace = new BlogStudioWorkspace(nextSnapshot)
const entryAfter = newWorkspace.getEntry('test-post')
console.log('After reconstructing workspace:')
console.log('  blocks[1].data.mode:', (entryAfter.blocks[1] as any).data.mode)
console.log('  html contains iframe:', entryAfter.html.includes('<iframe'))

// Step 7: Create new adapter from reconstructed entry (simulating useEffect)
const newDocState = new DocumentState({
  id: 'test-post',
  blocks: entryAfter.blocks as any
})
const newEditorBlocks = newDocState.getSnapshot().blocks
console.log('New adapter blocks:')
console.log('  newEditorBlocks[1].data.mode:', (newEditorBlocks[1] as any).data.mode)

// Step 8: Render preview HTML from new editor blocks
const previewHtml = renderStudioBlocksHtml(newEditorBlocks as any)
console.log('Preview HTML from new editor blocks:')
console.log('  contains iframe:', previewHtml.includes('<iframe'))
console.log('  contains data-mode="demo":', previewHtml.includes('data-mode="demo"'))
