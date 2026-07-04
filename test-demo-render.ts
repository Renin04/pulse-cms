import { renderStudioBlocksHtml } from './apps/website/lib/blog-studio'
import { setCodeBlockHighlighter } from './packages/blocks/src/CodeBlock'

// Mock highlighter
setCodeBlockHighlighter({
  codeToHtml(code, _options) {
    return `<pre><code>${code}</code></pre>`
  }
})

const blocks = [
  {
    id: 'test-code-1',
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

const html = renderStudioBlocksHtml(blocks as any)
console.log('HTML contains iframe:', html.includes('<iframe'))
console.log('HTML contains data-mode="demo":', html.includes('data-mode="demo"'))
console.log('HTML length:', html.length)
console.log('---')
console.log(html)
