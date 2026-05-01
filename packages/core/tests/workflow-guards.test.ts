/**
 * Workflow Guards Tests
 *
 * Tests for SEO validation and media accessibility workflow guards.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { WorkflowEngine, createWorkflowEngine } from "../src/cms/WorkflowEngine";
import type { Entry } from "../src/cms";
import type { Block } from "../src/types/block"; 

// Helper to create a test entry
function createTestEntry(overrides?: Partial<Entry>): Entry {
  return {
    id: "entry-1",
    contentTypeId: "type-1",
    title: "Test Entry Title",
    slug: "test-entry",
    status: "draft",
    fieldValues: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create an image block
function createImageBlock(alt?: string): Block {
  return {
    id: "block-1",
    type: "image",
    data: {
      url: "https://example.com/image.jpg",
      alt: alt ?? "",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("Workflow Guards", () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = createWorkflowEngine();
  });

  // ============================================================================
  // SEO Gap Analysis
  // ============================================================================

  describe("checkSEOGaps", () => {
    it("should detect missing SEO title", () => {
      const entry = createTestEntry({ title: "", metadata: {} });
      const result = engine.checkSEOGaps(entry);

      expect(result.hasTitle).toBe(false);
      expect(result.issues).toContain("Missing SEO title");
      expect(result.score).toBeLessThan(100);
    });

    it("should use entry title as fallback for SEO title", () => {
      const entry = createTestEntry({ title: "My Blog Post", metadata: {} });
      const result = engine.checkSEOGaps(entry);

      expect(result.hasTitle).toBe(true);
      expect(result.titleLength).toBe(12);
    });

    it("should detect short SEO title", () => {
      const entry = createTestEntry({
        title: "Hi",
        metadata: { seoTitle: "Hi" },
      });
      const result = engine.checkSEOGaps(entry);

      expect(result.titleLength).toBe(2);
      expect(result.issues).toContain("SEO title is too short (recommended: 30-60 characters)");
    });

    it("should detect long SEO title", () => {
      const longTitle = "A".repeat(70);
      const entry = createTestEntry({
        metadata: { seoTitle: longTitle },
      });
      const result = engine.checkSEOGaps(entry);

      expect(result.titleLength).toBe(70);
      expect(result.issues).toContain("SEO title is too long (recommended: 30-60 characters)");
    });

    it("should detect missing SEO description", () => {
      const entry = createTestEntry({ metadata: {} });
      const result = engine.checkSEOGaps(entry);

      expect(result.hasDescription).toBe(false);
      expect(result.issues).toContain("Missing SEO description");
    });

    it("should detect short SEO description", () => {
      const entry = createTestEntry({
        metadata: { seoDescription: "Short" },
      });
      const result = engine.checkSEOGaps(entry);

      expect(result.descriptionLength).toBe(5);
      expect(result.issues).toContain("SEO description is too short (recommended: 50-160 characters)");
    });

    it("should detect long SEO description", () => {
      const longDesc = "A".repeat(200);
      const entry = createTestEntry({
        metadata: { seoDescription: longDesc },
      });
      const result = engine.checkSEOGaps(entry);

      expect(result.descriptionLength).toBe(200);
      expect(result.issues).toContain("SEO description is too long (recommended: 50-160 characters)");
    });

    it("should detect short slug", () => {
      const entry = createTestEntry({ slug: "ab" });
      const result = engine.checkSEOGaps(entry);

      expect(result.issues).toContain("Slug is too short or missing");
    });

    it("should return perfect score for optimized entry", () => {
      const entry = createTestEntry({
        title: "My Perfectly Optimized Blog Post Title",
        slug: "my-perfectly-optimized-blog-post-title",
        metadata: {
          seoTitle: "My Perfectly Optimized Blog Post Title",
          seoDescription: "This is a well-written description that falls within the ideal character count range for SEO purposes.",
        },
      });
      const result = engine.checkSEOGaps(entry);

      expect(result.hasTitle).toBe(true);
      expect(result.hasDescription).toBe(true);
      expect(result.titleLength).toBeGreaterThanOrEqual(30);
      expect(result.titleLength).toBeLessThanOrEqual(60);
      expect(result.descriptionLength).toBeGreaterThanOrEqual(50);
      expect(result.descriptionLength).toBeLessThanOrEqual(160);
      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
    });
  });

  // ============================================================================
  // SEO Minimum Validation
  // ============================================================================

  describe("validateSEOMinimum", () => {
    it("should fail validation for missing title", () => {
      const entry = createTestEntry({ title: "", metadata: {} });
      const result = engine.validateSEOMinimum(entry);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("SEO title is required for publishing");
    });

    it("should fail validation for missing description", () => {
      const entry = createTestEntry({ metadata: {} });
      const result = engine.validateSEOMinimum(entry);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("SEO description is required for publishing");
    });

    it("should pass validation with complete SEO", () => {
      const entry = createTestEntry({
        metadata: {
          seoTitle: "Complete SEO Title That Is Long Enough",
          seoDescription: "A complete SEO description that is long enough to meet requirements.",
        },
      });
      const result = engine.validateSEOMinimum(entry);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ============================================================================
  // Media Accessibility
  // ============================================================================

  describe("checkMediaAccessibility", () => {
    it("should detect images without alt text", () => {
      const blocks = [createImageBlock(), createImageBlock("Has alt")];
      const result = engine.checkMediaAccessibility(blocks);

      expect(result.imagesTotal).toBe(2);
      expect(result.imagesWithoutAlt).toBe(1);
      expect(result.hasAccessibilityIssues).toBe(true);
      expect(result.issues).toContain("1 image(s) missing alt text");
    });

    it("should pass when all images have alt", () => {
      const blocks = [createImageBlock("Alt 1"), createImageBlock("Alt 2")];
      const result = engine.checkMediaAccessibility(blocks);

      expect(result.imagesWithoutAlt).toBe(0);
      expect(result.hasAccessibilityIssues).toBe(false);
      expect(result.issues).toHaveLength(0);
    });

    it("should handle empty blocks", () => {
      const result = engine.checkMediaAccessibility([]);

      expect(result.imagesTotal).toBe(0);
      expect(result.hasAccessibilityIssues).toBe(false);
    });

    it("should handle undefined blocks", () => {
      const result = engine.checkMediaAccessibility(undefined);

      expect(result.imagesTotal).toBe(0);
      expect(result.hasAccessibilityIssues).toBe(false);
    });

    it("should only check image blocks", () => {
      const blocks = [
        createImageBlock(),
        { id: "b2", type: "paragraph", data: { text: "Hello" } },
        { id: "b3", type: "heading", data: { level: 1, text: "Title" } },
      ];
      const result = engine.checkMediaAccessibility(blocks);

      expect(result.imagesTotal).toBe(1);
    });
  });

  // ============================================================================
  // Full Pre-Publish Validation
  // ============================================================================

  describe("validateForPublish", () => {
    it("should block publish for missing SEO", () => {
      const entry = createTestEntry({ metadata: {} });
      const result = engine.validateForPublish(entry);

      expect(result.canPublish).toBe(false);
      expect(result.seo.valid).toBe(false);
      expect(result.allErrors.length).toBeGreaterThan(0);
    });

    it("should block publish for missing alt text", () => {
      const entry = createTestEntry({
        metadata: {
          seoTitle: "Complete Title",
          seoDescription: "A complete SEO description that meets all requirements.",
        },
        blocks: [createImageBlock()],
      });
      const result = engine.validateForPublish(entry);

      expect(result.canPublish).toBe(false);
      expect(result.media.valid).toBe(false);
      expect(result.media.imagesWithoutAlt).toBe(1);
    });

    it("should allow publish with complete SEO and accessibility", () => {
      const entry = createTestEntry({
        slug: "my-blog-post",
        metadata: {
          seoTitle: "My Complete Blog Post Title For SEO",
          seoDescription: "A complete SEO description that meets all requirements for publishing.",
        },
        blocks: [createImageBlock("Descriptive alt text")],
      });
      const result = engine.validateForPublish(entry);

      expect(result.canPublish).toBe(true);
      expect(result.seo.valid).toBe(true);
      expect(result.media.valid).toBe(true);
      expect(result.allErrors).toHaveLength(0);
    });

    it("should include all errors in response", () => {
      const entry = createTestEntry({
        title: "",
        metadata: {},
        blocks: [createImageBlock()],
      });
      const result = engine.validateForPublish(entry);

      expect(result.allErrors.length).toBeGreaterThanOrEqual(3); // missing title, missing desc, missing alt
    });

    it("should include SEO score in response", () => {
      const entry = createTestEntry({
        metadata: {
          seoTitle: "Complete Title",
          seoDescription: "A complete SEO description that meets all requirements.",
        },
      });
      const result = engine.validateForPublish(entry);

      expect(result.seo.score).toBeGreaterThanOrEqual(0);
      expect(result.seo.score).toBeLessThanOrEqual(100);
    });
  });
});
