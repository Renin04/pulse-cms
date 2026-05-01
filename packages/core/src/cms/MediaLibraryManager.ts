/**
 * Media Library Manager
 *
 * Manages media assets with folder organization, metadata policies,
 * and search/filter capabilities for CMS media operations.
 */

// Entry type not needed in this module
import { validateMediaAsset, validateMediaFolder } from "./schemas";
import { generateId, now } from "./utils";

// ============================================================================
// Media Types
// ============================================================================

export type MediaType = "image" | "video" | "audio" | "document" | "other";

export interface MediaMetadata {
  alt?: string;
  title?: string;
  caption?: string;
  credit?: string;
  source?: string;
  license?: string;
  licenseUrl?: string;
  description?: string;
  width?: number;
  height?: number;
  duration?: number; // For video/audio in seconds
  fileSize?: number;
  mimeType?: string;
  tags?: string[];
}

export interface MediaAsset {
  id: string;
  name: string;
  filename: string;
  url: string;
  type: MediaType;
  folderId: string | null;
  metadata: MediaMetadata;
  uploaderId: string;
  usageCount: number; // Number of entries using this asset
  usedInEntries: string[]; // Entry IDs referencing this asset
  createdAt: string;
  updatedAt: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  path: string; // Full path like "/images/2024/blog"
  description?: string;
  assetCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  robots?: string;
  structuredData?: Record<string, unknown>;
}

