import { MetadataRoute } from 'next';
import { prisma } from '../lib/db';
import { getSiteUrl } from '../lib/site';

export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/features`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/demo`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/docs`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/examples`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/studio`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Published blog posts
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const entries = await prisma.entry.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    blogRoutes = entries.map((entry) => ({
      url: `${baseUrl}/blog/${entry.slug}`,
      lastModified: entry.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // Prisma not available during static build — skip blog routes
  }

  return [...staticRoutes, ...blogRoutes];
}
