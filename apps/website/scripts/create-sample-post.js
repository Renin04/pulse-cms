const fs = require('fs');
const path = require('path');

// Helper to create block IDs
function createId(prefix = 'block') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create various block types
function createTextBlock(text, marks = {}) {
  return {
    id: createId('text'),
    type: 'text',
    data: {
      text,
      marks: {
        bold: marks.bold || false,
        italic: marks.italic || false,
        underline: marks.underline || false,
        code: marks.code || false,
      },
      align: marks.align || 'left',
    },
  };
}

function createHeadingBlock(text, level = 2) {
  return {
    id: createId('heading'),
    type: 'heading',
    data: {
      text,
      level,
      anchorId: text.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    },
  };
}

function createCalloutBlock(title, body, variant = 'info') {
  return {
    id: createId('callout'),
    type: 'callout',
    data: {
      variant,
      title,
      body,
      icon: '💡',
    },
  };
}

function createCodeBlock(code, language = 'javascript') {
  return {
    id: createId('code'),
    type: 'code',
    data: {
      code,
      language,
      showLineNumbers: true,
    },
  };
}

function createQuoteBlock(text, author = '') {
  return {
    id: createId('quote'),
    type: 'quote',
    data: {
      text,
      author,
    },
  };
}

function createListBlock(items, ordered = false) {
  return {
    id: createId('list'),
    type: 'list',
    data: {
      items,
      ordered,
    },
  };
}

function createImageBlock(url, alt, caption = '') {
  return {
    id: createId('image'),
    type: 'image',
    data: {
      url,
      alt,
      caption,
    },
  };
}

