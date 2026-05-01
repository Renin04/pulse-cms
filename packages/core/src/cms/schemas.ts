/**
 * CMS Content Modeling Schemas
 *
 * Zod schemas for validating CMS content types, entries, taxonomies,
 * and relationships with migration-safe boundaries.
 */

import { z } from "zod";
import type { Block } from "../types/block";
import type {
  ContentType,
  ContentTypeField,
  Entry,
  Collection,
  Taxonomy,
  TaxonomyTerm,
  ContentRelationship,
  EntryRelationship,
  SlugPolicy,
  SchemaMigration,
  EntryQuery,
} from "./types";

// ============================================================================
// Content Type Schemas
// ============================================================================

export const fieldValidationSchema = z
  .object({
    required: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    email: z.boolean().optional(),
    url: z.boolean().optional(),
    unique: z.boolean().optional(),
    custom: z.string().optional(),
  })
  .strict();

export const fieldConfigSchema = z
  .object({
    label: z.string().min(1),
    description: z.string().optional(),
    placeholder: z.string().optional(),
    defaultValue: z.unknown().optional(),
    options: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        }),
      )
      .optional(),
    validation: fieldValidationSchema.optional(),
    hidden: z.boolean().optional(),
    readonly: z.boolean().optional(),
    localized: z.boolean().optional(),
  })
  .strict();

export const contentTypeFieldSchema: z.ZodType<ContentTypeField> = z.object({
  id: z.string().min(1),
  type: z.enum([
    "text",
    "textarea",
    "number",
    "boolean",
    "date",
    "datetime",
    "email",
    "url",
    "slug",
    "richtext",
    "markdown",
    "select",
    "multiselect",
    "reference",
    "media",
    "blocks",
  ]),
  config: fieldConfigSchema,
});

export const contentTypeMetadataSchema = z
  .object({
    icon: z.string().optional(),
    color: z.string().optional(),
    sortField: z.string().optional(),
    sortDirection: z.enum(["asc", "desc"]).optional(),
  })
  .strict();

export const contentTypeSchema: z.ZodType<ContentType> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"),
  fields: z.array(contentTypeFieldSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: contentTypeMetadataSchema.optional(),
});

// ============================================================================
// Entry Schemas
// ============================================================================

export const entryFieldValueSchema = z.object({
  fieldId: z.string().min(1),
  value: z.unknown(),
  localized: z.record(z.unknown()).optional(),
});

export const entryMetadataSchema = z
  .object({
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    canonicalUrl: z.string().optional(),
    // Admin/operational metadata
    seoScore: z.number().min(0).max(100).optional(),
    hasAltText: z.boolean().optional(),
    wordCount: z.number().optional(),
    taxonomyIds: z.array(z.string()).optional(),
  })
  .strict();

export const entryStatusSchema = z.enum(["draft", "review", "scheduled", "published", "archived"]);

export const entrySchema = z.object({
  id: z.string().min(1),
  contentTypeId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  status: entryStatusSchema,
  fieldValues: z.array(entryFieldValueSchema),
  blocks: z.array(z.custom<Block>()).optional(),
  authorId: z.string().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: entryMetadataSchema.optional(),
  taxonomyIds: z.array(z.string()).optional(),
  parentId: z.string().nullable().optional(),
});

export const collectionSettingsSchema = z
  .object({
    perPage: z.number().int().min(1).max(100),
    sortField: z.string(),
    sortDirection: z.enum(["asc", "desc"]),
    filters: z.record(z.unknown()).optional(),
  })
  .strict();

