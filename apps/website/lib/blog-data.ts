import { prisma } from './db';
import { adaptEntryDetail, type AdaptedBlogEntry } from './entry-adapter';

export async function getPublishedBlogEntries(): Promise<AdaptedBlogEntry[]> {
  try {
    const entries = await prisma.entry.findMany({
      where: { status: 'published' },
      include: {
        contentType: true,
        author: { select: { id: true, displayName: true, email: true } },
        taxonomyLinks: {
          include: {
            term: { include: { taxonomy: true } },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    return entries
      .map((entry) => {
        const serialized = {
          ...entry,
          fieldValues: entry.fieldValues ? JSON.parse(entry.fieldValues) : null,
          blocks: entry.blocks ? JSON.parse(entry.blocks) : null,
          metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
          taxonomyTerms: entry.taxonomyLinks?.map((link: any) => ({
            id: link.term.id,
            name: link.term.name,
            slug: link.term.slug,
            taxonomyId: link.term.taxonomyId,
            taxonomyName: link.term.taxonomy.name,
          })) ?? [],
        };
        return adaptEntryDetail(serialized as any);
      })
      .filter((e): e is AdaptedBlogEntry => e !== null);
  } catch {
    return [];
  }
}

export async function getFeaturedTags(): Promise<string[]> {
  try {
    const setting = await prisma.siteSetting.findFirst({
      where: { key: 'featured-tags' },
    });
    if (!setting?.value) return [];
    const parsed = JSON.parse(setting.value);
    return Array.isArray(parsed) ? parsed.filter((t: unknown): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}
