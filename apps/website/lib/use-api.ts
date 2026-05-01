"use client";

import { useState, useEffect, useCallback } from "react";
import { auth, entries, taxonomies, settings, content, ApiUser, EntryDetail } from "./api-client";

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error, refetch: () => fetcher().then(setData).catch(setError) };
}

export function useAuth() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auth
      .me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await auth.login(email, password);
      setUser(res.user);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await auth.logout();
    setUser(null);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    const ok = await auth.refresh();
    if (ok) {
      const u = await auth.me().catch(() => null);
      setUser(u);
    }
    return ok;
  }, []);

  return {
    user,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    login,
    logout,
    refresh,
    error,
  };
}

export function useEntries(params?: {
  page?: number;
  limit?: number;
  status?: string;
  contentTypeId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  return useApi(
    () => entries.list(params),
    [params?.page, params?.limit, params?.status, params?.contentTypeId, params?.search, params?.sortBy, params?.sortOrder]
  );
}

export function useEntry(idOrSlug: string | null) {
  return useApi(
    () => (idOrSlug ? entries.get(idOrSlug) : Promise.resolve(null as unknown as EntryDetail)),
    [idOrSlug]
  );
}

export function usePublicEntry(slug: string | null) {
  return useApi(
    () => (slug ? content.getEntry(slug) : Promise.resolve(null as unknown as EntryDetail)),
    [slug]
  );
}

export function usePublicEntries(params?: {
  page?: number;
  limit?: number;
  contentTypeId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  termSlug?: string;
}) {
  return useApi(
    () => content.listEntries(params),
    [params?.page, params?.limit, params?.contentTypeId, params?.search, params?.sortBy, params?.sortOrder, params?.termSlug]
  );
}

export function useTaxonomies() {
  return useApi(() => taxonomies.list(), []);
}

export function useSettings(category?: string) {
  return useApi(() => settings.list(category), [category]);
}

export function useFeaturedTags() {
  const { data, loading, error, refetch } = useApi(() => settings.getFeaturedTags(), []);
  return { tags: data ?? [], loading, error, refetch };
}
