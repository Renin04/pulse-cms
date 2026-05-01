/**
 * CMS Content Modeling Types
 *
 * Content types, collections, entries, taxonomies, and relationships
 * for Pulse CMS platform functionality.
 */

import type { Block } from "../types/block";

// ============================================================================
// Content Type System
// ============================================================================

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "url"
  | "slug"
  | "richtext"
  | "markdown"
  | "select"
  | "multiselect"
  | "reference"
  | "media"
  | "blocks";

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  email?: boolean;
  url?: boolean;
  unique?: boolean;
  custom?: string; // Zod schema string for complex validation
}

export interface FieldConfig {
  label: string;
  description?: string;
  placeholder?: string;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>; // For select/multiselect
  validation?: FieldValidation;
  hidden?: boolean;
  readonly?: boolean;
  localized?: boolean;
}

export interface ContentTypeField {
  id: string;
  type: FieldType;
  config: FieldConfig;
}

export interface ContentType {
  id: string;
  name: string;
  description?: string;
  slug: string; // URL-friendly identifier
  fields: ContentTypeField[];
  createdAt: string;
  updatedAt: string;
  metadata?: {
    icon?: string;
    color?: string;
    sortField?: string;
    sortDirection?: "asc" | "desc";
  };
}

// ============================================================================
// Content Entry System
// ============================================================================

export type EntryStatus = "draft" | "review" | "scheduled" | "published" | "archived";

export interface EntryFieldValue {
  fieldId: string;
  value: unknown;
  localized?: Record<string, unknown>; // locale -> value
}

export interface Entry {
  id: string;
  contentTypeId: string;
  title: string;
  slug: string;
  status: EntryStatus;
  fieldValues: EntryFieldValue[];
  blocks?: Block[]; // Optional block-based content
  authorId?: string;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
    // Admin/operational metadata
    seoScore?: number;
    hasAltText?: boolean;
    wordCount?: number;
  };
  taxonomyIds?: string[]; // References to taxonomy terms
  parentId?: string | null; // For hierarchical entries
}

export interface Collection {
  id: string;
  contentTypeId: string;
  name: string;
  slug: string;
  description?: string;
  entries: Entry[];
  entryIds: string[]; // For lazy loading
  settings: {
    perPage: number;
    sortField: string;
    sortDirection: "asc" | "desc";
    filters?: Record<string, unknown>;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Taxonomy System
// ============================================================================

export type TaxonomyType = "category" | "tag" | "label" | "custom";

export interface TaxonomyTerm {
  id: string;
  taxonomyId: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  parentId?: string | null;
  order?: number;
  entryCount?: number;
  metadata?: Record<string, unknown>;
}

export interface Taxonomy {
  id: string;
  name: string;
  slug: string;
  type: TaxonomyType;
  description?: string;
  terms: TaxonomyTerm[];
  config: {
    hierarchical: boolean;
    allowMultiple: boolean;
    required: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Relationship System
// ============================================================================

export type RelationshipType = "one-to-one" | "one-to-many" | "many-to-many";

export interface ContentRelationship {
  id: string;
  sourceTypeId: string;
  sourceFieldId: string;
  targetTypeId: string;
  type: RelationshipType;
  bidirectional: boolean;
  inverseFieldId?: string; // For bidirectional relationships
  config?: {
    minItems?: number;
    maxItems?: number;
    sortField?: string;
    filter?: Record<string, unknown>;
  };
}

export interface EntryRelationship {
  id: string;
  relationshipId: string;
  sourceEntryId: string;
  targetEntryId: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Slug Policy
// ============================================================================

export interface SlugPolicy {
  separator: "-" | "_" | ".";
  lowercase: boolean;
  maxLength: number;
  transliterate: boolean; // Convert non-ASCII to ASCII
  removeStopWords: boolean;
  customStopWords?: string[];
  enforceUniqueness: boolean; // Within content type or globally
  uniquenessScope: "contentType" | "global" | "collection";
  reservedSlugs?: string[];
  patterns?: {
    // Patterns for auto-generating slugs from fields
    contentType?: string; // e.g., "{{title}}"
    taxonomy?: string;
    entry?: string; // e.g., "{{createdAt:YYYY}}/{{title}}"
  };
}

// ============================================================================
// Schema Migration Support
// ============================================================================

export interface SchemaVersion {
  id: string;
  contentTypeId: string;
  version: number;
  fields: ContentTypeField[];
  createdAt: string;
  migrationNotes?: string;
}

export interface SchemaMigration {
  id: string;
  contentTypeId: string;
  fromVersion: number;
  toVersion: number;
  operations: MigrationOperation[];
  createdAt: string;
  appliedAt?: string;
}

export type MigrationOperation =
  | { type: "addField"; field: ContentTypeField }
  | { type: "removeField"; fieldId: string }
  | { type: "renameField"; fieldId: string; newId: string }
  | { type: "modifyField"; fieldId: string; changes: Partial<ContentTypeField> }
  | { type: "transformField"; fieldId: string; transform: string }; // Function string for data transformation

// ============================================================================
// Query & Filter Types
// ============================================================================

export interface EntryFilter {
  field?: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "startsWith" | "endsWith" | "in" | "between" | "exists";
  value: unknown;
}

export interface EntryQuery {
  contentTypeId?: string;
  collectionId?: string;
  status?: EntryStatus | EntryStatus[];
  filters?: EntryFilter[];
  taxonomyFilters?: Array<{ taxonomyId: string; termIds: string[] }>;
  search?: string;
  sort?: { field: string; direction: "asc" | "desc" };
  pagination?: { page: number; perPage: number };
}

export interface EntryQueryResult {
  entries: Entry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
