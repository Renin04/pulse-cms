# Blog Card Styling Logic

## Current Implementation

All blog post cards currently use the **same uniform style** on the blog listing page. This is intentional for consistency and simplicity.

## How Card Styling Works

### Location
`app/blog/page.tsx` - Lines ~254-310

### Current Style Features
- Gradient background (white to neutral-50)
- Large letter initial in header
- Eyebrow category label
- Tags display
- Author avatar
- Hover animation with lift and shadow

## Customization Options

If you want different styles for different posts, you can add a `cardStyle` field to your blog post metadata:

### Option 1: Add to Post Metadata
```typescript
// In blog studio, add a field:
cardStyle: 'default' | 'featured' | 'minimal' | 'bold'
```

### Option 2: Style Based on Tags
```typescript
// Automatically style based on tags
const getCardStyle = (tags: string[]) => {
  if (tags.includes('Tutorial')) return 'tutorial-style';
  if (tags.includes('News')) return 'news-style';
  return 'default-style';
};
```

### Option 3: Style Based on Post Type
```typescript
// Use eyebrow field to determine style
const getCardStyle = (eyebrow: string) => {
  switch(eyebrow) {
    case 'Featured Guide': return 'featured-style';
    case 'Quick Tip': return 'minimal-style';
    default: return 'default-style';
  }
};
```

## Recommended Approach

For now, **keep all cards uniform** for visual consistency. As your blog grows, you can:

1. Add a `cardStyle` field to the blog studio
2. Create 3-4 predefined card styles
3. Let authors choose the style when creating posts
4. Or automatically assign styles based on categories/tags

## Example: Adding Custom Styles

```tsx
// In app/blog/page.tsx
const getCardClassName = (post: BlogStudioEntry) => {
  const baseClass = "group relative flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300";
  
  // Customize based on post properties
  if (post.featured) {
    return `${baseClass} border-[var(--pulse-red)] bg-gradient-to-br from-[var(--pulse-red)]/5 to-white`;
  }
  
  if (post.tags.includes('Tutorial')) {
    return `${baseClass} border-[var(--pulse-jasmine)] bg-gradient-to-br from-[var(--pulse-jasmine)]/5 to-white`;
  }
  
  return `${baseClass} border-[var(--neutral-200)] bg-gradient-to-br from-white to-[var(--neutral-50)]`;
};
```

## Current Decision

**All cards use the same style** to maintain visual harmony and professional appearance. This can be changed later based on content strategy needs.
