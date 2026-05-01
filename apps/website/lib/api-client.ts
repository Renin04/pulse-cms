/**
 * Pulse CMS API Client
 *
 * Unified HTTP client for the Pulse backend.
 * Handles auth tokens, automatic refresh, and typed requests.
 */

const API_BASE = "/api";

let accessToken: string | null = null;
let refreshTokenValue: string | null = null;

function getStoredTokens() {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null };
  return {
    accessToken: accessToken || localStorage.getItem("pulse.accessToken"),
    refreshToken: refreshTokenValue || localStorage.getItem("pulse.refreshToken"),
  };
}

function setStoredTokens(at: string, rt: string) {
  accessToken = at;
  refreshTokenValue = rt;
  if (typeof window !== "undefined") {
    localStorage.setItem("pulse.accessToken", at);
    localStorage.setItem("pulse.refreshToken", rt);
  }
}

function clearStoredTokens() {
  accessToken = null;
  refreshTokenValue = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("pulse.accessToken");
    localStorage.removeItem("pulse.refreshToken");
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken: at } = getStoredTokens();
  // Ensure trailing slash to match next.config.js trailingSlash: true
  const normalizedPath = path.endsWith('/') || path.includes('?') ? path : `${path}/`;
  const url = `${API_BASE}${normalizedPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (at) {
    headers["Authorization"] = `Bearer ${at}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && at) {
    // Try refresh once
    const refreshed = await tryRefresh();
    if (refreshed) {
      const { accessToken: newAt } = getStoredTokens();
      headers["Authorization"] = `Bearer ${newAt}`;
      const retryRes = await fetch(url, { ...options, headers });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({}));
        throw new Error(err.error?.message || `Request failed: ${retryRes.status}`);
      }
      return retryRes.json() as Promise<T>;
    }
    clearStoredTokens();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Request failed: ${res.status}`);
  }

  const data = await res.json();
  return data as T;
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken: rt } = getStoredTokens();
  if (!rt) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.data?.accessToken && data.data?.refreshToken) {
      setStoredTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ============================================================================
// Types
// ============================================================================

export interface ApiUser {
  id: string;
  email: string;
  displayName: string | null;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
}

export interface LoginResponse {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

export interface EntryListItem {
  id: string;
  contentTypeId: string;
  title: string;
  slug: string;
  status: string;
  excerpt?: string;
  eyebrow?: string;
  authorId: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
  featuredImage?: string;
  tags?: string[];
  origin?: string;
}

export interface EntryDetail extends EntryListItem {
  fieldValues: unknown[];
  blocks?: unknown[];
  metadata?: Record<string, unknown>;
  taxonomyIds?: string[];
  parentId?: string | null;
  contentType?: { id: string; name: string; slug: string };
  author?: { id: string; displayName: string | null; email: string } | null;
  taxonomyTerms?: Array<{
    id: string;
    name: string;
    slug: string;
    taxonomyId: string;
    taxonomyName: string;
  }>;
  origin?: string;
}

export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  config: { hierarchical: boolean; allowMultiple: boolean; required: boolean };
  terms: TaxonomyTermItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TaxonomyTermItem {
  id: string;
  taxonomyId: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  parentId?: string | null;
  order: number;
}

export interface SiteSettingItem {
  id: string;
  key: string;
  value: unknown;
  category: string;
  description?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  filename: string;
  url: string;
  type: string;
  folderId: string | null;
  metadata: Record<string, unknown>;
  uploaderId: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  uploader?: { id: string; displayName: string | null; email: string };
}

// ============================================================================
// Auth
// ============================================================================

export const auth = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await request<{ data: LoginResponse }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const { accessToken: at, refreshToken: rt, user } = res.data;
    setStoredTokens(at, rt);
    return { user, accessToken: at, refreshToken: rt };
  },

  logout: async (): Promise<void> => {
    await request("/auth/logout", { method: "POST" });
    clearStoredTokens();
  },

  me: async (): Promise<ApiUser> => {
    const res = await request<{ data: ApiUser }>("/auth/me");
    return res.data;
  },

  refresh: async (): Promise<boolean> => {
    return tryRefresh();
  },

  requestPasswordReset: async (email: string): Promise<{ success: boolean; message: string }> => {
    const res = await request<{ data: { success: boolean; message: string } }>("/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return res.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    const res = await request<{ data: { success: boolean; message: string } }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
    return res.data;
  },

  getToken: () => getStoredTokens().accessToken,
  isAuthenticated: () => !!getStoredTokens().accessToken,
};

// ============================================================================
// Users
// ============================================================================

export const users = {
  list: async (params?: { page?: number; limit?: number; search?: string }): Promise<{ items: ApiUser[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    const res = await request<{ data: { items: ApiUser[]; pagination: any } }>(`/users?${qs.toString()}`);
    return res.data;
  },

  get: async (id: string): Promise<ApiUser> => {
    const res = await request<{ data: ApiUser }>(`/users/${id}`);
    return res.data;
  },

  create: async (data: { email: string; password?: string; displayName?: string; roleIds?: string[] }): Promise<ApiUser> => {
    const res = await request<{ data: ApiUser }>("/users", { method: "POST", body: JSON.stringify(data) });
    return res.data;
  },

  update: async (id: string, data: Partial<{ email: string; password: string; displayName: string; status: string; roleIds: string[] }>): Promise<ApiUser> => {
    const res = await request<{ data: ApiUser }>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/users/${id}`, { method: "DELETE" });
  },

  updateRoles: async (id: string, roleIds: string[]): Promise<void> => {
    await request(`/users/${id}/roles`, { method: "PUT", body: JSON.stringify({ roleIds }) });
  },
};