export interface SEOSocialPreview {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

export interface MediaFilter {
  type?: MediaType | MediaType[];
  folderId?: string | null;
  search?: string;
  tags?: string[];
  uploaderId?: string;
  hasAlt?: boolean;
  hasMetadata?: boolean; // Has at least title, alt, or description
  dateFrom?: string;
  dateTo?: string;
}

export interface MediaQuery {
  filter?: MediaFilter;
  sort?: { field: string; direction: "asc" | "desc" };
  pagination?: { page: number; perPage: number };
}

export interface MediaQueryResult {
  assets: MediaAsset[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface MediaLibraryStats {
  totalAssets: number;
  totalFolders: number;
  assetsByType: Record<MediaType, number>;
  assetsMissingAlt: number;
  assetsMissingMetadata: number;
  totalStorageSize: number;
  usageByFolder: Record<string, number>;
}

// ============================================================================
// Media Library Manager
// ============================================================================

export class MediaLibraryManager {
  private assets: Map<string, MediaAsset> = new Map();
  private folders: Map<string, MediaFolder> = new Map();
  private rootFolderId: string;

  constructor() {
    // Create root folder
    const rootFolder: MediaFolder = {
      id: generateId(),
      name: "Root",
      parentId: null,
      path: "/",
      description: "Root media folder",
      assetCount: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    this.folders.set(rootFolder.id, rootFolder);
    this.rootFolderId = rootFolder.id;
  }

  // ============================================================================
  // Asset CRUD
  // ============================================================================

  createAsset(
    data: {
      name: string;
      filename: string;
      url: string;
      type: MediaType;
      folderId?: string | null;
      metadata?: Partial<MediaMetadata>;
      uploaderId: string;
    },
  ): MediaAsset {
    const folderId = data.folderId ?? this.rootFolderId;

    // Validate folder exists
    if (folderId !== null && !this.folders.has(folderId)) {
      throw new Error(`Folder with ID "${folderId}" not found`);
    }

    const asset: MediaAsset = {
      id: generateId(),
      name: data.name,
      filename: data.filename,
      url: data.url,
      type: data.type,
      folderId,
      metadata: {
        alt: data.metadata?.alt,
        title: data.metadata?.title,
        caption: data.metadata?.caption,
        credit: data.metadata?.credit,
        source: data.metadata?.source,
        license: data.metadata?.license,
        licenseUrl: data.metadata?.licenseUrl,
        description: data.metadata?.description,
        width: data.metadata?.width,
        height: data.metadata?.height,
        duration: data.metadata?.duration,
        fileSize: data.metadata?.fileSize,
        mimeType: data.metadata?.mimeType,
        tags: data.metadata?.tags ?? [],
      },
      uploaderId: data.uploaderId,
      usageCount: 0,
      usedInEntries: [],
      createdAt: now(),
      updatedAt: now(),
    };

    const validated = validateMediaAsset(asset);
    this.assets.set(validated.id, validated);

    // Update folder asset count
    this.updateFolderAssetCount(folderId);

    return validated;
  }

  updateAsset(
    id: string,
    updates: Partial<Omit<MediaAsset, "id" | "createdAt" | "updatedAt" | "usageCount" | "usedInEntries">>,
  ): MediaAsset {
    const existing = this.getAsset(id);
    if (!existing) {
      throw new Error(`Asset with ID "${id}" not found`);
    }

    const oldFolderId = existing.folderId;
    const newFolderId = updates.folderId ?? oldFolderId;

    // Validate new folder exists
    if (newFolderId !== null && !this.folders.has(newFolderId)) {
      throw new Error(`Folder with ID "${newFolderId}" not found`);
    }

    const updated: MediaAsset = {
      ...existing,
      ...updates,
      id,
      metadata: { ...existing.metadata, ...updates.metadata },
      updatedAt: now(),
    };

    const validated = validateMediaAsset(updated);
    this.assets.set(id, validated);

    // Update folder counts if folder changed
    if (oldFolderId !== newFolderId) {
      this.updateFolderAssetCount(oldFolderId);
      this.updateFolderAssetCount(newFolderId);
    }

    return validated;
  }

  updateAssetMetadata(id: string, metadata: Partial<MediaMetadata>): MediaAsset {
    return this.updateAsset(id, { metadata });
  }

  deleteAsset(id: string): boolean {
    const asset = this.getAsset(id);
    if (!asset) return false;

    const result = this.assets.delete(id);
    if (result && asset.folderId) {
      this.updateFolderAssetCount(asset.folderId);
    }

    return result;
  }

  getAsset(id: string): MediaAsset | undefined {
    return this.assets.get(id);
  }

  getAssetByFilename(filename: string, folderId?: string): MediaAsset | undefined {
    for (const asset of this.assets.values()) {
      if (asset.filename === filename) {
        if (!folderId || asset.folderId === folderId) {
          return asset;
        }
      }
    }
    return undefined;
  }

  listAssets(): MediaAsset[] {
    return Array.from(this.assets.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  // ============================================================================
  // Folder Management
  // ============================================================================

  createFolder(
    data: {
      name: string;
      parentId?: string | null;
      description?: string;
    },
  ): MediaFolder {
    const parentId = data.parentId ?? this.rootFolderId;

    // Validate parent exists
    const parent = this.folders.get(parentId);
    if (!parent) {
      throw new Error(`Parent folder with ID "${parentId}" not found`);
    }

    // Check for duplicate names in same parent
    for (const folder of this.folders.values()) {
      if (folder.parentId === parentId && folder.name === data.name) {
        throw new Error(`Folder "${data.name}" already exists in this location`);
      }
    }

    const folder: MediaFolder = {
      id: generateId(),
      name: data.name,
      parentId,
      path: parentId === this.rootFolderId ? `/${data.name}` : `${parent.path}/${data.name}`,
      description: data.description,
      assetCount: 0,
      createdAt: now(),
      updatedAt: now(),
    };

    const validated = validateMediaFolder(folder);
    this.folders.set(validated.id, validated);

    return validated;
  }

  updateFolder(id: string, updates: Partial<Pick<MediaFolder, "name" | "description">>): MediaFolder {
    const existing = this.getFolder(id);
    if (!existing) {
      throw new Error(`Folder with ID "${id}" not found`);
    }

    // Prevent renaming root
    if (id === this.rootFolderId && updates.name) {
      throw new Error("Cannot rename root folder");
    }

    // Check for duplicate names
    if (updates.name && updates.name !== existing.name) {
      for (const folder of this.folders.values()) {
        if (folder.parentId === existing.parentId && folder.name === updates.name && folder.id !== id) {
          throw new Error(`Folder "${updates.name}" already exists in this location`);
        }
      }
    }

    const updated: MediaFolder = {
      ...existing,
      ...updates,
      id,
      updatedAt: now(),
    };

    const validated = validateMediaFolder(updated);
    this.folders.set(id, validated);

    return validated;
  }

  deleteFolder(id: string, moveAssetsToParent: boolean = true): boolean {
    // Prevent deleting root
    if (id === this.rootFolderId) {
      throw new Error("Cannot delete root folder");
    }

    const folder = this.folders.get(id);
    if (!folder) return false;

    // Check for subfolders
    for (const f of this.folders.values()) {
      if (f.parentId === id) {
        throw new Error(`Cannot delete folder "${folder.name}" - it contains subfolders. Delete subfolders first.`);
      }
    }

    // Move or delete assets
    const assetsInFolder = this.getAssetsInFolder(id);
    if (assetsInFolder.length > 0) {
      if (moveAssetsToParent && folder.parentId) {
        for (const asset of assetsInFolder) {
          this.updateAsset(asset.id, { folderId: folder.parentId });
        }
      } else {
        throw new Error(`Cannot delete folder "${folder.name}" - it contains assets`);
      }
    }

    return this.folders.delete(id);
  }

  getFolder(id: string): MediaFolder | undefined {
    return this.folders.get(id);
  }

  getRootFolder(): MediaFolder {
    return this.folders.get(this.rootFolderId)!;
  }

  listFolders(): MediaFolder[] {
    return Array.from(this.folders.values()).sort((a, b) => a.path.localeCompare(b.path));
  }

  getSubfolders(parentId: string): MediaFolder[] {
    return this.listFolders().filter((f) => f.parentId === parentId);
  }

  getFolderPath(folderId: string): MediaFolder[] {
    const path: MediaFolder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = this.folders.get(currentId);
      if (!folder) break;
      path.unshift(folder);
      currentId = folder.parentId;
    }

    return path;
  }

  // ============================================================================
  // Search & Filter
  // ============================================================================

  query(query: MediaQuery): MediaQueryResult {
    let assets = this.listAssets();

    // Apply filters
    if (query.filter) {
      assets = this.applyFilters(assets, query.filter);
    }

    // Calculate total
    const total = assets.length;

    // Apply sorting
    if (query.sort) {
      assets = this.sortAssets(assets, query.sort.field, query.sort.direction);
    }

    // Apply pagination
    const page = query.pagination?.page ?? 1;
    const perPage = query.pagination?.perPage ?? 20;
    const start = (page - 1) * perPage;
    const paginatedAssets = assets.slice(start, start + perPage);

    return {
      assets: paginatedAssets,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  search(query: string, type?: MediaType): MediaAsset[] {
    const searchLower = query.toLowerCase();
    return this.listAssets().filter((asset) => {
      const matchesQuery =
        asset.name.toLowerCase().includes(searchLower) ||
        asset.filename.toLowerCase().includes(searchLower) ||
        asset.metadata.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
        asset.metadata.description?.toLowerCase().includes(searchLower);

      if (type && asset.type !== type) return false;

      return matchesQuery;
    });
  }

  getAssetsInFolder(folderId: string | null): MediaAsset[] {
    return this.listAssets().filter((asset) => asset.folderId === folderId);
  }

  getAssetsByType(type: MediaType): MediaAsset[] {
    return this.listAssets().filter((asset) => asset.type === type);
  }

  getAssetsByTag(tag: string): MediaAsset[] {
    return this.listAssets().filter((asset) => asset.metadata.tags?.includes(tag));
  }

  getUnusedAssets(): MediaAsset[] {
    return this.listAssets().filter((asset) => asset.usageCount === 0);
  }

  getAssetsMissingAlt(): MediaAsset[] {
    return this.listAssets().filter(
      (asset) => asset.type === "image" && (!asset.metadata.alt || asset.metadata.alt.trim() === ""),
    );
  }

  getAssetsMissingMetadata(): MediaAsset[] {
    return this.listAssets().filter((asset) => {
      const meta = asset.metadata;
      return !meta.title && !meta.alt && !meta.description;
    });
  }

  // ============================================================================
  // Entry Usage Tracking
  // ============================================================================

  trackAssetUsage(assetId: string, entryId: string): MediaAsset {
    const asset = this.getAsset(assetId);
    if (!asset) {
      throw new Error(`Asset with ID "${assetId}" not found`);
    }

    if (!asset.usedInEntries.includes(entryId)) {
      const updated: MediaAsset = {
        ...asset,
        usedInEntries: [...asset.usedInEntries, entryId],
        usageCount: asset.usageCount + 1,
        updatedAt: now(),
      };
      this.assets.set(assetId, updated);
      return updated;
    }

    return asset;
  }

  untrackAssetUsage(assetId: string, entryId: string): MediaAsset {
    const asset = this.getAsset(assetId);
    if (!asset) {
      throw new Error(`Asset with ID "${assetId}" not found`);
    }

    if (asset.usedInEntries.includes(entryId)) {
      const updated: MediaAsset = {
        ...asset,
        usedInEntries: asset.usedInEntries.filter((id) => id !== entryId),
        usageCount: Math.max(0, asset.usageCount - 1),
        updatedAt: now(),
      };
      this.assets.set(assetId, updated);
      return updated;
    }

    return asset;
  }

  getAssetsUsedInEntry(entryId: string): MediaAsset[] {
    return this.listAssets().filter((asset) => asset.usedInEntries.includes(entryId));
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getStats(): MediaLibraryStats {
    const assets = this.listAssets();
    const folders = this.listFolders();

    const assetsByType: Record<MediaType, number> = {
      image: 0,
      video: 0,
      audio: 0,
      document: 0,
      other: 0,
    };

    let totalStorageSize = 0;
    const usageByFolder: Record<string, number> = {};

    for (const asset of assets) {
      assetsByType[asset.type]++;
      if (asset.metadata.fileSize) {
        totalStorageSize += asset.metadata.fileSize;
      }

      const folderId = asset.folderId ?? "root";
      usageByFolder[folderId] = (usageByFolder[folderId] ?? 0) + 1;
    }

    return {
      totalAssets: assets.length,
      totalFolders: folders.length - 1, // Exclude root
      assetsByType,
      assetsMissingAlt: this.getAssetsMissingAlt().length,
      assetsMissingMetadata: this.getAssetsMissingMetadata().length,
      totalStorageSize,
      usageByFolder,
    };
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  moveAssetsToFolder(assetIds: string[], folderId: string | null): MediaAsset[] {
    // Validate folder exists
    if (folderId !== null && !this.folders.has(folderId)) {
      throw new Error(`Folder with ID "${folderId}" not found`);
    }

    const updated: MediaAsset[] = [];
    for (const id of assetIds) {
      try {
        updated.push(this.updateAsset(id, { folderId }));
      } catch {
        // Skip invalid assets
      }
    }
    return updated;
  }

  deleteAssets(assetIds: string[]): { deleted: string[]; failed: string[] } {
    const deleted: string[] = [];
    const failed: string[] = [];

    for (const id of assetIds) {
      try {
        if (this.deleteAsset(id)) {
          deleted.push(id);
        } else {
          failed.push(id);
        }
      } catch {
        failed.push(id);
      }
    }

    return { deleted, failed };
  }

  addTagsToAssets(assetIds: string[], tags: string[]): MediaAsset[] {
    const updated: MediaAsset[] = [];
    for (const id of assetIds) {
      const asset = this.getAsset(id);
      if (asset) {
        const existingTags = asset.metadata.tags ?? [];
        const newTags = [...new Set([...existingTags, ...tags])];
        updated.push(this.updateAssetMetadata(id, { tags: newTags }));
      }
    }
    return updated;
  }

  removeTagsFromAssets(assetIds: string[], tags: string[]): MediaAsset[] {
    const updated: MediaAsset[] = [];
    for (const id of assetIds) {
      const asset = this.getAsset(id);
      if (asset && asset.metadata.tags) {
        const newTags = asset.metadata.tags.filter((t) => !tags.includes(t));
        updated.push(this.updateAssetMetadata(id, { tags: newTags }));
      }
    }
    return updated;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private updateFolderAssetCount(folderId: string | null): void {
    if (!folderId) return;

    const folder = this.folders.get(folderId);
    if (folder) {
      const count = this.getAssetsInFolder(folderId).length;
      folder.assetCount = count;
      folder.updatedAt = now();
      this.folders.set(folderId, folder);
    }
  }

  private applyFilters(assets: MediaAsset[], filter: MediaFilter): MediaAsset[] {
    return assets.filter((asset) => {
      // Type filter
      if (filter.type) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        if (!types.includes(asset.type)) return false;
      }

      // Folder filter
      if (filter.folderId !== undefined) {
        if (asset.folderId !== filter.folderId) return false;
      }

      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matches =
          asset.name.toLowerCase().includes(searchLower) ||
          asset.filename.toLowerCase().includes(searchLower) ||
          asset.metadata.description?.toLowerCase().includes(searchLower) ||
          asset.metadata.tags?.some((t) => t.toLowerCase().includes(searchLower));
        if (!matches) return false;
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const assetTags = asset.metadata.tags ?? [];
        if (!filter.tags.some((tag) => assetTags.includes(tag))) return false;
      }

      // Uploader filter
      if (filter.uploaderId && asset.uploaderId !== filter.uploaderId) return false;

      // Alt text filter
      if (filter.hasAlt !== undefined && asset.type === "image") {
        const hasAlt = !!asset.metadata.alt && asset.metadata.alt.trim() !== "";
        if (hasAlt !== filter.hasAlt) return false;
      }

      // Metadata filter
      if (filter.hasMetadata !== undefined) {
        const meta = asset.metadata;
        const hasMetadata = !!meta.title || !!meta.alt || !!meta.description;
        if (hasMetadata !== filter.hasMetadata) return false;
      }

      // Date filters
      if (filter.dateFrom && new Date(asset.createdAt) < new Date(filter.dateFrom)) return false;
      if (filter.dateTo && new Date(asset.createdAt) > new Date(filter.dateTo)) return false;

      return true;
    });
  }

  private sortAssets(
    assets: MediaAsset[],
    field: string,
    direction: "asc" | "desc",
  ): MediaAsset[] {
    const sorted = [...assets];

    sorted.sort((a, b) => {
      let valueA: unknown;
      let valueB: unknown;

      switch (field) {
        case "name":
          valueA = a.name;
          valueB = b.name;
          break;
        case "type":
          valueA = a.type;
          valueB = b.type;
          break;
        case "createdAt":
          valueA = a.createdAt;
          valueB = b.createdAt;
          break;
        case "updatedAt":
          valueA = a.updatedAt;
          valueB = b.updatedAt;
          break;
        case "usageCount":
          valueA = a.usageCount;
          valueB = b.usageCount;
          break;
        default:
          return 0;
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        return direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        return direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      return 0;
    });

    return sorted;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createMediaLibraryManager(): MediaLibraryManager {
  return new MediaLibraryManager();
}
