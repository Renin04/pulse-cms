import { getSiteUrl } from './site';

export interface BlogPostStructuredDataArgs {
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string | Date | null;
  updatedAt: string | Date | null;
  tags: string[];
  eyebrow?: string | null;
  wordCount?: number | null;
  featuredImage?: string | null;
  slug: string;
}

export function generateBlogPostStructuredData(args: BlogPostStructuredDataArgs) {
  const siteUrl = getSiteUrl();

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: args.title,
    description: args.excerpt,
    url: `${siteUrl}/blog/${args.slug}`,
    author: {
      '@type': 'Person',
      name: args.author,
    },
    datePublished: args.publishedAt ? new Date(args.publishedAt).toISOString() : undefined,
    dateModified: args.updatedAt ? new Date(args.updatedAt).toISOString() : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Pulse',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/brand/pulse-mark.png`,
        width: 1712,
        height: 1647,
      },
    },
    keywords: args.tags?.join(', ') || undefined,
    articleSection: args.eyebrow || undefined,
    wordCount: args.wordCount || undefined,
    image: args.featuredImage ? [args.featuredImage] : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${args.slug}`,
    },
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: args.title,
        item: `${siteUrl}/blog/${args.slug}`,
      },
    ],
  };

  return [article, breadcrumbs];
}

export function generateOrganizationStructuredData() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pulse',
    url: siteUrl,
    logo: `${siteUrl}/brand/pulse-mark.png`,
    sameAs: [
      'https://github.com/pulse-studio/pulse',
      'https://twitter.com/pulsestudio',
    ],
  };
}

export function generateWebSiteStructuredData() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pulse',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/blog?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
