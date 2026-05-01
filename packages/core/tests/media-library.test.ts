/**
 * Media Library & SEO Tests
 *
 * Tests for CMS media library operations, folder management,
 * metadata policies, and SEO workflow guards.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  MediaLibraryManager,
  createMediaLibraryManager,
} from "../src/cms/MediaLibraryManager";


describe("Media Library Manager", () => {
  let manager: MediaLibraryManager;

  beforeEach(() => {
    manager = createMediaLibraryManager();
  });

  // ============================================================================
  // Asset CRUD
  // ============================================================================

  describe("Asset CRUD", () => {
    it("should create an asset", () => {
      const asset = manager.createAsset({
        name: "My Image",
        filename: "my-image.jpg",
        url: "https://example.com/my-image.jpg",
        type: "image",
        uploaderId: "user-1",
        metadata: { alt: "My image alt" },
      });

      expect(asset.id).toBeDefined();
      expect(asset.name).toBe("My Image");
      expect(asset.type).toBe("image");
      expect(asset.metadata.alt).toBe("My image alt");
    });

    it("should create asset in specific folder", () => {
      const folder = manager.createFolder({ name: "Images", parentId: null });
      const asset = manager.createAsset({
        name: "My Image",
        filename: "my-image.jpg",
        url: "https://example.com/my-image.jpg",
        type: "image",
        folderId: folder.id,
        uploaderId: "user-1",
      });

      expect(asset.folderId).toBe(folder.id);
    });

    it("should update asset metadata", () => {
      const asset = manager.createAsset({
        name: "My Image",
        filename: "my-image.jpg",
        url: "https://example.com/my-image.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      const updated = manager.updateAssetMetadata(asset.id, {
        alt: "Updated alt",
        credit: "Photographer Name",
      });

      expect(updated.metadata.alt).toBe("Updated alt");
      expect(updated.metadata.credit).toBe("Photographer Name");
    });

    it("should delete an asset", () => {
      const asset = manager.createAsset({
        name: "My Image",
        filename: "my-image.jpg",
        url: "https://example.com/my-image.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      const result = manager.deleteAsset(asset.id);
      expect(result).toBe(true);
      expect(manager.getAsset(asset.id)).toBeUndefined();
    });

    it("should get asset by filename", () => {
      manager.createAsset({
        name: "My Image",
        filename: "unique-file.jpg",
        url: "https://example.com/unique-file.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      const found = manager.getAssetByFilename("unique-file.jpg");
      expect(found).toBeDefined();
      expect(found?.filename).toBe("unique-file.jpg");
    });
  });

  // ============================================================================
  // Folder Management
  // ============================================================================

  describe("Folder Management", () => {
    it("should create a folder", () => {
      const folder = manager.createFolder({ name: "Blog Images", parentId: null });

      expect(folder.id).toBeDefined();
      expect(folder.name).toBe("Blog Images");
      expect(folder.path).toBe("/Blog Images");
    });

    it("should create nested folders", () => {
      const parent = manager.createFolder({ name: "Images", parentId: null });
      const child = manager.createFolder({ name: "2024", parentId: parent.id });

      expect(child.parentId).toBe(parent.id);
      expect(child.path).toBe("/Images/2024");
    });

    it("should prevent duplicate folder names in same parent", () => {
      manager.createFolder({ name: "Images", parentId: null });

      expect(() => {
        manager.createFolder({ name: "Images", parentId: null });
      }).toThrow('Folder "Images" already exists in this location');
    });

    it("should get folder path", () => {
      const images = manager.createFolder({ name: "Images", parentId: null });
      const blog = manager.createFolder({ name: "Blog", parentId: images.id });
      const twenty24 = manager.createFolder({ name: "2024", parentId: blog.id });

      const path = manager.getFolderPath(twenty24.id);
      expect(path).toHaveLength(4); // root + 3 levels
      expect(path[0].name).toBe("Root");
      expect(path[1].name).toBe("Images");
      expect(path[2].name).toBe("Blog");
      expect(path[3].name).toBe("2024");
    });

    it("should get subfolders", () => {
      const images = manager.createFolder({ name: "Images", parentId: null });
      manager.createFolder({ name: "Blog", parentId: images.id });
      manager.createFolder({ name: "Products", parentId: images.id });

      const subfolders = manager.getSubfolders(images.id);
      expect(subfolders).toHaveLength(2);
    });

    it("should delete folder and move assets to parent", () => {
      const images = manager.createFolder({ name: "Images", parentId: null });
      const asset = manager.createAsset({
        name: "Test Image",
        filename: "test.jpg",
        url: "https://example.com/test.jpg",
        type: "image",
        folderId: images.id,
        uploaderId: "user-1",
      });

      manager.deleteFolder(images.id, true);
      
      expect(manager.getFolder(images.id)).toBeUndefined();
      expect(manager.getAsset(asset.id)?.folderId).toBe(manager.getRootFolder().id);
    });

    it("should prevent deleting folder with subfolders", () => {
      const images = manager.createFolder({ name: "Images", parentId: null });
      manager.createFolder({ name: "2024", parentId: images.id });

      expect(() => {
        manager.deleteFolder(images.id);
      }).toThrow("it contains subfolders");
    });

    it("should prevent deleting root folder", () => {
      expect(() => {
        manager.deleteFolder(manager.getRootFolder().id);
      }).toThrow("Cannot delete root folder");
    });
  });

  // ============================================================================
  // Search & Filter
  // ============================================================================

  describe("Search & Filter", () => {
    beforeEach(() => {
      manager.createAsset({
        name: "Cat Photo",
        filename: "cat.jpg",
        url: "https://example.com/cat.jpg",
        type: "image",
        uploaderId: "user-1",
        metadata: { alt: "A cute cat", tags: ["pets", "animals"] },
      });
      manager.createAsset({
        name: "Dog Video",
        filename: "dog.mp4",
        url: "https://example.com/dog.mp4",
        type: "video",
        uploaderId: "user-1",
        metadata: { tags: ["pets", "animals"] },
      });
      manager.createAsset({
        name: "Document",
        filename: "doc.pdf",
        url: "https://example.com/doc.pdf",
        type: "document",
        uploaderId: "user-2",
      });
    });

    it("should search by name", () => {
      const results = manager.search("cat");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Cat Photo");
    });

    it("should search by tag", () => {
      const results = manager.search("pets");
      expect(results).toHaveLength(2);
    });

    it("should filter by type", () => {
      const images = manager.getAssetsByType("image");
      expect(images).toHaveLength(1);
      expect(images[0].type).toBe("image");
    });

    it("should query with multiple filters", () => {
      const result = manager.query({
        filter: { type: "image", search: "cat" },
      });

      expect(result.assets).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should paginate results", () => {
      // Create 5 more assets
      for (let i = 0; i < 5; i++) {
        manager.createAsset({
          name: `Asset ${i}`,
          filename: `asset-${i}.jpg`,
          url: `https://example.com/asset-${i}.jpg`,
          type: "image",
          uploaderId: "user-1",
        });
      }

      const result = manager.query({
        pagination: { page: 1, perPage: 3 },
      });

      expect(result.assets).toHaveLength(3);
      expect(result.total).toBe(8);
      expect(result.totalPages).toBe(3);
    });
  });

  // ============================================================================
  // Metadata Quality
  // ============================================================================

  describe("Metadata Quality", () => {
    it("should find images missing alt text", () => {
      manager.createAsset({
        name: "With Alt",
        filename: "with-alt.jpg",
        url: "https://example.com/with-alt.jpg",
        type: "image",
        uploaderId: "user-1",
        metadata: { alt: "Has alt text" },
      });
      manager.createAsset({
        name: "Without Alt",
        filename: "without-alt.jpg",
        url: "https://example.com/without-alt.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      const missingAlt = manager.getAssetsMissingAlt();
      expect(missingAlt).toHaveLength(1);
      expect(missingAlt[0].name).toBe("Without Alt");
    });

    it("should find assets missing metadata", () => {
      manager.createAsset({
        name: "With Metadata",
        filename: "with-meta.jpg",
        url: "https://example.com/with-meta.jpg",
        type: "image",
        uploaderId: "user-1",
        metadata: { title: "Has title" },
      });
      manager.createAsset({
        name: "Without Metadata",
        filename: "without-meta.jpg",
        url: "https://example.com/without-meta.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      const missingMeta = manager.getAssetsMissingMetadata();
      expect(missingMeta).toHaveLength(1);
      expect(missingMeta[0].name).toBe("Without Metadata");
    });

    it("should filter by alt presence", () => {
      manager.createAsset({
        name: "With Alt",
        filename: "with-alt.jpg",
        url: "https://example.com/with-alt.jpg",
        type: "image",
        uploaderId: "user-1",
        metadata: { alt: "Has alt text" },
      });
      manager.createAsset({
        name: "Without Alt",
        filename: "without-alt.jpg",
        url: "https://example.com/without-alt.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      const withAlt = manager.query({
        filter: { hasAlt: true },
      });
      expect(withAlt.assets).toHaveLength(1);

      const withoutAlt = manager.query({
        filter: { hasAlt: false },
      });
      expect(withoutAlt.assets).toHaveLength(1);
    });
  });

  // ============================================================================
  // Usage Tracking
  // ============================================================================

  describe("Usage Tracking", () => {
    it("should track asset usage in entries", () => {
      const asset = manager.createAsset({
        name: "Test Image",
        filename: "test.jpg",
        url: "https://example.com/test.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      manager.trackAssetUsage(asset.id, "entry-1");
      manager.trackAssetUsage(asset.id, "entry-2");

      const updated = manager.getAsset(asset.id)!;
      expect(updated.usageCount).toBe(2);
      expect(updated.usedInEntries).toContain("entry-1");
      expect(updated.usedInEntries).toContain("entry-2");
    });

    it("should untrack asset usage", () => {
      const asset = manager.createAsset({
        name: "Test Image",
        filename: "test.jpg",
        url: "https://example.com/test.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      manager.trackAssetUsage(asset.id, "entry-1");
      manager.untrackAssetUsage(asset.id, "entry-1");

      const updated = manager.getAsset(asset.id)!;
      expect(updated.usageCount).toBe(0);
      expect(updated.usedInEntries).not.toContain("entry-1");
    });

    it("should get assets used in entry", () => {
      const asset1 = manager.createAsset({
        name: "Image 1",
        filename: "img1.jpg",
        url: "https://example.com/img1.jpg",
        type: "image",
        uploaderId: "user-1",
      });
      const asset2 = manager.createAsset({
        name: "Image 2",
        filename: "img2.jpg",
        url: "https://example.com/img2.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      manager.trackAssetUsage(asset1.id, "entry-1");
      manager.trackAssetUsage(asset2.id, "entry-1");

      const usedAssets = manager.getAssetsUsedInEntry("entry-1");
      expect(usedAssets).toHaveLength(2);
    });

    it("should get unused assets", () => {
      const asset1 = manager.createAsset({
        name: "Used Image",
        filename: "used.jpg",
        url: "https://example.com/used.jpg",
        type: "image",
        uploaderId: "user-1",
      });
      manager.createAsset({
        name: "Unused Image",
        filename: "unused.jpg",
        url: "https://example.com/unused.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      manager.trackAssetUsage(asset1.id, "entry-1");

      const unused = manager.getUnusedAssets();
      expect(unused).toHaveLength(1);
      expect(unused[0].name).toBe("Unused Image");
    });
  });

  // ============================================================================
  // Batch Operations
  // ============================================================================

  describe("Batch Operations", () => {
    it("should move multiple assets to folder", () => {
      const folder = manager.createFolder({ name: "Images", parentId: null });
      const asset1 = manager.createAsset({
        name: "Image 1",
        filename: "img1.jpg",
        url: "https://example.com/img1.jpg",
        type: "image",
        uploaderId: "user-1",
      });
      const asset2 = manager.createAsset({
        name: "Image 2",
        filename: "img2.jpg",
        url: "https://example.com/img2.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      manager.moveAssetsToFolder([asset1.id, asset2.id], folder.id);

      expect(manager.getAsset(asset1.id)?.folderId).toBe(folder.id);
      expect(manager.getAsset(asset2.id)?.folderId).toBe(folder.id);
    });

    it("should delete multiple assets", () => {
      const asset1 = manager.createAsset({
        name: "Image 1",
        filename: "img1.jpg",
        url: "https://example.com/img1.jpg",
        type: "image",
        uploaderId: "user-1",
      });
      const asset2 = manager.createAsset({
        name: "Image 2",
        filename: "img2.jpg",
        url: "https://example.com/img2.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      const result = manager.deleteAssets([asset1.id, asset2.id]);

      expect(result.deleted).toHaveLength(2);
      expect(manager.getAsset(asset1.id)).toBeUndefined();
      expect(manager.getAsset(asset2.id)).toBeUndefined();
    });

    it("should add tags to multiple assets", () => {
      const asset1 = manager.createAsset({
        name: "Image 1",
        filename: "img1.jpg",
        url: "https://example.com/img1.jpg",
        type: "image",
        uploaderId: "user-1",
        metadata: { tags: ["existing"] },
      });
      const asset2 = manager.createAsset({
        name: "Image 2",
        filename: "img2.jpg",
        url: "https://example.com/img2.jpg",
        type: "image",
        uploaderId: "user-1",
      });

      manager.addTagsToAssets([asset1.id, asset2.id], ["new", "tag"]);

      expect(manager.getAsset(asset1.id)?.metadata.tags).toContain("existing");
      expect(manager.getAsset(asset1.id)?.metadata.tags).toContain("new");
      expect(manager.getAsset(asset2.id)?.metadata.tags).toContain("new");
    });
  });

  // ============================================================================
  // Statistics
  // ============================================================================

  describe("Statistics", () => {
    it("should calculate library stats", () => {
      manager.createAsset({
        name: "Image",
        filename: "img.jpg",
        url: "https://example.com/img.jpg",
        type: "image",
        uploaderId: "user-1",
        metadata: { fileSize: 1024 },
      });
      manager.createAsset({
        name: "Video",
        filename: "video.mp4",
        url: "https://example.com/video.mp4",
        type: "video",
        uploaderId: "user-1",
        metadata: { fileSize: 2048 },
      });
      manager.createFolder({ name: "Images", parentId: null });

      const stats = manager.getStats();

      expect(stats.totalAssets).toBe(2);
      expect(stats.totalFolders).toBe(1);
      expect(stats.assetsByType.image).toBe(1);
      expect(stats.assetsByType.video).toBe(1);
      expect(stats.totalStorageSize).toBe(3072);
    });
  });
});
