/**
 * Content Admin Manager
 *
 * Admin UI support for content listing, filtering, sorting, bulk operations,
 * and content management views. Provides data shaping for admin interfaces.
 */

import type { Entry, EntryStatus, EntryQuery } from "./types";
import type { EntryManager } from "./EntryManager";
import type { ContentTypeRegistry } from "./ContentTypeRegistry";

export interface ContentListColumn {
  id: string;
  label: string;
  field: string;
  sortable?: boolean;
  width?: string;
  formatter?: (value: unknown, entry: Entry) => string;
}

export interface ContentListView {
  id: string;
  label: string;
  columns: ContentListColumn[];
  defaultSort?: { field: string; direction: "asc" | "desc" };
  filters?: ContentListFilterConfig[];
}

export interface ContentListFilterConfig {
  id: string;
  field: string;
  label: string;
  type: "text" | "select" | "multiselect" | "date" | "dateRange" | "status" | "taxonomy";
  options?: Array<{ value: string; label: string }>;
  taxonomyId?: string;
}

export interface BulkOperation {
  id: string;
  label: string;
  icon?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  handler: (entryIds: string[]) => Promise<void>;
}

export interface ContentListItem {
  id: string;
  title: string;
  slug: string;
  status: EntryStatus;
  contentTypeId: string;
  contentTypeLabel: string;
  authorId?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  scheduledAt?: string | null;
  metadata?: {
    seoScore?: number;
    hasAltText?: boolean;
    wordCount?: number;
  };
  actions: ContentAction[];
}

export interface ContentAction {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface ContentFilterState {
  search?: string;
  status?: EntryStatus | EntryStatus[];
  contentTypeId?: string;
  authorId?: string;
  dateFrom?: string;
  dateTo?: string;
  taxonomyFilters?: Array<{ taxonomyId: string; termIds: string[] }>;
  [key: string]: unknown;
}

export interface ContentSortState {
  field: string;
  direction: "asc" | "desc";
}

export interface BulkActionResult {
  success: string[];
  failed: Array<{ id: string; error: string }>;
}

export class ContentAdminManager {
  private entryManager: EntryManager;
  private contentTypeRegistry: ContentTypeRegistry;
  private views: Map<string, ContentListView> = new Map();
  private bulkOperations: Map<string, BulkOperation> = new Map();

  constructor(config: {
    entryManager: EntryManager;
    contentTypeRegistry: ContentTypeRegistry;
  }) {
    this.entryManager = config.entryManager;
    this.contentTypeRegistry = config.contentTypeRegistry;
    this.registerDefaultViews();
    this.registerDefaultBulkOperations();
  }

  // ============================================================================
  // Default Views
  // ============================================================================

  private registerDefaultViews(): void {
    const defaultView: ContentListView = {
      id: "default",
      label: "All Content",
      columns: [
        { id: "title", field: "title", label: "Title", sortable: true, width: "30%" },
        { id: "status", field: "status", label: "Status", sortable: true, width: "10%" },
        { id: "contentType", field: "contentTypeId", label: "Type", sortable: true, width: "12%" },
        { id: "author", field: "authorId", label: "Author", sortable: false, width: "12%" },
        { id: "updated", field: "updatedAt", label: "Last Modified", sortable: true, width: "15%" },
        { id: "seo", field: "seoScore", label: "SEO", sortable: true, width: "8%" },
      ],
      defaultSort: { field: "updatedAt", direction: "desc" },
      filters: [
        { id: "search", field: "search", label: "Search", type: "text" },
        { id: "status", field: "status", label: "Status", type: "status" },
        { id: "dateRange", field: "updatedAt", label: "Date Range", type: "dateRange" },
      ],
    };

    const publishedView: ContentListView = {
      id: "published",
      label: "Published",
      columns: defaultView.columns,
      defaultSort: { field: "publishedAt", direction: "desc" },
      filters: defaultView.filters,
    };

    const draftView: ContentListView = {
      id: "drafts",
      label: "Drafts",
      columns: defaultView.columns,
      defaultSort: { field: "updatedAt", direction: "desc" },
      filters: defaultView.filters,
    };

    const scheduledView: ContentListView = {
      id: "scheduled",
      label: "Scheduled",
      columns: [
        ...defaultView.columns.slice(0, 2),
        { id: "scheduled", field: "scheduledAt", label: "Scheduled For", sortable: true, width: "15%" },
        ...defaultView.columns.slice(2),
      ],
      defaultSort: { field: "scheduledAt", direction: "asc" },
      filters: defaultView.filters,
    };

    this.views.set("default", defaultView);
    this.views.set("published", publishedView);
    this.views.set("drafts", draftView);
    this.views.set("scheduled", scheduledView);
  }