// ============================================================================
// Entries (CMS)
// ============================================================================

export const entries = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    contentTypeId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ items: EntryDetail[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    if (params?.contentTypeId) qs.set("contentTypeId", params.contentTypeId);
    if (params?.search) qs.set("search", params.search);
    if (params?.sortBy) qs.set("sortBy", params.sortBy);
    if (params?.sortOrder) qs.set("sortOrder", params.sortOrder);
    const res = await request<{ data: any }>(`/cms/entries?${qs.toString()}`);
    return res.data;
  },

  get: async (id: string): Promise<EntryDetail> => {
    const res = await request<{ data: EntryDetail }>(`/cms/entries/${id}`);
    return res.data;
  },

  getBySlug: async (slug: string, contentTypeId?: string): Promise<EntryDetail> => {
    const qs = contentTypeId ? `?contentTypeId=${encodeURIComponent(contentTypeId)}` : "";
    const res = await request<{ data: EntryDetail }>(`/cms/entries/slug/${slug}${qs}`);
    return res.data;
  },

  create: async (data: {
    contentTypeId: string;
    title: string;
    slug?: string;
    status?: string;
    fieldValues?: unknown[];
    blocks?: unknown[];
    taxonomyIds?: string[];
    metadata?: Record<string, unknown>;
    parentId?: string | null;
  }): Promise<EntryDetail> => {
    const res = await request<{ data: EntryDetail }>("/cms/entries", { method: "POST", body: JSON.stringify(data) });
    return res.data;
  },

  update: async (id: string, data: Partial<Omit<EntryDetail, "id" | "createdAt">>): Promise<EntryDetail> => {
    const res = await request<{ data: EntryDetail }>(`/cms/entries/${id}`, { method: "PUT", body: JSON.stringify(data) });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/cms/entries/${id}`, { method: "DELETE" });
  },

  duplicate: async (id: string): Promise<EntryDetail> => {
    const res = await request<{ data: EntryDetail }>(`/cms/entries/${id}/duplicate`, { method: "POST" });
    return res.data;
  },

  bulkAction: async (ids: string[], action: "publish" | "unpublish" | "archive" | "delete"): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> => {
    const res = await request<{ data: any }>("/cms/entries/bulk", {
      method: "POST",
      body: JSON.stringify({ ids, action }),
    });
    return res.data;
  },

  submitReview: async (id: string): Promise<void> => {
    await request(`/cms/entries/${id}/submit-review`, { method: "POST" });
  },

  approve: async (id: string): Promise<void> => {
    await request(`/cms/entries/${id}/approve`, { method: "POST" });
  },

  reject: async (id: string): Promise<void> => {
    await request(`/cms/entries/${id}/reject`, { method: "POST" });
  },

  publish: async (id: string): Promise<void> => {
    await request(`/cms/entries/${id}/publish`, { method: "POST" });
  },

  unpublish: async (id: string): Promise<void> => {
    await request(`/cms/entries/${id}/unpublish`, { method: "POST" });
  },

  schedule: async (id: string, scheduledAt: string): Promise<void> => {
    await request(`/cms/entries/${id}/schedule`, { method: "POST", body: JSON.stringify({ scheduledAt }) });
  },

  archive: async (id: string): Promise<void> => {
    await request(`/cms/entries/${id}/archive`, { method: "POST" });
  },

  listVersions: async (id: string): Promise<Array<{ id: string; version: number; createdAt: string; authorId: string | null }>> => {
    const res = await request<{ data: any }>(`/cms/entries/${id}/versions`);
    return res.data;
  },

  restoreVersion: async (id: string, versionId: string): Promise<EntryDetail> => {
    const res = await request<{ data: EntryDetail }>(`/cms/entries/${id}/versions/${versionId}/restore`, { method: "POST" });
    return res.data;
  },
};

// ============================================================================
// Taxonomies
// ============================================================================

export const taxonomies = {
  list: async (): Promise<TaxonomyItem[]> => {
    const res = await request<{ data: TaxonomyItem[] }>("/taxonomies");
    return res.data;
  },

  get: async (id: string): Promise<TaxonomyItem> => {
    const res = await request<{ data: TaxonomyItem }>(`/taxonomies/${id}`);
    return res.data;
  },

  create: async (data: { name: string; slug: string; type?: string; description?: string; config?: { hierarchical?: boolean; allowMultiple?: boolean; required?: boolean } }): Promise<TaxonomyItem> => {
    const res = await request<{ data: TaxonomyItem }>("/taxonomies", { method: "POST", body: JSON.stringify(data) });
    return res.data;
  },

  update: async (id: string, data: Partial<{ name: string; slug: string; description: string; config: any }>): Promise<TaxonomyItem> => {
    const res = await request<{ data: TaxonomyItem }>(`/taxonomies/${id}`, { method: "PUT", body: JSON.stringify(data) });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/taxonomies/${id}`, { method: "DELETE" });
  },

  listTerms: async (taxonomyId: string): Promise<TaxonomyTermItem[]> => {
    const res = await request<{ data: TaxonomyTermItem[] }>(`/taxonomies/${taxonomyId}/terms`);
    return res.data;
  },

  createTerm: async (taxonomyId: string, data: { name: string; slug?: string; description?: string; parentId?: string | null; color?: string; order?: number }): Promise<TaxonomyTermItem> => {
    const res = await request<{ data: TaxonomyTermItem }>(`/taxonomies/${taxonomyId}/terms`, { method: "POST", body: JSON.stringify(data) });
    return res.data;
  },

  updateTerm: async (taxonomyId: string, termId: string, data: Partial<{ name: string; slug: string; description: string; parentId: string | null; color: string; order: number }>): Promise<TaxonomyTermItem> => {
    const res = await request<{ data: TaxonomyTermItem }>(`/taxonomies/${taxonomyId}/terms/${termId}`, { method: "PUT", body: JSON.stringify(data) });
    return res.data;
  },

  deleteTerm: async (taxonomyId: string, termId: string): Promise<void> => {
    await request(`/taxonomies/${taxonomyId}/terms/${termId}`, { method: "DELETE" });
  },
};

