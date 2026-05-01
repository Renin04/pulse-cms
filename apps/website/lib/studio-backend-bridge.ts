"use client";

import { useEffect, useState } from "react";
import { entries } from "./api-client";
import type { EntryDetail } from "./api-client";
import type { Block, BlockData } from "@pulse/core";
import {
  createDefaultBlogStudioSnapshot,
  type BlogStudioSnapshot,
  type BlogStudioEntrySnapshot,
  type StudioBlock,
} from "./blog-studio";

function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getFieldValue(fieldValues: unknown[], fieldId: string): unknown {
  if (!Array.isArray(fieldValues)) return undefined;
  const fv = fieldValues.find((item: any) => item?.fieldId === fieldId);
  return (fv as any)?.value;
}

function entryDetailToSnapshotEntry(entry: EntryDetail): BlogStudioEntrySnapshot {
  const fieldValues = Array.isArray(entry.fieldValues) ? entry.fieldValues : [];
  const metadata = typeof entry.metadata === 'object' && entry.metadata !== null && !Array.isArray(entry.metadata)
    ? (entry.metadata as Record<string, unknown>)
    : parseJsonField<Record<string, unknown>>(typeof entry.metadata === 'string' ? entry.metadata : JSON.stringify(entry.metadata ?? {}), {});
  const blocks = Array.isArray(entry.blocks)
    ? (entry.blocks as Block<BlockData>[])
    : parseJsonField<Block<BlockData>[]>(typeof entry.blocks === 'string' ? entry.blocks : JSON.stringify(entry.blocks ?? []), []);

  const excerpt = String(getFieldValue(fieldValues, "excerpt") || "");
  const eyebrow = String(getFieldValue(fieldValues, "eyebrow") || "Studio Draft");
  const featured = Boolean(getFieldValue(fieldValues, "featured") ?? false);
  const featuredImage = String(getFieldValue(fieldValues, "featuredImage") || metadata.ogImage || "");
  const featuredImageAlt = String(getFieldValue(fieldValues, "featuredImageAlt") || "");
  const ogImage = String(metadata.ogImage || featuredImage || "");

  // Author from API author object or field value
  const authorName =
    entry.author?.displayName || entry.author?.email || String(getFieldValue(fieldValues, "author") || "Pulse Team");

  // Tags from fieldValues only — kept separate from structured taxonomies
  let tags: string[] = [];
  const tagValue = getFieldValue(fieldValues, "tags");
  if (Array.isArray(tagValue)) {
    tags = tagValue.filter((t): t is string => typeof t === "string");
  }

  const taxonomyIds = entry.taxonomyIds ?? entry.taxonomyTerms?.map((t) => t.id) ?? [];

  const seoTitle = String(metadata.seoTitle || entry.title);
  const seoDescription = String(metadata.seoDescription || excerpt);

  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    status: entry.status as any,
    excerpt,
    eyebrow,
    author: authorName,
    tags,
    taxonomyIds,
    featured,
    featuredImage: featuredImage || undefined,
    featuredImageAlt: featuredImageAlt || undefined,
    ogImage: ogImage || undefined,
    seoTitle,
    seoDescription,
    blocks: blocks as StudioBlock[],
    publishedAt: entry.publishedAt ?? null,
    scheduledAt: entry.scheduledAt ?? null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export async function fetchBackendStudioSnapshot(): Promise<BlogStudioSnapshot> {
  try {
    const result = await entries.list({ limit: 1000 });
    const items = result.items || [];

    if (items.length === 0) {
      return createDefaultBlogStudioSnapshot();
    }

    return {
      entries: items.map(entryDetailToSnapshotEntry),
      timeline: [],
    };
  } catch (err) {
    console.warn("Failed to load studio snapshot from backend:", err);
    return createDefaultBlogStudioSnapshot();
  }
}

export function useBackendStudioSnapshot(): BlogStudioSnapshot | null {
  const [snapshot, setSnapshot] = useState<BlogStudioSnapshot | null>(null);

  useEffect(() => {
    let isActive = true;

    fetchBackendStudioSnapshot().then((nextSnapshot) => {
      if (isActive) {
        setSnapshot(nextSnapshot);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  return snapshot;
}

// Save helpers: sync workspace changes back to backend
export async function syncEntryToBackend(
  snapshotEntry: BlogStudioEntrySnapshot & { taxonomyIds?: string[] }
): Promise<void> {
  const fieldValues = [
    { fieldId: "excerpt", value: snapshotEntry.excerpt },
    { fieldId: "eyebrow", value: snapshotEntry.eyebrow },
    { fieldId: "author", value: snapshotEntry.author },
    { fieldId: "tags", value: snapshotEntry.tags },
    { fieldId: "featured", value: snapshotEntry.featured },
    ...(snapshotEntry.featuredImage ? [{ fieldId: "featuredImage", value: snapshotEntry.featuredImage }] : []),
    ...(snapshotEntry.featuredImageAlt ? [{ fieldId: "featuredImageAlt", value: snapshotEntry.featuredImageAlt }] : []),
  ];

  const metadata = {
    seoTitle: snapshotEntry.seoTitle,
    seoDescription: snapshotEntry.seoDescription,
    ...(snapshotEntry.ogImage ? { ogImage: snapshotEntry.ogImage } : {}),
  };

  const taxonomyIds = (snapshotEntry as any).taxonomyIds ?? [];

  // Use the backend entry ID if we have it; otherwise fall back to slug search
  if (snapshotEntry.id) {
    await entries.update(snapshotEntry.id, {
      title: snapshotEntry.title,
      slug: snapshotEntry.slug,
      status: snapshotEntry.status as any,
      fieldValues,
      blocks: snapshotEntry.blocks as any,
      metadata,
      taxonomyIds: taxonomyIds.length > 0 ? taxonomyIds : undefined,
      publishedAt: snapshotEntry.publishedAt,
      scheduledAt: snapshotEntry.scheduledAt,
    });
    return;
  }

  // Fallback: try to find existing entry by slug
  const existing = await entries.list({ search: snapshotEntry.slug, limit: 1 });
  const existingEntry = existing.items.find((e) => e.slug === snapshotEntry.slug);

  if (existingEntry) {
    await entries.update(existingEntry.id, {
      title: snapshotEntry.title,
      slug: snapshotEntry.slug,
      status: snapshotEntry.status as any,
      fieldValues,
      blocks: snapshotEntry.blocks as any,
      metadata,
      taxonomyIds: taxonomyIds.length > 0 ? taxonomyIds : undefined,
      publishedAt: snapshotEntry.publishedAt,
      scheduledAt: snapshotEntry.scheduledAt,
    });
  } else {
    // Need contentTypeId - assume blog_post
    await entries.create({
      contentTypeId: "blog_post",
      title: snapshotEntry.title,
      slug: snapshotEntry.slug,
      status: snapshotEntry.status as any,
      fieldValues,
      blocks: snapshotEntry.blocks as any,
      metadata,
      taxonomyIds: taxonomyIds.length > 0 ? taxonomyIds : undefined,
    });
  }
}
