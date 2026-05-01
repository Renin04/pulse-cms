/**
 * Content Type Registry
 *
 * Central registry for managing CMS content types with CRUD operations,
 * validation, and schema versioning support.
 */

import { z } from "zod";
import type { ContentType, ContentTypeField, SchemaVersion, SchemaMigration } from "./types";
import { contentTypeSchema, validateContentType } from "./schemas";
import { generateId, now } from "./utils";

export interface ContentTypeRegistryConfig {
  enableVersioning?: boolean;
  maxVersionsPerType?: number;
}

export class ContentTypeRegistry {
  private static instance: ContentTypeRegistry | null = null;

  private contentTypes: Map<string, ContentType> = new Map();
  private versions: Map<string, SchemaVersion[]> = new Map();
  private migrations: Map<string, SchemaMigration[]> = new Map();
  private config: ContentTypeRegistryConfig;

  static getInstance(config?: ContentTypeRegistryConfig): ContentTypeRegistry {
    if (!ContentTypeRegistry.instance) {
      ContentTypeRegistry.instance = new ContentTypeRegistry(config);
    }
    return ContentTypeRegistry.instance;
  }

  static resetInstance(): void {
    ContentTypeRegistry.instance = null;
  }

  constructor(config: ContentTypeRegistryConfig = {}) {
    this.config = {
      enableVersioning: true,
      maxVersionsPerType: 10,
      ...config,
    };
  }

  // ============================================================================
  // Content Type CRUD
  // ============================================================================

  register(contentType: Omit<ContentType, "id" | "createdAt" | "updatedAt"> & Partial<ContentType>): ContentType {
    const validated = validateContentType({
      ...contentType,
      id: contentType.id ?? generateId(),
      createdAt: contentType.createdAt ?? now(),
      updatedAt: contentType.updatedAt ?? now(),
    });

    if (this.contentTypes.has(validated.id)) {
      throw new Error(`Content type with ID "${validated.id}" already exists`);
    }

    if (this.slugExists(validated.slug, validated.id)) {
      throw new Error(`Content type with slug "${validated.slug}" already exists`);
    }

    this.contentTypes.set(validated.id, validated);

    if (this.config.enableVersioning) {
      this.createVersion(validated);
    }

    return validated;
  }

  update(
    id: string,
    updates: Partial<Omit<ContentType, "id" | "createdAt">>,
  ): ContentType {
    const existing = this.get(id);
    if (!existing) {
      throw new Error(`Content type with ID "${id}" not found`);
    }

    // Check slug uniqueness if slug is being changed
    if (updates.slug && updates.slug !== existing.slug) {
      if (this.slugExists(updates.slug, id)) {
        throw new Error(`Content type with slug "${updates.slug}" already exists`);
      }
    }

    const updated: ContentType = {
      ...existing,
      ...updates,
      id, // Preserve ID
      createdAt: existing.createdAt, // Preserve creation time
      updatedAt: now(),
      fields: updates.fields ?? existing.fields,
    };

    const validated = validateContentType(updated);
    this.contentTypes.set(id, validated);

    if (this.config.enableVersioning) {
      this.createVersion(validated);
    }

    return validated;
  }

  unregister(id: string): boolean {
    const existed = this.contentTypes.has(id);
    this.contentTypes.delete(id);
    this.versions.delete(id);
    this.migrations.delete(id);
    return existed;
  }

  get(id: string): ContentType | undefined {
    return this.contentTypes.get(id);
  }

  getBySlug(slug: string): ContentType | undefined {
    return Array.from(this.contentTypes.values()).find((ct) => ct.slug === slug);
  }

  has(id: string): boolean {
    return this.contentTypes.has(id);
  }