// ============================================================================
// Settings
// ============================================================================

export const settings = {
  list: async (category?: string): Promise<SiteSettingItem[]> => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    const res = await request<{ data: SiteSettingItem[] }>(`/settings${qs}`);
    return res.data;
  },

  update: async (settings: Array<{ key: string; value: unknown }>): Promise<void> => {
    await request("/settings", { method: "PUT", body: JSON.stringify({ settings }) });
  },

  getFeaturedTags: async (): Promise<string[]> => {
    const res = await request<{ data: string[] }>("/settings/featured-tags");
    return res.data;
  },

  updateFeaturedTags: async (tags: string[]): Promise<void> => {
    await request("/settings/featured-tags", { method: "PUT", body: JSON.stringify({ tags }) });
  },
};

// ============================================================================
// Public Content Delivery
// ============================================================================

export const content = {
  listEntries: async (params?: {
    page?: number;
    limit?: number;
    contentTypeId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    termSlug?: string;
  }): Promise<{ items: EntryDetail[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.contentTypeId) qs.set("contentTypeId", params.contentTypeId);
    if (params?.search) qs.set("search", params.search);
    if (params?.sortBy) qs.set("sortBy", params.sortBy);
    if (params?.sortOrder) qs.set("sortOrder", params.sortOrder);
    if (params?.termSlug) qs.set("termSlug", params.termSlug);
    const res = await request<{ data: any }>(`/content/entries?${qs.toString()}`);
    return res.data;
  },

  getEntry: async (slug: string): Promise<EntryDetail> => {
    const res = await request<{ data: EntryDetail }>(`/content/entries/${slug}`);
    return res.data;
  },

  search: async (q: string, page?: number, limit?: number): Promise<{ items: EntryDetail[]; pagination: any }> => {
    const qs = new URLSearchParams();
    qs.set("q", q);
    if (page) qs.set("page", String(page));
    if (limit) qs.set("limit", String(limit));
    const res = await request<{ data: any }>(`/content/search?${qs.toString()}`);
    return res.data;
  },

  getRelated: async (slug: string): Promise<EntryDetail[]> => {
    const res = await request<{ data: EntryDetail[] }>(`/content/related/${slug}`);
    return res.data;
  },

  getTaxonomy: async (slug: string): Promise<TaxonomyItem> => {
    const res = await request<{ data: TaxonomyItem }>(`/content/taxonomies/${slug}`);
    return res.data;
  },

  preview: async (token: string): Promise<EntryDetail> => {
    const res = await request<{ data: EntryDetail }>(`/content/preview/${token}`);
    return res.data;
  },
};

// ============================================================================
// Media
// ============================================================================

export const media = {
  list: async (params?: { page?: number; limit?: number; type?: string; search?: string }): Promise<{ items: MediaItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.type) qs.set("type", params.type);
    if (params?.search) qs.set("search", params.search);
    const res = await request<{ data: any }>(`/media?${qs.toString()}`);
    return res.data;
  },

  get: async (id: string): Promise<MediaItem> => {
    const res = await request<{ data: MediaItem }>(`/media/${id}`);
    return res.data;
  },

  upload: async (file: File): Promise<{ id: string; name: string; url: string; type: string; size: number; mimeType: string; width?: number; height?: number; createdAt: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const at = auth.getToken();
    const headers: Record<string, string> = {};
    if (at) headers["Authorization"] = `Bearer ${at}`;

    const res = await fetch(`/api/media/upload/`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Upload failed: ${res.status}`);
    }

    const data = await res.json();
    return data.data;
  },

  update: async (id: string, data: { name?: string; metadata?: Record<string, unknown> }): Promise<MediaItem> => {
    const res = await request<{ data: MediaItem }>(`/media/${id}`, { method: "PUT", body: JSON.stringify(data) });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/media/${id}`, { method: "DELETE" });
  },
};
