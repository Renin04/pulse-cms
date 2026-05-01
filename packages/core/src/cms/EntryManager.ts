/**
 * Entry Manager
 *
 * Manages CMS content entries with CRUD operations, querying, filtering,
 * and relationship resolution.
 */

import type {
  Entry,
  EntryFieldValue,
  EntryStatus,
  EntryQuery,
  EntryQueryResult,
  EntryFilter,
} from "./types";
import { validateEntry, validateEntryQuery } from "./schemas";
import { generateId, now, slugify, ensureUniqueSlug } from "./utils";
import type { ContentTypeRegistry } from "./ContentTypeRegistry";

export interface EntryManagerConfig {
  contentTypeRegistry: ContentTypeRegistry;
  defaultStatus?: EntryStatus;
}

export class EntryManager {
  private entries: Map<string, Entry> = new Map();
  private config: EntryManagerConfig;

  constructor(config: EntryManagerConfig) {
    this.config = config;
  }

  // ============================================================================
  // Entry CRUD
  // ============================================================================

  create(
    contentTypeId: string,
    data: {
      title: string;
      slug?: string;
      fieldValues?: Array<{ fieldId: string; value: unknown; localized?: Record<string, unknown> }>;
      blocks?: Entry["blocks"];
      authorId?: string;
      status?: EntryStatus;
      metadata?: Entry["metadata"];
      taxonomyIds?: string[];
      parentId?: string | null;
    },
  ): Entry {
    const contentType = this.config.contentTypeRegistry.get(contentTypeId);
    if (!contentType) {
      throw new Error(`Content type with ID "${contentTypeId}" not found`);
    }

    // Generate or validate slug
    const slug = this.resolveSlug(data.slug ?? slugify(data.title), contentTypeId, data.parentId);

    // Build field values
    const fieldValues: EntryFieldValue[] = [];

    // Add provided field values
    if (data.fieldValues) {
      for (const fv of data.fieldValues) {
        // Support both { fieldId: string, value: any } and { fieldId property directly }
        const fieldId = (fv as unknown as Record<string, unknown>).fieldId as string;
        if (fieldId) {
          fieldValues.push({ fieldId, value: fv.value, localized: fv.localized });
        }
      }
    }

    // Add default values for missing fields with defaults
    for (const field of contentType.fields) {
      if (!fieldValues.some((fv) => fv.fieldId === field.id)) {
        if (field.config.defaultValue !== undefined) {
          fieldValues.push({ fieldId: field.id, value: field.config.defaultValue });
        }
      }
    }

    const entry: Entry = {
      id: generateId(),
      contentTypeId,
      title: data.title,
      slug,
      status: data.status ?? this.config.defaultStatus ?? "draft",
      fieldValues,
      blocks: data.blocks,
      authorId: data.authorId,
      publishedAt: null,
      createdAt: now(),
      updatedAt: now(),
      metadata: data.metadata,
      taxonomyIds: data.taxonomyIds,
      parentId: data.parentId ?? null,
    };

    const validated = validateEntry(entry);
    this.entries.set(validated.id, validated);

    return validated;
  }

  update(
    id: string,
    updates: Partial<
      Omit<Entry, "id" | "contentTypeId" | "createdAt" | "updatedAt" | "slug">
    > & { slug?: string },
  ): Entry {
    const existing = this.get(id);
    if (!existing) {
      throw new Error(`Entry with ID "${id}" not found`);
    }

    // Handle slug change
    let newSlug = existing.slug;
    if (updates.slug && updates.slug !== existing.slug) {
      newSlug = this.resolveSlug(updates.slug, existing.contentTypeId, existing.parentId, existing.id);
    }

    // Merge field values
    let mergedFieldValues = existing.fieldValues;
    if (updates.fieldValues) {
      const valueMap = new Map(existing.fieldValues.map((fv) => [fv.fieldId, fv]));

      for (const newValue of updates.fieldValues) {
        valueMap.set(newValue.fieldId, newValue);
      }

      mergedFieldValues = Array.from(valueMap.values());
    }

    const updated: Entry = {
      ...existing,
      ...updates,
      id, // Preserve ID
      contentTypeId: existing.contentTypeId, // Preserve content type
      slug: newSlug,
      fieldValues: mergedFieldValues,
      createdAt: existing.createdAt, // Preserve creation time
      updatedAt: now(),
    };

    const validated = validateEntry(updated);
    this.entries.set(id, validated);

    return validated;
  }

  delete(id: string): boolean {
    return this.entries.delete(id);
  }

