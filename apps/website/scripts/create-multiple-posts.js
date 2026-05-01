const fs = require('fs');
const path = require('path');

function createId(prefix = 'block') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createTextBlock(text) {
  return {
    id: createId('text'),
    type: 'text',
    data: { text, marks: { bold: false, italic: false, underline: false, code: false }, align: 'left' },
  };
}

function createHeadingBlock(text, level = 2) {
  return {
    id: createId('heading'),
    type: 'heading',
    data: { text, level, anchorId: text.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
  };
}

function createCalloutBlock(title, body, variant = 'info') {
  return {
    id: createId('callout'),
    type: 'callout',
    data: { variant, title, body, icon: '💡' },
  };
}

const posts = [
  {
    slug: 'getting-started-with-typescript',
    title: 'Getting Started with TypeScript in 2025',
    status: 'published',
    excerpt: 'Learn the fundamentals of TypeScript and why it\'s become essential for modern web development.',
    eyebrow: 'Tutorial',
    author: 'Alex Morgan',
    tags: ['TypeScript', 'JavaScript', 'Web Development', 'Tutorial'],
    featured: false,
    seoTitle: 'TypeScript Tutorial 2025 | Complete Beginner Guide',
    seoDescription: 'Master TypeScript basics with this comprehensive guide. Learn types, interfaces, and best practices.',
    blocks: [
      createHeadingBlock('Getting Started with TypeScript in 2025', 1),
      createTextBlock('TypeScript has revolutionized how we write JavaScript. This guide will take you from zero to productive in TypeScript.'),
      createHeadingBlock('Why TypeScript?', 2),
      createTextBlock('TypeScript adds static typing to JavaScript, catching errors before runtime and improving developer experience.'),
      createCalloutBlock('Quick Tip', 'Start with strict mode enabled to get the most benefit from TypeScript.', 'tip'),
      createHeadingBlock('Installation', 2),
      createTextBlock('Install TypeScript globally with npm: npm install -g typescript'),
      createHeadingBlock('Your First TypeScript File', 2),
      createTextBlock('Create a file with .ts extension and start writing type-safe code immediately.'),
    ],
  },
  {
    slug: 'react-performance-optimization',
    title: 'React Performance Optimization: Advanced Techniques',
    status: 'published',
    excerpt: 'Discover advanced strategies to make your React applications blazingly fast.',
    eyebrow: 'Deep Dive',
    author: 'Sarah Chen',
    tags: ['React', 'Performance', 'JavaScript', 'Optimization'],
    featured: false,
    seoTitle: 'React Performance Optimization Guide | Advanced Tips',
    seoDescription: 'Learn advanced React performance optimization techniques including memoization, code splitting, and lazy loading.',
    blocks: [
      createHeadingBlock('React Performance Optimization: Advanced Techniques', 1),
      createTextBlock('Performance is crucial for user experience. Let\'s explore advanced techniques to optimize React applications.'),
      createHeadingBlock('Memoization Strategies', 2),
      createTextBlock('Use React.memo, useMemo, and useCallback strategically to prevent unnecessary re-renders.'),
      createCalloutBlock('Warning', 'Don\'t over-optimize! Measure first, then optimize based on actual bottlenecks.', 'warning'),
      createHeadingBlock('Code Splitting', 2),
      createTextBlock('Split your bundle into smaller chunks that load on demand using React.lazy and Suspense.'),
      createHeadingBlock('Virtual Scrolling', 2),
      createTextBlock('For long lists, implement virtual scrolling to render only visible items.'),
    ],
  },
  {
    slug: 'css-grid-mastery',
    title: 'CSS Grid Mastery: Building Complex Layouts',
    status: 'published',
    excerpt: 'Master CSS Grid and create sophisticated layouts with ease.',
    eyebrow: 'Guide',
    author: 'Jordan Lee',
    tags: ['CSS', 'Web Development', 'Design', 'Layout'],
    featured: false,
    seoTitle: 'CSS Grid Tutorial | Master Complex Layouts',
    seoDescription: 'Complete CSS Grid guide with practical examples. Learn to build responsive, complex layouts easily.',
    blocks: [
      createHeadingBlock('CSS Grid Mastery: Building Complex Layouts', 1),
      createTextBlock('CSS Grid is the most powerful layout system in CSS. Let\'s master it together.'),
      createHeadingBlock('Grid Fundamentals', 2),
      createTextBlock('Understanding grid containers, grid items, and the grid track system is essential.'),
      createHeadingBlock('Responsive Grids', 2),
      createTextBlock('Use auto-fit, auto-fill, and minmax() to create responsive grids without media queries.'),
      createCalloutBlock('Pro Tip', 'Combine Grid with Flexbox for maximum layout flexibility.', 'success'),
      createHeadingBlock('Real-World Examples', 2),
      createTextBlock('Let\'s build a magazine-style layout, dashboard, and image gallery using Grid.'),
    ],
  },
  {
    slug: 'nodejs-microservices-architecture',
    title: 'Building Microservices with Node.js',
    status: 'published',
    excerpt: 'Learn how to design and implement scalable microservices architecture using Node.js.',
    eyebrow: 'Architecture',
    author: 'Michael Torres',
    tags: ['Node.js', 'Microservices', 'Backend', 'Architecture'],
    featured: false,
    seoTitle: 'Node.js Microservices Architecture Guide',
    seoDescription: 'Build scalable microservices with Node.js. Learn patterns, best practices, and deployment strategies.',
    blocks: [
      createHeadingBlock('Building Microservices with Node.js', 1),
      createTextBlock('Microservices architecture enables scalability and maintainability. Let\'s explore how to implement it with Node.js.'),
      createHeadingBlock('Service Design Principles', 2),
      createTextBlock('Each microservice should have a single responsibility and communicate via well-defined APIs.'),
      createCalloutBlock('Important', 'Start with a monolith and split into microservices only when needed.', 'warning'),
      createHeadingBlock('Communication Patterns', 2),
      createTextBlock('Choose between REST, GraphQL, or message queues based on your use case.'),
      createHeadingBlock('Deployment Strategies', 2),
      createTextBlock('Use Docker and Kubernetes for containerization and orchestration.'),
    ],
  },
  {
    slug: 'web-accessibility-wcag',
    title: 'Web Accessibility: WCAG 2.2 Compliance Guide',
    status: 'published',
    excerpt: 'Make your websites accessible to everyone with this comprehensive WCAG 2.2 guide.',
    eyebrow: 'Best Practices',
    author: 'Emma Wilson',
    tags: ['Accessibility', 'Web Development', 'WCAG', 'Best Practices'],
    featured: false,
    seoTitle: 'WCAG 2.2 Accessibility Guide | Complete Compliance',
    seoDescription: 'Comprehensive guide to web accessibility and WCAG 2.2 compliance. Learn to build inclusive websites.',
    blocks: [
      createHeadingBlock('Web Accessibility: WCAG 2.2 Compliance Guide', 1),
      createTextBlock('Accessibility is not optional. Learn how to make your websites usable by everyone.'),
      createHeadingBlock('WCAG Principles', 2),
      createTextBlock('Perceivable, Operable, Understandable, and Robust - the four pillars of accessibility.'),
      createHeadingBlock('Keyboard Navigation', 2),
      createTextBlock('Ensure all interactive elements are keyboard accessible with visible focus indicators.'),
      createCalloutBlock('Testing', 'Use screen readers and keyboard-only navigation to test your site.', 'info'),
      createHeadingBlock('Color Contrast', 2),
      createTextBlock('Maintain at least 4.5:1 contrast ratio for normal text and 3:1 for large text.'),
    ],
  },
];

const timestamp = new Date().toISOString();
const snapshotPath = path.join(__dirname, '../.blog-snapshot.json');
let snapshot = { entries: [], timeline: [] };

if (fs.existsSync(snapshotPath)) {
  snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
}

posts.forEach(post => {
  post.publishedAt = timestamp;
  post.scheduledAt = null;
  post.createdAt = timestamp;
  post.updatedAt = timestamp;
  
  snapshot.entries.push(post);
  snapshot.timeline.push({
    id: createId('timeline'),
    entrySlug: post.slug,
    type: 'created',
    message: `Created post: ${post.title}`,
    at: timestamp,
    actorId: 'system',
  });
});

fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
fs.writeFileSync(path.join(__dirname, '../public/.blog-snapshot.json'), JSON.stringify(snapshot, null, 2));

console.log(`✅ Added ${posts.length} new posts!`);
console.log(`📊 Total posts: ${snapshot.entries.length}`);
posts.forEach(post => {
  console.log(`  - ${post.title} (${post.tags.join(', ')})`);
});
