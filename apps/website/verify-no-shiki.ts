import { renderStudioBlocksHtml } from './lib/blog-studio';

// Call WITHOUT initializing Shiki
const html = renderStudioBlocksHtml([
  {
    id: 'test',
    type: 'code',
    data: {
      code: "console.log('✅ hello');",
      language: 'typescript',
      theme: 'github-dark',
      showLineNumbers: true,
      mode: 'demo',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]);

console.log('Has iframe:', html.includes('<iframe'));
console.log('Has data-code:', html.includes('data-code'));
console.log('HTML length:', html.length);
console.log('HTML:', html.slice(0, 500));