  // ============================================================================
  // View Management
  // ============================================================================

  registerView(view: ContentListView): void {
    this.views.set(view.id, view);
  }

  getView(viewId: string): ContentListView | undefined {
    return this.views.get(viewId);
  }

  listViews(): ContentListView[] {
    return Array.from(this.views.values());
  }

  unregisterView(viewId: string): boolean {
    return this.views.delete(viewId);
  }

  // ============================================================================
  // Content List Operations
  // ============================================================================

  async getContentList(options: {
    viewId?: string;
    filters?: ContentFilterState;
    sort?: ContentSortState;
    pagination?: { page: number; perPage: number };
  }): Promise<{ items: ContentListItem[]; total: number; page: number; perPage: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean }> {
    const view = options.viewId ? this.getView(options.viewId) : undefined;
    
    // Build query from filters
    const query = this.buildEntryQuery(options.filters, view);
    
    // Apply sorting
    if (options.sort) {
      query.sort = options.sort;
    } else if (view?.defaultSort) {
      query.sort = view.defaultSort;
    }
    
    // Apply pagination
    if (options.pagination) {
      query.pagination = options.pagination;
    }

    const result = this.entryManager.query(query);
    
    // Transform to list items
    const items = result.entries.map((entry) => this.transformToListItem(entry));
    
    return {
      items,
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
    };
  }

  private buildEntryQuery(filters?: ContentFilterState, view?: ContentListView): EntryQuery {
    const query: EntryQuery = {};

    // View-specific status filter
    if (view?.id === "published") {
      query.status = "published";
    } else if (view?.id === "drafts") {
      query.status = "draft";
    } else if (view?.id === "scheduled") {
      query.status = "scheduled";
    }

    if (!filters) return query;

    // Search
    if (filters.search) {
      query.search = filters.search;
    }

    // Status filter (can override view filter)
    if (filters.status) {
      query.status = filters.status;
    }

    // Content type filter
    if (filters.contentTypeId) {
      query.contentTypeId = filters.contentTypeId;
    }

    // Author filter
    if (filters.authorId) {
      query.filters = query.filters || [];
      query.filters.push({ field: "authorId", operator: "eq", value: filters.authorId });
    }

    // Date range filters
    if (filters.dateFrom || filters.dateTo) {
      query.filters = query.filters || [];
      if (filters.dateFrom && filters.dateTo) {
        query.filters.push({
          field: "updatedAt",
          operator: "between",
          value: [filters.dateFrom, filters.dateTo],
        });
      } else if (filters.dateFrom) {
        query.filters.push({ field: "updatedAt", operator: "gte", value: filters.dateFrom });
      } else if (filters.dateTo) {
        query.filters.push({ field: "updatedAt", operator: "lte", value: filters.dateTo });
      }
    }

    // Taxonomy filters
    if (filters.taxonomyFilters && filters.taxonomyFilters.length > 0) {
      query.taxonomyFilters = filters.taxonomyFilters;
    }

    return query;
  }

  private transformToListItem(entry: Entry): ContentListItem {
    const contentType = this.contentTypeRegistry.get(entry.contentTypeId);
    
    return {
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      status: entry.status,
      contentTypeId: entry.contentTypeId,
      contentTypeLabel: contentType?.name ?? entry.contentTypeId,
      authorId: entry.authorId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      publishedAt: entry.publishedAt ?? null,
      scheduledAt: entry.scheduledAt,
      metadata: {
        seoScore: entry.metadata?.seoScore,
        hasAltText: entry.metadata?.hasAltText,
        wordCount: entry.metadata?.wordCount,
      },
      actions: this.generateActions(entry),
    };
  }

