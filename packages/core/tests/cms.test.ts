/**
 * CMS Module Tests
 *
 * Tests for content types, entries, taxonomies, and relationships
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  ContentTypeRegistry,
  EntryManager,
  TaxonomyManager,
  validateContentType,
  validateEntry,
  validateTaxonomy,
  slugify,
  generateSlugFromPattern,
  createSlugPolicy,
  generateId,
  now,
  deepClone,
  kebabCase,
  camelCase,
  pascalCase,
} from "../src/cms";

import type {
  ContentTypeField,
  Entry,
  Taxonomy,
  SlugPolicy,
} from "../src/cms";

describe("CMS Module", () => {
  beforeEach(() => {
    ContentTypeRegistry.resetInstance();
  });

  // ============================================================================
  // Content Type Registry
  // ============================================================================

  describe("ContentTypeRegistry", () => {
    it("should register a content type", () => {
      const registry = new ContentTypeRegistry();
      const contentType = registry.register({
        name: "Blog Post",
        slug: "blog-post",
        fields: [],
      });

      expect(contentType.id).toBeDefined();
      expect(contentType.name).toBe("Blog Post");
      expect(contentType.slug).toBe("blog-post");
      expect(contentType.fields).toEqual([]);
      expect(contentType.createdAt).toBeDefined();
      expect(contentType.updatedAt).toBeDefined();
    });

    it("should enforce unique slugs", () => {
      const registry = new ContentTypeRegistry();
      registry.register({
        name: "Blog Post",
        slug: "blog-post",
        fields: [],
      });

      expect(() => {
        registry.register({
          name: "Another Blog Post",
          slug: "blog-post",
          fields: [],
        });
      }).toThrow('Content type with slug "blog-post" already exists');
    });

    it("should update a content type", async () => {
      const registry = new ContentTypeRegistry();
      const contentType = registry.register({
        name: "Blog Post",
        slug: "blog-post",
        fields: [],
      });

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = registry.update(contentType.id, {
        name: "Updated Blog Post",
      });

      expect(updated.name).toBe("Updated Blog Post");
      expect(updated.slug).toBe("blog-post");
      expect(updated.updatedAt).not.toBe(contentType.updatedAt);
    });

    it("should add, update, and remove fields", () => {
      const registry = new ContentTypeRegistry();
      const contentType = registry.register({
        name: "Blog Post",
        slug: "blog-post",
        fields: [],
      });

      // Add field
      const withField = registry.addField(contentType.id, {
        id: "title",
        type: "text",
        config: {
          label: "Title",
          validation: { required: true },
        },
      });

      expect(withField.fields).toHaveLength(1);
      expect(withField.fields[0].id).toBe("title");

      // Update field
      const updatedField = registry.updateField(contentType.id, "title", {
        config: { label: "Post Title", validation: { required: true, maxLength: 100 } },
      });

      expect(updatedField.fields[0].config.label).toBe("Post Title");
      expect(updatedField.fields[0].config.validation?.maxLength).toBe(100);

      // Remove field
      const withoutField = registry.removeField(contentType.id, "title");
      expect(withoutField.fields).toHaveLength(0);
    });

    it("should reorder fields", () => {
      const registry = new ContentTypeRegistry();
      const contentType = registry.register({
        name: "Blog Post",
        slug: "blog-post",
        fields: [
          { id: "title", type: "text", config: { label: "Title" } },
          { id: "body", type: "textarea", config: { label: "Body" } },
          { id: "excerpt", type: "textarea", config: { label: "Excerpt" } },
        ],
      });

      const reordered = registry.reorderFields(contentType.id, ["excerpt", "title", "body"]);

      expect(reordered.fields[0].id).toBe("excerpt");
      expect(reordered.fields[1].id).toBe("title");
      expect(reordered.fields[2].id).toBe("body");
    });

    it("should generate unique slugs", () => {
      const registry = new ContentTypeRegistry();
      registry.register({ name: "Blog Post", slug: "post", fields: [] });

      const uniqueSlug = registry.generateUniqueSlug("post");
      expect(uniqueSlug).toBe("post-1");

      registry.register({ name: "Another Post", slug: uniqueSlug, fields: [] });
      const nextUnique = registry.generateUniqueSlug("post");
      expect(nextUnique).toBe("post-2");
    });

    it("should track versions", () => {
      const registry = new ContentTypeRegistry({ enableVersioning: true, maxVersionsPerType: 5 });
      const contentType = registry.register({
        name: "Blog Post",
        slug: "blog-post",
        fields: [{ id: "title", type: "text", config: { label: "Title" } }],
      });

      registry.update(contentType.id, { name: "Updated 1" });
      registry.update(contentType.id, { name: "Updated 2" });

      const versions = registry.getVersions(contentType.id);
      expect(versions.length).toBeGreaterThanOrEqual(2);
    });

    it("should create and apply migrations", () => {
      const registry = new ContentTypeRegistry();
      const contentType = registry.register({
        name: "Blog Post",
        slug: "blog-post",
        fields: [{ id: "title", type: "text", config: { label: "Title" } }],
      });

      const migration = registry.createMigration({
        contentTypeId: contentType.id,
        fromVersion: 1,
        toVersion: 2,
        operations: [
          {
            type: "addField",
            field: { id: "subtitle", type: "text", config: { label: "Subtitle" } },
          },
        ],
      });

      expect(migration.id).toBeDefined();
      expect(migration.operations).toHaveLength(1);

      const applied = registry.applyMigration(migration.id);
      expect(applied.appliedAt).toBeDefined();

      const updated = registry.get(contentType.id)!;
      expect(updated.fields).toHaveLength(2);
      expect(updated.fields.some((f) => f.id === "subtitle")).toBe(true);
    });

    it("should validate field values", () => {
      const registry = new ContentTypeRegistry();
      const field: ContentTypeField = {
        id: "email",
        type: "email",
        config: {
          label: "Email",
          validation: { required: true, email: true },
        },
      };

      const valid = registry.validateFieldValue(field, "test@example.com");
      expect(valid.valid).toBe(true);

      const invalidEmail = registry.validateFieldValue(field, "not-an-email");
      expect(invalidEmail.valid).toBe(false);
      if (!invalidEmail.valid) {
        expect(invalidEmail.errors).toContain('Field "Email" must be a valid email');
      }

      const empty = registry.validateFieldValue(field, "");
      expect(empty.valid).toBe(false);
      if (!empty.valid) {
        expect(empty.errors).toContain('Field "Email" is required');
      }
    });
  });

  // ============================================================================
  // Entry Manager
  // ============================================================================

  describe("EntryManager", () => {
    function setupManager() {
      const registry = new ContentTypeRegistry();
      const contentType = registry.register({
        name: "Blog Post",
        slug: "blog-post",
        fields: [
          { id: "title", type: "text", config: { label: "Title", validation: { required: true } } },
          { id: "body", type: "textarea", config: { label: "Body" } },
        ],
      });

      const manager = new EntryManager({ contentTypeRegistry: registry });
      return { registry, contentType, manager };
    }

    it("should create an entry", () => {
      const { contentType, manager } = setupManager();

      const entry = manager.create(contentType.id, {
        title: "My First Post",
        fieldValues: [{ fieldId: "title", value: "My First Post Content" }],
      });

      expect(entry.id).toBeDefined();
      expect(entry.title).toBe("My First Post");
      expect(entry.slug).toBe("my-first-post");
      expect(entry.contentTypeId).toBe(contentType.id);
      expect(entry.status).toBe("draft");
      // Field value should be stored
      const titleFieldValue = entry.fieldValues.find((fv) => fv.fieldId === "title");
      expect(titleFieldValue).toBeDefined();
      expect(titleFieldValue?.value).toBe("My First Post Content");
    });

    it("should generate unique entry slugs", () => {
      const { contentType, manager } = setupManager();

      const entry1 = manager.create(contentType.id, { title: "Same Title" });
      const entry2 = manager.create(contentType.id, { title: "Same Title" });

      expect(entry1.slug).toBe("same-title");
      expect(entry2.slug).toBe("same-title-1");
    });

    it("should update an entry", async () => {
      const { contentType, manager } = setupManager();

      const entry = manager.create(contentType.id, { title: "Original Title" });

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = manager.update(entry.id, { title: "Updated Title", slug: "updated-title" });

      expect(updated.title).toBe("Updated Title");
      expect(updated.slug).toBe("updated-title");
      expect(updated.updatedAt).not.toBe(entry.updatedAt);
    });

    it("should manage entry status workflow", () => {
      const { contentType, manager } = setupManager();

      const entry = manager.create(contentType.id, { title: "Test Post" });
      expect(entry.status).toBe("draft");

      const published = manager.publish(entry.id);
      expect(published.status).toBe("published");
      expect(published.publishedAt).toBeDefined();

      const scheduled = manager.publish(entry.id, "2026-12-25T00:00:00Z");
      expect(scheduled.status).toBe("scheduled");
      expect(scheduled.scheduledAt).toBe("2026-12-25T00:00:00Z");

      const unpublished = manager.unpublish(entry.id);
      expect(unpublished.status).toBe("draft");
      expect(unpublished.publishedAt).toBeNull();

      const inReview = manager.submitForReview(entry.id);
      expect(inReview.status).toBe("review");

      const archived = manager.archive(entry.id);
      expect(archived.status).toBe("archived");
    });

    it("should query entries with filters", () => {
      const { contentType, manager } = setupManager();

      manager.create(contentType.id, { title: "Post 1", status: "published" });
      manager.create(contentType.id, { title: "Post 2", status: "draft" });
      manager.create(contentType.id, { title: "Another", status: "published" });

      const allResult = manager.query({});
      expect(allResult.entries).toHaveLength(3);

      const publishedResult = manager.query({ status: "published" });
      expect(publishedResult.entries).toHaveLength(2);

      const searchResult = manager.query({ search: "Post" });
      expect(searchResult.entries).toHaveLength(2);
    });

    it("should paginate query results", () => {
      const { contentType, manager } = setupManager();

      for (let i = 1; i <= 25; i++) {
        manager.create(contentType.id, { title: `Post ${i}` });
      }

      const page1 = manager.query({ pagination: { page: 1, perPage: 10 } });
      expect(page1.entries).toHaveLength(10);
      expect(page1.total).toBe(25);
      expect(page1.totalPages).toBe(3);

      const page2 = manager.query({ pagination: { page: 2, perPage: 10 } });
      expect(page2.entries).toHaveLength(10);
      expect(page2.page).toBe(2);

      const page3 = manager.query({ pagination: { page: 3, perPage: 10 } });
      expect(page3.entries).toHaveLength(5);
    });

    it("should sort entries", () => {
      const { contentType, manager } = setupManager();

      manager.create(contentType.id, { title: "Charlie" });
      manager.create(contentType.id, { title: "Alpha" });
      manager.create(contentType.id, { title: "Bravo" });

      const ascResult = manager.query({ sort: { field: "title", direction: "asc" } });
      expect(ascResult.entries[0].title).toBe("Alpha");
      expect(ascResult.entries[1].title).toBe("Bravo");
      expect(ascResult.entries[2].title).toBe("Charlie");

      const descResult = manager.query({ sort: { field: "title", direction: "desc" } });
      expect(descResult.entries[0].title).toBe("Charlie");
      expect(descResult.entries[1].title).toBe("Bravo");
      expect(descResult.entries[2].title).toBe("Alpha");
    });

    it("should get and set field values", () => {
      const { contentType, manager } = setupManager();

      const entry = manager.create(contentType.id, {
        title: "Test",
        fieldValues: [{ fieldId: "title", value: "Original Value" }],
      });

      const value = manager.getFieldValue(entry.id, "title");
      expect(value).toBe("Original Value");

      const updated = manager.setFieldValue(entry.id, "title", "New Value");
      expect(updated.fieldValues.find((fv) => fv.fieldId === "title")?.value).toBe("New Value");

      const newValue = manager.getFieldValue(entry.id, "title");
      expect(newValue).toBe("New Value");
    });
  });

  // ============================================================================
  // Taxonomy Manager
  // ============================================================================

  describe("TaxonomyManager", () => {
    it("should register a taxonomy", () => {
      const manager = new TaxonomyManager();
      const taxonomy = manager.register({
        name: "Categories",
        slug: "categories",
        type: "category",
        config: { hierarchical: true, allowMultiple: false, required: false },
      });

      expect(taxonomy.id).toBeDefined();
      expect(taxonomy.name).toBe("Categories");
      expect(taxonomy.type).toBe("category");
      expect(taxonomy.config.hierarchical).toBe(true);
      expect(taxonomy.terms).toEqual([]);
    });

    it("should add and manage terms", () => {
      const manager = new TaxonomyManager();
      const taxonomy = manager.register({
        name: "Categories",
        slug: "categories",
        type: "category",
        config: { hierarchical: true, allowMultiple: false, required: false },
      });

      const term = manager.addTerm(taxonomy.id, {
        name: "Technology",
        description: "Tech-related posts",
      });

      expect(term.id).toBeDefined();
      expect(term.taxonomyId).toBe(taxonomy.id);
      expect(term.slug).toBe("technology");
      expect(term.name).toBe("Technology");

      const childTerm = manager.addTerm(taxonomy.id, {
        name: "Programming",
        parentId: term.id,
      });

      expect(childTerm.parentId).toBe(term.id);

      const terms = manager.getTermTree(taxonomy.id);
      expect(terms).toHaveLength(1);
      expect(terms[0].id).toBe(term.id);

      const children = manager.getTermChildren(taxonomy.id, term.id);
      expect(children).toHaveLength(1);
      expect(children[0].id).toBe(childTerm.id);
    });

    it("should enforce non-hierarchical taxonomy constraints", () => {
      const manager = new TaxonomyManager();
      const taxonomy = manager.register({
        name: "Tags",
        slug: "tags",
        type: "tag",
        config: { hierarchical: false, allowMultiple: true, required: false },
      });

      const term = manager.addTerm(taxonomy.id, { name: "JavaScript" });

      expect(() => {
        manager.addTerm(taxonomy.id, {
          name: "React",
          parentId: term.id,
        });
      }).toThrow('Taxonomy "Tags" does not support hierarchical terms');
    });

    it("should generate unique term slugs", () => {
      const manager = new TaxonomyManager();
      const taxonomy = manager.register({
        name: "Categories",
        slug: "categories",
        type: "category",
        config: { hierarchical: false, allowMultiple: false, required: false },
      });

      const term1 = manager.addTerm(taxonomy.id, { name: "Tech" });
      const term2 = manager.addTerm(taxonomy.id, { name: "Tech" });

      expect(term1.slug).toBe("tech");
      expect(term2.slug).toBe("tech-1");
    });

    it("should get term path", () => {
      const manager = new TaxonomyManager();
      const taxonomy = manager.register({
        name: "Categories",
        slug: "categories",
        type: "category",
        config: { hierarchical: true, allowMultiple: false, required: false },
      });

      const grandparent = manager.addTerm(taxonomy.id, { name: "Products" });
      const parent = manager.addTerm(taxonomy.id, { name: "Electronics", parentId: grandparent.id });
      const child = manager.addTerm(taxonomy.id, { name: "Phones", parentId: parent.id });

      const path = manager.getTermPath(taxonomy.id, child.id);
      expect(path).toHaveLength(3);
      expect(path[0].name).toBe("Products");
      expect(path[1].name).toBe("Electronics");
      expect(path[2].name).toBe("Phones");

      const pathSlugs = manager.getTermPathSlugs(taxonomy.id, child.id);
      expect(pathSlugs).toBe("products/electronics/phones");
    });

    it("should prevent circular references", () => {
      const manager = new TaxonomyManager();
      const taxonomy = manager.register({
        name: "Categories",
        slug: "categories",
        type: "category",
        config: { hierarchical: true, allowMultiple: false, required: false },
      });

      const parent = manager.addTerm(taxonomy.id, { name: "Parent" });
      const child = manager.addTerm(taxonomy.id, { name: "Child", parentId: parent.id });
      const grandchild = manager.addTerm(taxonomy.id, { name: "Grandchild", parentId: child.id });

      // Try to set grandchild as parent of parent (would create cycle)
      expect(() => {
        manager.updateTerm(taxonomy.id, parent.id, { parentId: grandchild.id });
      }).toThrow("Cannot set a descendant as parent (would create a cycle)");

      // Try to set term as its own parent
      expect(() => {
        manager.updateTerm(taxonomy.id, parent.id, { parentId: parent.id });
      }).toThrow("A term cannot be its own parent");
    });

    it("should search terms", () => {
      const manager = new TaxonomyManager();
      const taxonomy = manager.register({
        name: "Tags",
        slug: "tags",
        type: "tag",
        config: { hierarchical: false, allowMultiple: true, required: false },
      });

      manager.addTerm(taxonomy.id, { name: "JavaScript", description: "The language of the web" });
      manager.addTerm(taxonomy.id, { name: "TypeScript", description: "Typed JavaScript" });
      manager.addTerm(taxonomy.id, { name: "Python", description: "Snake language" });

      const results = manager.searchTerms(taxonomy.id, "script");
      expect(results).toHaveLength(2);
      expect(results.map((t) => t.name)).toContain("JavaScript");
      expect(results.map((t) => t.name)).toContain("TypeScript");
    });

    it("should reorder terms", () => {
      const manager = new TaxonomyManager();
      const taxonomy = manager.register({
        name: "Priority",
        slug: "priority",
        type: "label",
        config: { hierarchical: false, allowMultiple: false, required: false },
      });

      const high = manager.addTerm(taxonomy.id, { name: "High" });
      const medium = manager.addTerm(taxonomy.id, { name: "Medium" });
      const low = manager.addTerm(taxonomy.id, { name: "Low" });

      manager.reorderTerms(taxonomy.id, [low.id, medium.id, high.id]);

      const updatedTaxonomy = manager.get(taxonomy.id)!;
      expect(updatedTaxonomy.terms.find((t) => t.id === low.id)?.order).toBe(0);
      expect(updatedTaxonomy.terms.find((t) => t.id === medium.id)?.order).toBe(1);
      expect(updatedTaxonomy.terms.find((t) => t.id === high.id)?.order).toBe(2);
    });
  });

  // ============================================================================
  // Slug Utilities
  // ============================================================================

  describe("Slug Utilities", () => {
    it("should slugify text", () => {
      expect(slugify("Hello World")).toBe("hello-world");
      expect(slugify("  Multiple   Spaces  ")).toBe("multiple-spaces");
      expect(slugify("Special!@#Characters")).toBe("specialcharacters");
      expect(slugify("UPPERCASE")).toBe("uppercase");
    });

    it("should respect slug policy options", () => {
      expect(slugify("Hello World", { separator: "_" })).toBe("hello_world");
      expect(slugify("Hello World", { lowercase: false })).toBe("Hello-World");
      expect(slugify("Hello World", { maxLength: 5 })).toBe("hello");
      expect(slugify("Remove The And A", { removeStopWords: true })).toBe("remove");
    });

    it("should transliterate non-ASCII characters", () => {
      const policy: Partial<SlugPolicy> = { transliterate: true };
      expect(slugify("café", policy)).toBe("cafe");
      expect(slugify("naïve", policy)).toBe("naive");
      expect(slugify("مرحبا", policy)).toBe("mrhba");
      // Note: "Привет" in Russian: П=p, р=r, и=i, в=v, е=e, т=t -> "privet"
      expect(slugify("Привет", policy)).toBe("privet");
    });

    it("should generate slug from pattern", () => {
      const data = { title: "My Post", createdAt: "2026-04-07T12:00:00Z" };
      expect(generateSlugFromPattern("{{title}}", data)).toBe("my-post");
      expect(generateSlugFromPattern("{{createdAt:YYYY}}/{{title}}", data)).toBe("2026/my-post");
      expect(generateSlugFromPattern("blog/{{title}}", data)).toBe("blog/my-post");
    });

    it("should detect reserved slugs", () => {
      const policy = createSlugPolicy({ reservedSlugs: ["admin", "api", "new"] });
      expect(policy.reservedSlugs?.includes("admin")).toBe(true);
    });
  });

  // ============================================================================
  // General Utilities
  // ============================================================================

  describe("General Utilities", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(10);
    });

    it("should get current timestamp", () => {
      const timestamp = now();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it("should deep clone objects", () => {
      const original = {
        a: 1,
        b: { c: 2, d: [3, 4, 5] },
        e: new Date("2026-01-01"),
      };

      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.b.d).not.toBe(original.b.d);
      expect(cloned.e).not.toBe(original.e);
    });

    it("should convert case", () => {
      expect(kebabCase("helloWorld")).toBe("hello-world");
      expect(kebabCase("Hello World")).toBe("hello-world");
      expect(camelCase("hello-world")).toBe("helloWorld");
      expect(camelCase("Hello World")).toBe("helloWorld");
      expect(pascalCase("hello-world")).toBe("HelloWorld");
      expect(pascalCase("helloWorld")).toBe("HelloWorld");
    });
  });

  // ============================================================================
  // Schema Validation
  // ============================================================================

  describe("Schema Validation", () => {
    it("should validate content types", () => {
      const valid = {
        id: "ct-1",
        name: "Post",
        slug: "post",
        fields: [],
        createdAt: now(),
        updatedAt: now(),
      };

      expect(() => validateContentType(valid)).not.toThrow();

      const invalid = { ...valid, slug: "Invalid Slug With Spaces" };
      expect(() => validateContentType(invalid)).toThrow();
    });

    it("should validate entries", () => {
      const valid: Entry = {
        id: "e-1",
        contentTypeId: "ct-1",
        title: "Test Entry",
        slug: "test-entry",
        status: "draft",
        fieldValues: [],
        createdAt: now(),
        updatedAt: now(),
      };

      expect(() => validateEntry(valid)).not.toThrow();

      const invalid = { ...valid, status: "invalid-status" };
      expect(() => validateEntry(invalid)).toThrow();
    });

    it("should validate taxonomies", () => {
      const valid: Taxonomy = {
        id: "t-1",
        name: "Categories",
        slug: "categories",
        type: "category",
        terms: [],
        config: { hierarchical: true, allowMultiple: false, required: false },
        createdAt: now(),
        updatedAt: now(),
      };

      expect(() => validateTaxonomy(valid)).not.toThrow();
    });
  });
});