export const collectionSchema = z.object({
  id: z.string().min(1),
  contentTypeId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  entries: z.array(entrySchema),
  entryIds: z.array(z.string()),
  settings: collectionSettingsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// Taxonomy Schemas
// ============================================================================

export const taxonomyTermSchema: z.ZodType<TaxonomyTerm> = z.object({
  id: z.string().min(1),
  taxonomyId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().optional(),
  entryCount: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const taxonomyConfigSchema = z
  .object({
    hierarchical: z.boolean(),
    allowMultiple: z.boolean(),
    required: z.boolean(),
  })
  .strict();

export const taxonomySchema: z.ZodType<Taxonomy> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum(["category", "tag", "label", "custom"]),
  description: z.string().optional(),
  terms: z.array(taxonomyTermSchema),
  config: taxonomyConfigSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// Relationship Schemas
// ============================================================================

export const relationshipConfigSchema = z
  .object({
    minItems: z.number().int().min(0).optional(),
    maxItems: z.number().int().min(1).optional(),
    sortField: z.string().optional(),
    filter: z.record(z.unknown()).optional(),
  })
  .strict();

export const contentRelationshipSchema: z.ZodType<ContentRelationship> = z.object({
  id: z.string().min(1),
  sourceTypeId: z.string().min(1),
  sourceFieldId: z.string().min(1),
  targetTypeId: z.string().min(1),
  type: z.enum(["one-to-one", "one-to-many", "many-to-many"]),
  bidirectional: z.boolean(),
  inverseFieldId: z.string().optional(),
  config: relationshipConfigSchema.optional(),
});

export const entryRelationshipSchema: z.ZodType<EntryRelationship> = z.object({
  id: z.string().min(1),
  relationshipId: z.string().min(1),
  sourceEntryId: z.string().min(1),
  targetEntryId: z.string().min(1),
  order: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// Slug Policy Schema
// ============================================================================

export const slugPatternsSchema = z
  .object({
    contentType: z.string().optional(),
    taxonomy: z.string().optional(),
    entry: z.string().optional(),
  })
  .strict();

export const slugPolicySchema: z.ZodType<SlugPolicy> = z.object({
  separator: z.enum(["-", "_", "."]),
  lowercase: z.boolean(),
  maxLength: z.number().int().min(1).max(255),
  transliterate: z.boolean(),
  removeStopWords: z.boolean(),
  customStopWords: z.array(z.string()).optional(),
  enforceUniqueness: z.boolean(),
  uniquenessScope: z.enum(["contentType", "global", "collection"]),
  reservedSlugs: z.array(z.string()).optional(),
  patterns: slugPatternsSchema.optional(),
});

// ============================================================================
// Migration Schemas
// ============================================================================

export const migrationOperationSchema = z.union([
  z.object({
    type: z.literal("addField"),
    field: contentTypeFieldSchema,
  }),
  z.object({
    type: z.literal("removeField"),
    fieldId: z.string(),
  }),
  z.object({
    type: z.literal("renameField"),
    fieldId: z.string(),
    newId: z.string(),
  }),
  z.object({
    type: z.literal("modifyField"),
    fieldId: z.string(),
    changes: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal("transformField"),
    fieldId: z.string(),
    transform: z.string(),
  }),
]);

export const schemaMigrationSchema = z.object({
  id: z.string().min(1),
  contentTypeId: z.string().min(1),
  fromVersion: z.number().int().min(1),
  toVersion: z.number().int().min(1),
  operations: z.array(migrationOperationSchema),
  createdAt: z.string().datetime(),
  appliedAt: z.string().datetime().optional(),
});

// ============================================================================
// Query Schemas
// ============================================================================

export const entryFilterSchema = z.object({
  field: z.string().optional(),
  operator: z.enum([
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "contains",
    "startsWith",
    "endsWith",
    "in",
    "between",
    "exists",
  ]),
  value: z.unknown(),
});

export const entryQuerySchema = z.object({
  contentTypeId: z.string().optional(),
  collectionId: z.string().optional(),
  status: z.union([entryStatusSchema, z.array(entryStatusSchema)]).optional(),
  filters: z.array(entryFilterSchema).optional(),
  taxonomyFilters: z
    .array(
      z.object({
        taxonomyId: z.string(),
        termIds: z.array(z.string()),
      }),
    )
    .optional(),
  search: z.string().optional(),
  sort: z
    .object({
      field: z.string(),
      direction: z.enum(["asc", "desc"]),
    })
    .optional(),
  pagination: z
    .object({
      page: z.number().int().min(1),
      perPage: z.number().int().min(1).max(100),
    })
    .optional(),
});

// ============================================================================
// Workflow Schemas
// ============================================================================

import type {
  WorkflowTransition,
  WorkflowPermission,
  ApprovalCheckpoint,
  ScheduledAction,
  WorkflowAuditLog,
} from "./WorkflowEngine";

export const workflowRoleSchema = z.enum(["author", "editor", "admin", "reviewer"]);

export const workflowConditionSchema = z.object({
  type: z.enum(["fieldPresent", "fieldValue", "custom"]),
  fieldId: z.string().optional(),
  value: z.unknown().optional(),
  validator: z.string().optional(),
});

export const workflowTransitionSchema: z.ZodType<WorkflowTransition> = z.object({
  from: z.union([entryStatusSchema, z.array(entryStatusSchema)]),
  to: entryStatusSchema,
  requiresApproval: z.boolean(),
  allowedRoles: z.array(workflowRoleSchema),
  conditions: z.array(workflowConditionSchema).optional(),
});

export const workflowPermissionSchema: z.ZodType<WorkflowPermission> = z.object({
  role: workflowRoleSchema,
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canPublish: z.boolean(),
  canSchedule: z.boolean(),
  canArchive: z.boolean(),
  canApprove: z.boolean(),
  canReject: z.boolean(),
  allowedTransitions: z.array(workflowTransitionSchema),
});

export const approvalCheckpointSchema: z.ZodType<ApprovalCheckpoint> = z.object({
  id: z.string().min(1),
  entryId: z.string().min(1),
  transition: z.object({
    from: entryStatusSchema,
    to: entryStatusSchema,
  }),
  requestedBy: z.string().min(1),
  requestedAt: z.string().datetime(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  rejectedBy: z.string().optional(),
  rejectedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]),
  notes: z.string().optional(),
});

export const scheduledActionSchema: z.ZodType<ScheduledAction> = z.object({
  id: z.string().min(1),
  entryId: z.string().min(1),
  action: z.enum(["publish", "unpublish", "archive"]),
  scheduledAt: z.string().datetime(),
  executedAt: z.string().datetime().optional(),
  executed: z.boolean(),
  createdBy: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const workflowAuditLogSchema: z.ZodType<WorkflowAuditLog> = z.object({
  id: z.string().min(1),
  entryId: z.string().min(1),
  action: z.string().min(1),
  fromStatus: entryStatusSchema.optional(),
  toStatus: entryStatusSchema.optional(),
  performedBy: z.string().min(1),
  performedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// Media Schemas
// ============================================================================

import type {
  MediaAsset,
  MediaFolder,
  MediaMetadata,
  SEOMetadata,
  SEOSocialPreview,
} from "./MediaLibraryManager";

export const mediaMetadataSchema: z.ZodType<MediaMetadata> = z.object({
  alt: z.string().optional(),
  title: z.string().optional(),
  caption: z.string().optional(),
  credit: z.string().optional(),
  source: z.string().optional(),
  license: z.string().optional(),
  licenseUrl: z.string().optional(),
  description: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const mediaAssetSchema: z.ZodType<MediaAsset> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  filename: z.string().min(1),
  url: z.string().min(1),
  type: z.enum(["image", "video", "audio", "document", "other"]),
  folderId: z.string().nullable(),
  metadata: mediaMetadataSchema,
  uploaderId: z.string(),
  usageCount: z.number(),
  usedInEntries: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const mediaFolderSchema: z.ZodType<MediaFolder> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().nullable(),
  path: z.string().min(1),
  description: z.string().optional(),
  assetCount: z.number().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const seoMetadataSchema: z.ZodType<SEOMetadata> = z.object({
  title: z.string().max(60).optional(),
  description: z.string().max(160).optional(),
  keywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().optional(),
  robots: z.string().optional(),
  structuredData: z.record(z.unknown()).optional(),
});

export const seoSocialPreviewSchema: z.ZodType<SEOSocialPreview> = z.object({
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  ogType: z.string().optional(),
  twitterCard: z.enum(["summary", "summary_large_image", "app", "player"]).optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
});

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateContentType(data: unknown): ContentType {
  return contentTypeSchema.parse(data) as ContentType;
}

export function validateEntry(data: unknown): Entry {
  return entrySchema.parse(data) as Entry;
}

export function validateCollection(data: unknown): Collection {
  return collectionSchema.parse(data) as Collection;
}

export function validateTaxonomy(data: unknown): Taxonomy {
  return taxonomySchema.parse(data) as Taxonomy;
}

export function validateTaxonomyTerm(data: unknown): TaxonomyTerm {
  return taxonomyTermSchema.parse(data) as TaxonomyTerm;
}

export function validateContentRelationship(data: unknown): ContentRelationship {
  return contentRelationshipSchema.parse(data) as ContentRelationship;
}

export function validateEntryRelationship(data: unknown): EntryRelationship {
  return entryRelationshipSchema.parse(data) as EntryRelationship;
}

export function validateSlugPolicy(data: unknown): SlugPolicy {
  return slugPolicySchema.parse(data) as SlugPolicy;
}

export function validateSchemaMigration(data: unknown): SchemaMigration {
  return schemaMigrationSchema.parse(data) as SchemaMigration;
}

export function validateEntryQuery(data: unknown): EntryQuery {
  return entryQuerySchema.parse(data) as EntryQuery;
}

export function validateWorkflowTransition(data: unknown): WorkflowTransition {
  return workflowTransitionSchema.parse(data) as WorkflowTransition;
}

export function validateWorkflowPermission(data: unknown): WorkflowPermission {
  return workflowPermissionSchema.parse(data) as WorkflowPermission;
}

export function validateApprovalCheckpoint(data: unknown): ApprovalCheckpoint {
  return approvalCheckpointSchema.parse(data) as ApprovalCheckpoint;
}

export function validateScheduledAction(data: unknown): ScheduledAction {
  return scheduledActionSchema.parse(data) as ScheduledAction;
}

export function validateWorkflowAuditLog(data: unknown): WorkflowAuditLog {
  return workflowAuditLogSchema.parse(data) as WorkflowAuditLog;
}

export function validateMediaAsset(data: unknown): MediaAsset {
  return mediaAssetSchema.parse(data) as MediaAsset;
}

export function validateMediaFolder(data: unknown): MediaFolder {
  return mediaFolderSchema.parse(data) as MediaFolder;
}

export function validateMediaMetadata(data: unknown): MediaMetadata {
  return mediaMetadataSchema.parse(data) as MediaMetadata;
}

export function validateSEOMetadata(data: unknown): SEOMetadata {
  return seoMetadataSchema.parse(data) as SEOMetadata;
}

export function validateSEOSocialPreview(data: unknown): SEOSocialPreview {
  return seoSocialPreviewSchema.parse(data) as SEOSocialPreview;
}
