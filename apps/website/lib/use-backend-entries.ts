"use client";

import { useMemo } from "react";
import { usePublicEntries, usePublicEntry, useFeaturedTags } from "./use-api";
import { adaptEntryList, adaptEntryDetail, type AdaptedBlogEntry } from "./entry-adapter";

export function useBackendBlogEntries(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  termSlug?: string;
}) {
  const { data, loading, error, refetch } = usePublicEntries(params);
  const adapted = useMemo(() => {
    if (!data?.items) return [];
    return adaptEntryList(data.items);
  }, [data]);

  return {
    entries: adapted,
    pagination: data?.pagination,
    loading,
    error,
    refetch,
  };
}

export function useBackendBlogEntry(slug: string | null) {
  const { data, loading, error, refetch } = usePublicEntry(slug);
  const adapted = useMemo(() => {
    return adaptEntryDetail(data);
  }, [data]);

  return {
    entry: adapted,
    loading,
    error,
    refetch,
  };
}

export function useBackendFeaturedTags() {
  return useFeaturedTags();
}

export function useAllBackendTags(entries: AdaptedBlogEntry[]) {
  return useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [entries]);
}
