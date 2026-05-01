/**
 * Content Admin Manager Tests
 *
 * Tests for content list/manage UI functionality including:
 * - View management
 * - Content list operations with filters/sorting
 * - Bulk operations
 * - Dashboard data
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  ContentAdminManager,
  ContentTypeRegistry,
  EntryManager,
} from "../src/cms";
import type { ContentListView } from "../src/cms/ContentAdminManager";

describe("ContentAdminManager", () => {
  let contentTypeRegistry: ContentTypeRegistry;
  let entryManager: EntryManager;
  let adminManager: ContentAdminManager;

  beforeEach(() => {
    contentTypeRegistry = ContentTypeRegistry.getInstance();
    ContentTypeRegistry.resetInstance();

    // Register test content types
    contentTypeRegistry.register({
      id: "article",
      name: "Article",
      slug: "article",
      description: "Blog articles",
      fields: [
        { id: "title", type: "text", config: { label: "Title" } },
        { id: "excerpt", type: "text", config: { label: "Excerpt" } },
      ],
    });

    contentTypeRegistry.register({
      id: "page",
      name: "Page",
      slug: "page",
      description: "Static pages",
      fields: [
        { id: "title", type: "text", config: { label: "Title" } },
      ],
    });

    entryManager = new EntryManager({ contentTypeRegistry });
    adminManager = new ContentAdminManager({
      entryManager,
      contentTypeRegistry,
    });
  });

  describe("View Management", () => {
    it("should register default views", () => {
      const views = adminManager.listViews();
      expect(views).toHaveLength(4);
      
      const viewIds = views.map((v) => v.id);
      expect(viewIds).toContain("default");
      expect(viewIds).toContain("published");
      expect(viewIds).toContain("drafts");
      expect(viewIds).toContain("scheduled");
    });

    it("should get a specific view", () => {
      const view = adminManager.getView("default");
      expect(view).toBeDefined();
      expect(view?.label).toBe("All Content");
      expect(view?.columns).toHaveLength(6);
    });

    it("should register custom views", () => {
      const customView: ContentListView = {
        id: "custom",
        label: "Custom View",
        columns: [
          { id: "title", field: "title", label: "Title", sortable: true },
        ],
        defaultSort: { field: "title", direction: "asc" },
      };

      adminManager.registerView(customView);
      
      const retrieved = adminManager.getView("custom");
      expect(retrieved).toEqual(customView);
    });

    it("should unregister views", () => {
      expect(adminManager.unregisterView("default")).toBe(true);
      expect(adminManager.getView("default")).toBeUndefined();
    });
  });

  describe("Content List Operations", () => {
    beforeEach(() => {
      // Create test entries
      entryManager.create("article", {
        title: "Published Article",
        status: "published",
        authorId: "author1",
        metadata: { seoScore: 85, seoTitle: "Published Article" },
      });

      entryManager.create("article", {
        title: "Draft Article",
        status: "draft",
        authorId: "author1",
        metadata: { seoScore: 45, seoTitle: "Draft Article" },
      });

      entryManager.create("page", {
        title: "About Page",
        status: "published",
        authorId: "author2",
        metadata: { seoScore: 90, seoTitle: "About Page" },
      });
    });

    it("should get content list with default sorting", async () => {
      const result = await adminManager.getContentList({});
      
      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("should filter by status", async () => {
      const result = await adminManager.getContentList({
        filters: { status: "published" },
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.every((item) => item.status === "published")).toBe(true);
    });

    it("should filter by content type", async () => {
      const result = await adminManager.getContentList({
        filters: { contentTypeId: "article" },
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.every((item) => item.contentTypeId === "article")).toBe(true);
    });

    it("should filter by search term", async () => {
      const result = await adminManager.getContentList({
        filters: { search: "Draft" },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("Draft Article");
    });

    it("should apply custom sorting", async () => {
      const result = await adminManager.getContentList({
        sort: { field: "title", direction: "asc" },
      });

      expect(result.items[0].title).toBe("About Page");
      expect(result.items[1].title).toBe("Draft Article");
      expect(result.items[2].title).toBe("Published Article");
    });

    it("should apply pagination", async () => {
      const result = await adminManager.getContentList({
        pagination: { page: 1, perPage: 2 },
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(false);
    });

    it("should use view-specific filters", async () => {
      const result = await adminManager.getContentList({
        viewId: "drafts",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe("draft");
    });

    it("should transform entries to list items correctly", async () => {
      const result = await adminManager.getContentList({});
      const item = result.items[0];

      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("slug");
      expect(item).toHaveProperty("status");
      expect(item).toHaveProperty("contentTypeLabel");
      expect(item).toHaveProperty("actions");
      expect(item.actions.length).toBeGreaterThan(0);
    });
  });

  describe("Bulk Operations", () => {
    let entryIds: string[];

    beforeEach(() => {
      entryIds = [
        entryManager.create("article", { title: "Article 1", status: "draft" }).id,
        entryManager.create("article", { title: "Article 2", status: "draft" }).id,
        entryManager.create("article", { title: "Article 3", status: "draft" }).id,
      ];
    });

    it("should list default bulk operations", () => {
      const operations = adminManager.listBulkOperations();
      
      expect(operations.length).toBeGreaterThan(0);
      
      const operationIds = operations.map((op) => op.id);
      expect(operationIds).toContain("publish");
      expect(operationIds).toContain("unpublish");
      expect(operationIds).toContain("archive");
      expect(operationIds).toContain("delete");
    });

    it("should execute bulk publish", async () => {
      const result = await adminManager.executeBulkOperation("publish", entryIds);

      expect(result.success).toHaveLength(3);
      expect(result.failed).toHaveLength(0);

      // Verify entries were published
      for (const id of entryIds) {
        const entry = entryManager.get(id);
        expect(entry?.status).toBe("published");
      }
    });

    it("should execute bulk delete", async () => {
      const result = await adminManager.executeBulkOperation("delete", entryIds);

      expect(result.success).toHaveLength(3);
      expect(result.failed).toHaveLength(0);

      // Verify entries were deleted
      expect(entryManager.count()).toBe(0);
    });

    it("should register custom bulk operations", async () => {
      let executed = false;
      
      adminManager.registerBulkOperation({
        id: "custom-op",
        label: "Custom Operation",
        handler: async (ids: string[]) => {
          executed = true;
          expect(ids).toEqual(entryIds);
        },
      });

      await adminManager.executeBulkOperation("custom-op", entryIds);
      expect(executed).toBe(true);
    });

    it("should handle bulk operation errors", async () => {
      adminManager.registerBulkOperation({
        id: "failing-op",
        label: "Failing Operation",
        handler: async (ids: string[]) => {
          void ids; // Mark as intentionally used
          throw new Error("Operation failed");
        },
      });

      const result = await adminManager.executeBulkOperation("failing-op", entryIds);

      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(3);
      expect(result.failed[0].error).toBe("Operation failed");
    });

    it("should throw for unknown bulk operations", async () => {
      await expect(
        adminManager.executeBulkOperation("unknown", entryIds)
      ).rejects.toThrow('Bulk operation "unknown" not found');
    });
  });

  describe("Content Stats", () => {
    beforeEach(() => {
      entryManager.create("article", { title: "Published 1", status: "published" });
      entryManager.create("article", { title: "Published 2", status: "published" });
      entryManager.create("article", { title: "Draft 1", status: "draft" });
      entryManager.create("article", { title: "Draft 2", status: "draft" });
      entryManager.create("page", { title: "Page 1", status: "published" });
      entryManager.create("article", { title: "Review", status: "review" });
      const scheduledEntry = entryManager.create("article", { title: "Scheduled", status: "scheduled" });
      entryManager.update(scheduledEntry.id, { scheduledAt: "2025-01-01T00:00:00Z" });
    });

    it("should return content statistics", () => {
      const stats = adminManager.getContentStats();

      expect(stats.total).toBe(7);
      expect(stats.byStatus.published).toBe(3);
      expect(stats.byStatus.draft).toBe(2);
      expect(stats.byStatus.review).toBe(1);
      expect(stats.byStatus.scheduled).toBe(1);
      expect(stats.pendingReview).toBe(1);
      expect(stats.scheduled).toBe(1);
    });

    it("should return stats by content type", () => {
      const stats = adminManager.getContentStats();

      expect(stats.byContentType.article).toBe(6);
      expect(stats.byContentType.page).toBe(1);
    });

    it("should return recently updated entries", () => {
      const stats = adminManager.getContentStats();

      expect(stats.recentlyUpdated).toHaveLength(5);
      // Should be sorted by updatedAt desc
      const dates = stats.recentlyUpdated.map((e) => new Date(e.updatedAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });
  });

  describe("Dashboard Data", () => {
    beforeEach(() => {
      const s1 = entryManager.create("article", { 
        title: "Scheduled 1", 
        status: "scheduled",
        metadata: { seoScore: 80, seoTitle: "Scheduled 1" },
      });
      entryManager.update(s1.id, { scheduledAt: "2025-06-01T00:00:00Z" });
      
      const s2 = entryManager.create("article", { 
        title: "Scheduled 2", 
        status: "scheduled",
        metadata: { seoScore: 70, seoTitle: "Scheduled 2" },
      });
      entryManager.update(s2.id, { scheduledAt: "2025-03-01T00:00:00Z" });
      
      entryManager.create("article", { 
        title: "Low SEO Draft", 
        status: "draft",
        metadata: { seoScore: 30, seoTitle: "Low SEO Draft" },
      });
    });

    it("should return dashboard data", () => {
      const dashboard = adminManager.getDashboardData();

      expect(dashboard.stats).toBeDefined();
      expect(dashboard.upcomingScheduled).toBeDefined();
      expect(dashboard.needsAttention).toBeDefined();
    });

    it("should return upcoming scheduled content sorted by date", () => {
      const dashboard = adminManager.getDashboardData();

      expect(dashboard.upcomingScheduled).toHaveLength(2);
      // Should be sorted by scheduledAt asc (earliest first)
      expect(dashboard.upcomingScheduled[0].title).toBe("Scheduled 2");
      expect(dashboard.upcomingScheduled[1].title).toBe("Scheduled 1");
    });

    it("should return content needing attention", () => {
      const dashboard = adminManager.getDashboardData();

      expect(dashboard.needsAttention.length).toBeGreaterThan(0);
      expect(dashboard.needsAttention[0].title).toBe("Low SEO Draft");
    });
  });
});