  get(id: string): Entry | undefined {
    return this.entries.get(id);
  }

  getBySlug(slug: string, contentTypeId?: string): Entry | undefined {
    for (const entry of this.entries.values()) {
      if (entry.slug === slug) {
        if (!contentTypeId || entry.contentTypeId === contentTypeId) {
          return entry;
        }
      }
    }
    return undefined;
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  list(): Entry[] {
    return Array.from(this.entries.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  count(): number {
    return this.entries.size;
  }

  reset(): void {
    this.entries.clear();
  }

  // ============================================================================
  // Status Workflow
  // ============================================================================

  publish(id: string, scheduledAt?: string): Entry {
    const entry = this.get(id);
    if (!entry) {
      throw new Error(`Entry with ID "${id}" not found`);
    }

    if (scheduledAt) {
      return this.update(id, {
        status: "scheduled",
        scheduledAt,
      });
    }

    return this.update(id, {
      status: "published",
      publishedAt: now(),
    });
  }

  unpublish(id: string): Entry {
    return this.update(id, {
      status: "draft",
      publishedAt: null,
      scheduledAt: null,
    });
  }

  archive(id: string): Entry {
    return this.update(id, {
      status: "archived",
    });
  }

  submitForReview(id: string): Entry {
    return this.update(id, {
      status: "review",
    });
  }

  // ============================================================================
  // Query & Filtering
  // ============================================================================

  query(query: EntryQuery): EntryQueryResult {
    const validated = validateEntryQuery(query);
    let entries = this.list();

    // Filter by content type
    if (validated.contentTypeId) {
      entries = entries.filter((e) => e.contentTypeId === validated.contentTypeId);
    }

    // Filter by status
    if (validated.status) {
      const statuses = Array.isArray(validated.status) ? validated.status : [validated.status];
      entries = entries.filter((e) => statuses.includes(e.status));
    }

    // Apply field filters
    if (validated.filters && validated.filters.length > 0) {
      entries = entries.filter((entry) => this.matchesFilters(entry, validated.filters!));
    }

    // Apply taxonomy filters
    if (validated.taxonomyFilters && validated.taxonomyFilters.length > 0) {
      entries = entries.filter((entry) => this.matchesTaxonomyFilters(entry, validated.taxonomyFilters!));
    }

    // Apply search
    if (validated.search) {
      const searchLower = validated.search.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.title.toLowerCase().includes(searchLower) ||
          e.slug.toLowerCase().includes(searchLower) ||
          e.fieldValues.some((fv) => String(fv.value).toLowerCase().includes(searchLower)),
      );
    }

    // Calculate total before pagination
    const total = entries.length;

    // Apply sorting
    if (validated.sort) {
      entries = this.sortEntries(entries, validated.sort.field, validated.sort.direction);
    } else {
      // Default sort by updatedAt desc
      entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    // Apply pagination
    const page = validated.pagination?.page ?? 1;
    const perPage = validated.pagination?.perPage ?? 20;
    const start = (page - 1) * perPage;
    const paginatedEntries = entries.slice(start, start + perPage);

    return {
      entries: paginatedEntries,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  private matchesFilters(entry: Entry, filters: EntryFilter[]): boolean {
    return filters.every((filter) => {
      let value: unknown;

      if (filter.field === "title") {
        value = entry.title;
      } else if (filter.field === "slug") {
        value = entry.slug;
      } else if (filter.field === "status") {
        value = entry.status;
      } else if (filter.field === "authorId") {
        value = entry.authorId;
      } else if (filter.field === "createdAt") {
        value = entry.createdAt;
      } else if (filter.field === "updatedAt") {
        value = entry.updatedAt;
      } else if (filter.field === "publishedAt") {
        value = entry.publishedAt;
      } else {
        // Look in field values
        const fieldValue = entry.fieldValues.find((fv) => fv.fieldId === filter.field);
        value = fieldValue?.value;
      }

      return this.evaluateFilter(value, filter);
    });
  }

  private evaluateFilter(value: unknown, filter: EntryFilter): boolean {
    const filterValue = filter.value;

    switch (filter.operator) {
      case "eq":
        return value === filterValue;
      case "neq":
        return value !== filterValue;
      case "gt":
        return value != null && filterValue != null && value > filterValue;
      case "gte":
        return value != null && filterValue != null && value >= filterValue;
      case "lt":
        return value != null && filterValue != null && value < filterValue;
      case "lte":
        return value != null && filterValue != null && value <= filterValue;
      case "contains":
        return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      case "startsWith":
        return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
      case "endsWith":
        return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
      case "in":
        return Array.isArray(filterValue) && filterValue.includes(value);
      case "between":
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          return value != null && value >= filterValue[0] && value <= filterValue[1];
        }
        return false;
      case "exists":
        return filterValue ? value != null : value == null;
      default:
        return false;
    }
  }

  private matchesTaxonomyFilters(
    entry: Entry,
    taxonomyFilters: Array<{ taxonomyId: string; termIds: string[] }>,
  ): boolean {
    if (!entry.taxonomyIds || entry.taxonomyIds.length === 0) {
      return false;
    }

    return taxonomyFilters.every((filter) =>
      filter.termIds.some((termId) => entry.taxonomyIds?.includes(termId)),
    );
  }

  private sortEntries(entries: Entry[], field: string, direction: "asc" | "desc"): Entry[] {
    const sorted = [...entries];

    sorted.sort((a, b) => {
      let valueA: unknown;
      let valueB: unknown;

      if (field === "title") {
        valueA = a.title;
        valueB = b.title;
      } else if (field === "slug") {
        valueA = a.slug;
        valueB = b.slug;
      } else if (field === "status") {
        valueA = a.status;
        valueB = b.status;
      } else if (field === "createdAt") {
        valueA = a.createdAt;
        valueB = b.createdAt;
      } else if (field === "updatedAt") {
        valueA = a.updatedAt;
        valueB = b.updatedAt;
      } else if (field === "publishedAt") {
        valueA = a.publishedAt ?? "";
        valueB = b.publishedAt ?? "";
      } else {
        const fieldValueA = a.fieldValues.find((fv) => fv.fieldId === field);
        const fieldValueB = b.fieldValues.find((fv) => fv.fieldId === field);
        valueA = fieldValueA?.value ?? "";
        valueB = fieldValueB?.value ?? "";
      }

      // Compare values
      if (typeof valueA === "string" && typeof valueB === "string") {
        return direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }

      if (valueA == null) return direction === "asc" ? -1 : 1;
      if (valueB == null) return direction === "asc" ? 1 : -1;

      return direction === "asc"
        ? valueA < valueB ? -1 : valueA > valueB ? 1 : 0
        : valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    });

    return sorted;
  }

  // ============================================================================
  // Field Value Helpers
  // ============================================================================

  getFieldValue<T = unknown>(entryId: string, fieldId: string): T | undefined {
    const entry = this.get(entryId);
    if (!entry) return undefined;

    const fieldValue = entry.fieldValues.find((fv) => fv.fieldId === fieldId);
    return fieldValue?.value as T | undefined;
  }

  setFieldValue<T = unknown>(entryId: string, fieldId: string, value: T): Entry {
    const entry = this.get(entryId);
    if (!entry) {
      throw new Error(`Entry with ID "${entryId}" not found`);
    }

    const fieldValues = [...entry.fieldValues];
    const existingIndex = fieldValues.findIndex((fv) => fv.fieldId === fieldId);

    if (existingIndex >= 0) {
      fieldValues[existingIndex] = { ...fieldValues[existingIndex], value };
    } else {
      fieldValues.push({ fieldId, value });
    }

    return this.update(entryId, { fieldValues });
  }

  // ============================================================================
  // Slug Resolution
  // ============================================================================

  private resolveSlug(slug: string, contentTypeId: string, parentId?: string | null, excludeEntryId?: string): string {
    const baseSlug = slugify(slug);

    return ensureUniqueSlug(
      baseSlug,
      (s) => !this.slugExists(s, contentTypeId, excludeEntryId),
      { separator: "-" },
    );
  }

  private slugExists(slug: string, contentTypeId: string, excludeEntryId?: string): boolean {
    for (const entry of this.entries.values()) {
      if (entry.slug === slug && entry.contentTypeId === contentTypeId && entry.id !== excludeEntryId) {
        return true;
      }
    }
    return false;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  validateEntryFields(entry: Entry): { valid: true } | { valid: false; errors: string[] } {
    const errors: string[] = [];
    const contentType = this.config.contentTypeRegistry.get(entry.contentTypeId);

    if (!contentType) {
      return { valid: false, errors: [`Content type "${entry.contentTypeId}" not found`] };
    }

    for (const field of contentType.fields) {
      const fieldValue = entry.fieldValues.find((fv) => fv.fieldId === field.id);
      const result = this.config.contentTypeRegistry.validateFieldValue(field, fieldValue?.value);

      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }
}