// Create the sample post
const timestamp = new Date().toISOString();
const samplePost = {
  slug: 'comprehensive-guide-to-modern-web-development',
  title: 'A Comprehensive Guide to Modern Web Development in 2025',
  status: 'published',
  excerpt: 'Explore the latest trends, tools, and best practices shaping web development today. From performance optimization to accessibility, learn what it takes to build exceptional web experiences.',
  eyebrow: 'Featured Guide',
  author: 'Sarah Chen',
  tags: ['Web Development', 'JavaScript', 'Performance', 'Accessibility', 'Best Practices'],
  featured: true,
  seoTitle: 'Modern Web Development Guide 2025 | Best Practices & Tools',
  seoDescription: 'Complete guide to modern web development covering performance, accessibility, frameworks, and industry best practices. Learn from real-world examples and expert insights.',
  blocks: [
    createHeadingBlock('A Comprehensive Guide to Modern Web Development in 2025', 1),
    
    createTextBlock('The web development landscape has evolved dramatically over the past few years. With new frameworks, tools, and best practices emerging constantly, staying current can feel overwhelming. This guide breaks down everything you need to know to build modern, performant, and accessible web applications.'),
    
    createCalloutBlock(
      'What You\'ll Learn',
      'This comprehensive guide covers performance optimization, accessibility standards, modern JavaScript frameworks, and production-ready deployment strategies.',
      'info'
    ),
    
    createHeadingBlock('The Foundation: Core Web Vitals', 2),
    
    createTextBlock('Google\'s Core Web Vitals have become the industry standard for measuring user experience. Understanding and optimizing these metrics is crucial for any modern web application.'),
    
    createListBlock([
      'Largest Contentful Paint (LCP): Measures loading performance',
      'Interaction to Next Paint (INP): Measures interactivity',
      'Cumulative Layout Shift (CLS): Measures visual stability',
    ], false),
    
    createTextBlock('Each metric targets a specific aspect of user experience. Let\'s dive into how to optimize them.'),
    
    createHeadingBlock('Performance Optimization Strategies', 2),
    
    createTextBlock('Performance isn\'t just about speed—it\'s about creating a smooth, responsive experience that keeps users engaged. Here are the key strategies:'),
    
    createHeadingBlock('1. Code Splitting and Lazy Loading', 3),
    
    createTextBlock('Modern bundlers like Webpack and Vite make it easy to split your code into smaller chunks that load on demand.'),
    
    createCodeBlock(`// Dynamic import for route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}`, 'javascript'),
    
    createCalloutBlock(
      'Pro Tip',
      'Combine route-based splitting with component-level lazy loading for maximum impact. Prioritize above-the-fold content and defer everything else.',
      'tip'
    ),
    
    createHeadingBlock('2. Image Optimization', 3),
    
    createTextBlock('Images often account for the majority of page weight. Modern formats like WebP and AVIF offer significant size reductions without quality loss.'),
    
    createCodeBlock(`<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img 
    src="hero.jpg" 
    alt="Hero image"
    loading="lazy"
    width="1200"
    height="600"
  />
</picture>`, 'html'),
    
    createHeadingBlock('Accessibility: Building for Everyone', 2),
    
    createTextBlock('Accessibility isn\'t optional—it\'s a fundamental requirement. WCAG 2.2 provides clear guidelines for creating inclusive web experiences.'),
    
    createQuoteBlock(
      'The power of the Web is in its universality. Access by everyone regardless of disability is an essential aspect.',
      'Tim Berners-Lee, W3C Director'
    ),
    
    createListBlock([
      'Use semantic HTML elements (header, nav, main, article)',
      'Ensure sufficient color contrast (4.5:1 for normal text)',
      'Provide keyboard navigation for all interactive elements',
      'Include descriptive alt text for images',
      'Test with screen readers regularly',
    ], true),
    
    createCalloutBlock(
      'Testing Tools',
      'Use axe DevTools, Lighthouse, and WAVE to catch accessibility issues early. Manual testing with keyboard navigation and screen readers is essential.',
      'success'
    ),
    
    createHeadingBlock('Modern Framework Landscape', 2),
    
    createTextBlock('Choosing the right framework depends on your project requirements, team expertise, and performance goals. Here\'s a quick comparison:'),
    
    createListBlock([
      'React: Largest ecosystem, flexible, component-based',
      'Vue: Progressive framework, gentle learning curve',
      'Svelte: Compile-time framework, minimal runtime',
      'Next.js: React with SSR, SSG, and routing built-in',
      'Astro: Content-focused, islands architecture',
    ], false),
    
    createTextBlock('Each framework has its strengths. React dominates the job market, Vue offers simplicity, Svelte provides performance, and Next.js excels at full-stack applications.'),
    
    createHeadingBlock('SEO Best Practices', 2),
    
    createTextBlock('Search engine optimization remains critical for discoverability. Modern SEO goes beyond keywords to encompass technical performance, structured data, and user experience.'),
    
    createCodeBlock(`// Example: JSON-LD structured data for articles
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Modern Web Development Guide",
  "author": {
    "@type": "Person",
    "name": "Sarah Chen"
  },
  "datePublished": "2025-04-16",
  "image": "https://example.com/hero.jpg",
  "publisher": {
    "@type": "Organization",
    "name": "Pulse",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  }
}`, 'json'),
    
    createCalloutBlock(
      'Important',
      'Core Web Vitals are now ranking factors. Fast, stable, interactive pages rank higher in search results.',
      'warning'
    ),
    
    createHeadingBlock('Deployment and DevOps', 2),
    
    createTextBlock('Modern deployment workflows emphasize automation, monitoring, and rapid iteration. CI/CD pipelines ensure code quality and enable confident releases.'),
    
    createListBlock([
      'Use GitHub Actions or GitLab CI for automated testing',
      'Deploy to edge networks (Vercel, Netlify, Cloudflare)',
      'Implement feature flags for gradual rollouts',
      'Monitor with tools like Sentry and LogRocket',
      'Set up performance budgets and alerts',
    ], true),
    
    createHeadingBlock('Security Considerations', 2),
    
    createTextBlock('Security should be baked into every layer of your application. Common vulnerabilities like XSS, CSRF, and injection attacks can be prevented with proper practices.'),
    
    createCodeBlock(`// Content Security Policy header
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://trusted-cdn.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.example.com;`, 'http'),
    
    createCalloutBlock(
      'Security Checklist',
      'Always sanitize user input, use HTTPS everywhere, implement CSP headers, keep dependencies updated, and conduct regular security audits.',
      'warning'
    ),
    
    createHeadingBlock('The Future of Web Development', 2),
    
    createTextBlock('Looking ahead, several trends are shaping the future of web development:'),
    
    createListBlock([
      'WebAssembly enabling near-native performance',
      'Progressive Web Apps blurring the line with native apps',
      'AI-assisted development tools and code generation',
      'Edge computing bringing logic closer to users',
      'Web3 and decentralized applications',
    ], false),
    
    createQuoteBlock(
      'The best way to predict the future is to invent it.',
      'Alan Kay'
    ),
    
    createHeadingBlock('Conclusion', 2),
    
    createTextBlock('Modern web development is complex, but the tools and practices available today make it possible to build exceptional experiences. Focus on performance, accessibility, and user experience, and you\'ll create applications that stand the test of time.'),
    
    createTextBlock('Remember: the web is for everyone. Build with that principle in mind, and you\'ll create something truly valuable.'),
    
    createCalloutBlock(
      'Next Steps',
      'Start by auditing your current projects with Lighthouse. Identify quick wins in performance and accessibility, then gradually adopt modern best practices.',
      'success'
    ),
  ],
  publishedAt: timestamp,
  scheduledAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};

// Load existing snapshot or create new one
const snapshotKey = 'pulse-blog-studio-snapshot';
let snapshot;

try {
  // Try to read from a mock localStorage file
  const snapshotPath = path.join(__dirname, '../.blog-snapshot.json');
  if (fs.existsSync(snapshotPath)) {
    snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  } else {
    snapshot = { entries: [], timeline: [] };
  }
} catch (err) {
  snapshot = { entries: [], timeline: [] };
}

// Add the sample post
snapshot.entries.unshift(samplePost);

// Add timeline event
snapshot.timeline.unshift({
  id: createId('timeline'),
  entrySlug: samplePost.slug,
  type: 'created',
  message: 'Created comprehensive sample post with various block types',
  at: timestamp,
  actorId: 'system',
});

// Save snapshot
const snapshotPath = path.join(__dirname, '../.blog-snapshot.json');
fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

console.log('✅ Sample post created successfully!');
console.log('📝 Title:', samplePost.title);
console.log('🔗 Slug:', samplePost.slug);
console.log('📊 Blocks:', samplePost.blocks.length);
console.log('🏷️  Tags:', samplePost.tags.join(', '));
console.log('\nSnapshot saved to:', snapshotPath);
console.log('\nTo use this post, the blog studio needs to load from this snapshot file.');