  list(): ContentType[] {
    return Array.from(this.contentTypes.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  count(): number {
    return this.contentTypes.size;
  }

  reset(): void {
    this.contentTypes.clear();
    this.versions.clear();
    this.migrations.clear();
  }

  // ============================================================================
  // Slug Utilities
  // ============================================================================

  private slugExists(slug: string, excludeId?: string): boolean {
    return Array.from(this.contentTypes.values()).some(
      (ct) => ct.slug === slug && ct.id !== excludeId,
    );
  }

  generateUniqueSlug(baseSlug: string, excludeId?: string): string {
    let slug = baseSlug;
    let counter = 1;

    while (this.slugExists(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // ============================================================================
  // Field Management
  // ============================================================================

  addField(contentTypeId: string, field: ContentTypeField): ContentType {
    const contentType = this.get(contentTypeId);
    if (!contentType) {
      throw new Error(`Content type with ID "${contentTypeId}" not found`);
    }

    if (contentType.fields.some((f) => f.id === field.id)) {
      throw new Error(`Field with ID "${field.id}" already exists in content type`);
    }

    return this.update(contentTypeId, {
      fields: [...contentType.fields, field],
    });
  }

  updateField(contentTypeId: string, fieldId: string, updates: Partial<ContentTypeField>): ContentType {
    const contentType = this.get(contentTypeId);
    if (!contentType) {
      throw new Error(`Content type with ID "${contentTypeId}" not found`);
    }

    const fieldIndex = contentType.fields.findIndex((f) => f.id === fieldId);
    if (fieldIndex === -1) {
      throw new Error(`Field with ID "${fieldId}" not found in content type`);
    }

    const updatedFields = [...contentType.fields];
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...updates };

    return this.update(contentTypeId, { fields: updatedFields });
  }

  removeField(contentTypeId: string, fieldId: string): ContentType {
    const contentType = this.get(contentTypeId);
    if (!contentType) {
      throw new Error(`Content type with ID "${contentTypeId}" not found`);
    }

    const updatedFields = contentType.fields.filter((f) => f.id !== fieldId);

    if (updatedFields.length === contentType.fields.length) {
      throw new Error(`Field with ID "${fieldId}" not found in content type`);
    }

    return this.update(contentTypeId, { fields: updatedFields });
  }

  reorderFields(contentTypeId: string, fieldIds: string[]): ContentType {
    const contentType = this.get(contentTypeId);
    if (!contentType) {
      throw new Error(`Content type with ID "${contentTypeId}" not found`);
    }

    if (fieldIds.length !== contentType.fields.length) {
      throw new Error("Field IDs array must contain all fields");
    }

    const reorderedFields = fieldIds
      .map((id) => contentType.fields.find((f) => f.id === id))
      .filter((f): f is ContentTypeField => f !== undefined);

    return this.update(contentTypeId, { fields: reorderedFields });
  }

  // ============================================================================
  // Versioning
  // ============================================================================

  private createVersion(contentType: ContentType): void {
    const versions = this.versions.get(contentType.id) ?? [];
    const newVersion: SchemaVersion = {
      id: generateId(),
      contentTypeId: contentType.id,
      version: versions.length + 1,
      fields: JSON.parse(JSON.stringify(contentType.fields)), // Deep clone
      createdAt: now(),
    };

    versions.push(newVersion);

    // Keep only the last N versions
    if (versions.length > (this.config.maxVersionsPerType ?? 10)) {
      versions.shift();
    }

    this.versions.set(contentType.id, versions);
  }

  getVersions(contentTypeId: string): SchemaVersion[] {
    return [...(this.versions.get(contentTypeId) ?? [])];
  }

  getVersion(contentTypeId: string, version: number): SchemaVersion | undefined {
    const versions = this.versions.get(contentTypeId) ?? [];
    return versions.find((v) => v.version === version);
  }

  // ============================================================================
  // Migration Support
  // ============================================================================

  createMigration(migration: Omit<SchemaMigration, "id" | "createdAt">): SchemaMigration {
    const newMigration: SchemaMigration = {
      ...migration,
      id: generateId(),
      createdAt: now(),
    };

    const migrations = this.migrations.get(migration.contentTypeId) ?? [];
    migrations.push(newMigration);
    this.migrations.set(migration.contentTypeId, migrations);

    return newMigration;
  }

  getMigrations(contentTypeId: string): SchemaMigration[] {
    return [...(this.migrations.get(contentTypeId) ?? [])];
  }

  applyMigration(migrationId: string): SchemaMigration {
    let migration: SchemaMigration | undefined;

    for (const [, migrations] of this.migrations) {
      migration = migrations.find((m) => m.id === migrationId);
      if (migration) break;
    }

    if (!migration) {
      throw new Error(`Migration with ID "${migrationId}" not found`);
    }

    if (migration.appliedAt) {
      throw new Error(`Migration "${migrationId}" has already been applied`);
    }

    const contentType = this.get(migration.contentTypeId);
    if (!contentType) {
      throw new Error(`Content type with ID "${migration.contentTypeId}" not found`);
    }

    // Apply each operation
    let updatedFields = [...contentType.fields];

    for (const operation of migration.operations) {
      switch (operation.type) {
        case "addField":
          if (!updatedFields.some((f) => f.id === operation.field.id)) {
            updatedFields.push(operation.field);
          }
          break;

        case "removeField":
          updatedFields = updatedFields.filter((f) => f.id !== operation.fieldId);
          break;

        case "renameField": {
          const fieldIndex = updatedFields.findIndex((f) => f.id === operation.fieldId);
          if (fieldIndex !== -1) {
            updatedFields[fieldIndex] = {
              ...updatedFields[fieldIndex],
              id: operation.newId,
            };
          }
          break;
        }

        case "modifyField": {
          const fieldIndex = updatedFields.findIndex((f) => f.id === operation.fieldId);
          if (fieldIndex !== -1) {
            updatedFields[fieldIndex] = {
              ...updatedFields[fieldIndex],
              ...operation.changes,
            };
          }
          break;
        }

        case "transformField":
          // Data transformation would be handled during entry migration
          // This is just schema-level tracking
          break;
      }
    }

    // Update the content type
    this.update(migration.contentTypeId, { fields: updatedFields });

    // Mark migration as applied
    migration.appliedAt = now();

    return migration;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  validate(data: unknown): { success: true; data: ContentType } | { success: false; errors: z.ZodError } {
    const result = contentTypeSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, errors: result.error };
  }

  validateFieldValue(field: ContentTypeField, value: unknown): { valid: true } | { valid: false; errors: string[] } {
    const errors: string[] = [];
    const validation = field.config.validation;

    if (!validation) {
      return { valid: true };
    }

    if (validation.required && (value === undefined || value === null || value === "")) {
      errors.push(`Field "${field.config.label}" is required`);
    }

    if (value !== undefined && value !== null) {
      if (validation.minLength !== undefined && String(value).length < validation.minLength) {
        errors.push(`Field "${field.config.label}" must be at least ${validation.minLength} characters`);
      }

      if (validation.maxLength !== undefined && String(value).length > validation.maxLength) {
        errors.push(`Field "${field.config.label}" must be at most ${validation.maxLength} characters`);
      }

      if (validation.min !== undefined && Number(value) < validation.min) {
        errors.push(`Field "${field.config.label}" must be at least ${validation.min}`);
      }

      if (validation.max !== undefined && Number(value) > validation.max) {
        errors.push(`Field "${field.config.label}" must be at most ${validation.max}`);
      }

      if (validation.pattern && !new RegExp(validation.pattern).test(String(value))) {
        errors.push(`Field "${field.config.label}" format is invalid`);
      }

      if (validation.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        errors.push(`Field "${field.config.label}" must be a valid email`);
      }

      if (validation.url) {
        try {
          new URL(String(value));
        } catch {
          errors.push(`Field "${field.config.label}" must be a valid URL`);
        }
      }
    }

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }
}