  private generateActions(entry: Entry): ContentAction[] {
    const actions: ContentAction[] = [
      { id: "edit", label: "Edit", icon: "edit" },
      { id: "preview", label: "Preview", icon: "eye" },
    ];

    if (entry.status === "draft") {
      actions.push({ id: "publish", label: "Publish", icon: "publish" });
      actions.push({ id: "schedule", label: "Schedule", icon: "calendar" });
    }

    if (entry.status === "published") {
      actions.push({ id: "unpublish", label: "Unpublish", icon: "unpublish" });
    }

    if (entry.status === "scheduled") {
      actions.push({ id: "cancel-schedule", label: "Cancel Schedule", icon: "cancel" });
    }

    actions.push({ id: "duplicate", label: "Duplicate", icon: "copy" });
    actions.push({ id: "delete", label: "Delete", icon: "trash" });

    return actions;
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  private registerDefaultBulkOperations(): void {
    this.bulkOperations.set("publish", {
      id: "publish",
      label: "Publish",
      icon: "publish",
      requiresConfirmation: true,
      confirmationMessage: "Are you sure you want to publish the selected entries?",
      handler: async (entryIds: string[]) => {
        for (const id of entryIds) {
          this.entryManager.publish(id);
        }
      },
    });

    this.bulkOperations.set("unpublish", {
      id: "unpublish",
      label: "Unpublish",
      icon: "unpublish",
      requiresConfirmation: true,
      confirmationMessage: "Are you sure you want to unpublish the selected entries?",
      handler: async (entryIds: string[]) => {
        for (const id of entryIds) {
          this.entryManager.unpublish(id);
        }
      },
    });

    this.bulkOperations.set("archive", {
      id: "archive",
      label: "Archive",
      icon: "archive",
      requiresConfirmation: true,
      confirmationMessage: "Are you sure you want to archive the selected entries?",
      handler: async (entryIds: string[]) => {
        for (const id of entryIds) {
          this.entryManager.archive(id);
        }
      },
    });

    this.bulkOperations.set("delete", {
      id: "delete",
      label: "Delete",
      icon: "trash",
      requiresConfirmation: true,
      confirmationMessage: "Are you sure you want to permanently delete the selected entries? This action cannot be undone.",
      handler: async (entryIds: string[]) => {
        for (const id of entryIds) {
          this.entryManager.delete(id);
        }
      },
    });
  }

  registerBulkOperation(operation: BulkOperation): void {
    this.bulkOperations.set(operation.id, operation);
  }

  getBulkOperation(operationId: string): BulkOperation | undefined {
    return this.bulkOperations.get(operationId);
  }

  listBulkOperations(): BulkOperation[] {
    return Array.from(this.bulkOperations.values());
  }

  async executeBulkOperation(operationId: string, entryIds: string[]): Promise<BulkActionResult> {
    const operation = this.bulkOperations.get(operationId);
    if (!operation) {
      throw new Error(`Bulk operation "${operationId}" not found`);
    }

    const result: BulkActionResult = { success: [], failed: [] };

    for (const id of entryIds) {
      try {
        await operation.handler([id]);
        result.success.push(id);
      } catch (error) {
        result.failed.push({
          id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }

  // ============================================================================
  // Quick Stats
  // ============================================================================

  getContentStats(): {
    total: number;
    byStatus: Record<EntryStatus, number>;
    byContentType: Record<string, number>;
    recentlyUpdated: ContentListItem[];
    pendingReview: number;
    scheduled: number;
  } {
    const allEntries = this.entryManager.list();
    const byStatus: Record<EntryStatus, number> = {
      draft: 0,
      review: 0,
      scheduled: 0,
      published: 0,
      archived: 0,
    };
    const byContentType: Record<string, number> = {};

    for (const entry of allEntries) {
      byStatus[entry.status]++;
      byContentType[entry.contentTypeId] = (byContentType[entry.contentTypeId] || 0) + 1;
    }

    const recentlyUpdated = allEntries
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((e) => this.transformToListItem(e));

    return {
      total: allEntries.length,
      byStatus,
      byContentType,
      recentlyUpdated,
      pendingReview: byStatus.review,
      scheduled: byStatus.scheduled,
    };
  }

  // ============================================================================
  // Dashboard Widgets Data
  // ============================================================================

  getDashboardData(): {
    stats: {
      total: number;
      byStatus: Record<EntryStatus, number>;
      byContentType: Record<string, number>;
      recentlyUpdated: ContentListItem[];
      pendingReview: number;
      scheduled: number;
    };
    upcomingScheduled: ContentListItem[];
    needsAttention: ContentListItem[];
  } {
    const stats = this.getContentStats();
    const allEntries = this.entryManager.list();

    // Upcoming scheduled content
    const upcomingScheduled = allEntries
      .filter((e) => e.status === "scheduled" && e.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
      .slice(0, 5)
      .map((e) => this.transformToListItem(e));

    // Content needing attention (low SEO score, missing metadata)
    const needsAttention = allEntries
      .filter((e) => {
        const seoScore = e.metadata?.seoScore;
        return e.status === "draft" && (seoScore === undefined || seoScore < 50);
      })
      .slice(0, 5)
      .map((e) => this.transformToListItem(e));

    return {
      stats,
      upcomingScheduled,
      needsAttention,
    };
  }
}

export default ContentAdminManager;
