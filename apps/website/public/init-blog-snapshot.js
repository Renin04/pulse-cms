// Initialize blog studio with sample data
(function() {
  const STORAGE_KEY = 'pulse.website.blog-studio';
  
  // Check if already initialized
  if (localStorage.getItem(STORAGE_KEY)) {
    console.log('Blog studio already initialized');
    return;
  }
  
  // Sample snapshot data
  const snapshot = {
    "entries": [
      {
        "slug": "comprehensive-guide-to-modern-web-development",
        "title": "A Comprehensive Guide to Modern Web Development in 2025",
        "status": "published",
        "excerpt": "Explore the latest trends, tools, and best practices shaping web development today. From performance optimization to accessibility, learn what it takes to build exceptional web experiences.",
        "eyebrow": "Featured Guide",
        "author": "Sarah Chen",
        "tags": ["Web Development", "JavaScript", "Performance", "Accessibility", "Best Practices"],
        "featured": true,
        "seoTitle": "Modern Web Development Guide 2025 | Best Practices & Tools",
        "seoDescription": "Complete guide to modern web development covering performance, accessibility, frameworks, and industry best practices. Learn from real-world examples and expert insights.",
        "blocks": [],
        "publishedAt": new Date().toISOString(),
        "scheduledAt": null,
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
      }
    ],
    "timeline": []
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  console.log('✅ Blog studio initialized with sample post');
})();
