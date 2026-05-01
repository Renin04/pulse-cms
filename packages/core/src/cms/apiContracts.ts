/**
 * CMS API Contracts
 *
 * TypeScript interfaces and types for content delivery APIs and lifecycle events.
 * Defines the public API surface for CMS integrations and headless content delivery.
 */

import type { Entry, EntryStatus } from "./types";
import type { ContentType, Taxonomy, TaxonomyTerm } from "./types";
import type { PublishEventType, PublishEventPayload } from "./PublishEventBus";

// =============================================================================
// Content Delivery API Contracts
// =============================================================================

export interface ContentDeliveryAPI {
  // Entry retrieval
  getEntry(id: string): Promise<ContentDeliveryEntry | null>;
  getEntryBySlug(slug: string, contentTypeId?: string): Promise<ContentDeliveryEntry | null>;
  
  // List and query
  listEntries(query: ContentDeliveryQuery): Promise<ContentDeliveryListResult>;
  
  // Content type info
  getContentType(id: string): Promise<ContentDeliveryContentType | null>;
  listContentTypes(): Promise<ContentDeliveryContentType[]>;
  
  // Taxonomy
  getTaxonomy(id: string): Promise<ContentDeliveryTaxonomy | null>;
  getTaxonomyTerm(taxonomyId: string, termId: string): Promise<ContentDeliveryTaxonomyTerm | null>;
  getEntriesByTaxonomy(taxonomyId: string, termId: string): Promise<ContentDeliveryEntry[]>;
  
  // Navigation/Structure
  getNavigation(id: string): Promise<ContentNavigation | null>;
}

export interface ContentDeliveryEntry {
  id: string;
  contentTypeId: string;
  contentTypeName: string;
  slug: string;
  title: string;
  status: EntryStatus;
  publishedAt: string | null;
  updatedAt: string;
  
  // Content fields
  fields: Record<string, ContentDeliveryFieldValue>;
  
  // Blocks (if applicable)
  blocks?: ContentDeliveryBlock[];
  
  // SEO metadata
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
  };
  
  // Relationships
  taxonomies?: Array<{
    taxonomyId: string;
    taxonomyName: string;
    terms: Array<{ id: string; name: string; slug: string }>;
  }>;
  
  // Author info
  author?: {
    id: string;
    name: string;
    email?: string;
  };
  
  // URLs
  urls: {
    canonical: string;
    [locale: string]: string;
  };
  
  // Metadata
  meta: {
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
    version: number;
  };
}

export type ContentDeliveryFieldValue =
  | string
  | number
  | boolean
  | null
  | ContentDeliveryAsset
  | ContentDeliveryAsset[]
  | Record<string, unknown>
  | Array<Record<string, unknown>>;

export interface ContentDeliveryAsset {
  id: string;
  type: "image" | "video" | "audio" | "document" | "file";
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  credit?: string;
  source?: string;
  license?: string;
  thumbnails?: Record<string, { url: string; width: number; height: number }>;
}

export interface ContentDeliveryBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
  order: number;
}

export interface ContentDeliveryContentType {
  id: string;
  name: string;
  description?: string;
  slug: string;
  fields: ContentDeliveryFieldSchema[];
  isPublishable: boolean;
  hasSEO: boolean;
}

export interface ContentDeliveryFieldSchema {
  id: string;
  name: string;
  type: string;
  required: boolean;
  localized: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface ContentDeliveryTaxonomy {
  id: string;
  name: string;
  slug: string;
  hierarchical: boolean;
  terms: ContentDeliveryTaxonomyTerm[];
}

export interface ContentDeliveryTaxonomyTerm {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children?: ContentDeliveryTaxonomyTerm[];
  entryCount: number;
  urls: {
    canonical: string;
  };
}

export interface ContentDeliveryQuery {
  contentTypeId?: string;
  contentTypeIds?: string[];
  status?: EntryStatus | EntryStatus[];
  taxonomies?: Array<{ taxonomyId: string; termIds: string[] }>;
  
  // Pagination
  limit?: number;
  offset?: number;
  page?: number;
  perPage?: number;
  
  // Sorting
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  
  // Filtering
  filters?: Array<{
    field: string;
    operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in";
    value: unknown;
  }>;
  
  // Search
  search?: string;
  searchFields?: string[];
  
  // Include
  include?: ("author" | "taxonomies" | "blocks")[];
  
  // Locale
  locale?: string;
  
  // Date range
  publishedAfter?: string;
  publishedBefore?: string;
}

export interface ContentDeliveryListResult {
  entries: ContentDeliveryEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ContentNavigation {
  id: string;
  name: string;
  items: ContentNavigationItem[];
}

export interface ContentNavigationItem {
  id: string;
  type: "entry" | "url" | "taxonomy" | "parent";
  label: string;
  url?: string;
  entryId?: string;
  taxonomyId?: string;
  termId?: string;
  children?: ContentNavigationItem[];
  order: number;
  target?: string;
  rel?: string;
}

// =============================================================================
// Management API Contracts
// =============================================================================

export interface ContentManagementAPI {
  // Entry CRUD
  createEntry(data: CreateEntryRequest): Promise<Entry>;
  updateEntry(id: string, data: UpdateEntryRequest): Promise<Entry>;
  deleteEntry(id: string): Promise<void>;
  
  // Publishing
  publishEntry(id: string, options?: { scheduledAt?: string }): Promise<Entry>;
  unpublishEntry(id: string): Promise<Entry>;
  archiveEntry(id: string): Promise<Entry>;
  
  // Bulk operations
  bulkPublish(ids: string[]): Promise<BulkOperationResult>;
  bulkUnpublish(ids: string[]): Promise<BulkOperationResult>;
  bulkDelete(ids: string[]): Promise<BulkOperationResult>;
  
  // Content types
  createContentType(data: CreateContentTypeRequest): Promise<ContentType>;
  updateContentType(id: string, data: UpdateContentTypeRequest): Promise<ContentType>;
  deleteContentType(id: string): Promise<void>;
  
  // Taxonomies
  createTaxonomy(data: CreateTaxonomyRequest): Promise<Taxonomy>;
  createTaxonomyTerm(taxonomyId: string, data: CreateTaxonomyTermRequest): Promise<TaxonomyTerm>;
}

export interface CreateEntryRequest {
  contentTypeId: string;
  title: string;
  slug?: string;
  status?: EntryStatus;
  fieldValues?: Array<{ fieldId: string; value: unknown; localized?: Record<string, unknown> }>;
  blocks?: Entry["blocks"];
  taxonomyIds?: string[];
  authorId?: string;
  metadata?: Entry["metadata"];
  parentId?: string | null;
}

export interface UpdateEntryRequest {
  title?: string;
  slug?: string;
  status?: EntryStatus;
  fieldValues?: Array<{ fieldId: string; value: unknown; localized?: Record<string, unknown> }>;
  blocks?: Entry["blocks"];
  taxonomyIds?: string[];
  metadata?: Entry["metadata"];
}

export interface CreateContentTypeRequest {
  name: string;
  slug: string;
  description?: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    required?: boolean;
    localized?: boolean;
    config?: Record<string, unknown>;
  }>;
}

export interface UpdateContentTypeRequest {
  name?: string;
  description?: string;
  fields?: Array<{
    id: string;
    name: string;
    type: string;
    required?: boolean;
    localized?: boolean;
    config?: Record<string, unknown>;
  }>;
}

export interface CreateTaxonomyRequest {
  name: string;
  slug: string;
  description?: string;
  hierarchical?: boolean;
}

export interface CreateTaxonomyTermRequest {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
}

export interface BulkOperationResult {
  success: string[];
  failed: Array<{ id: string; error: string }>;
  total: number;
  processed: number;
}

// =============================================================================
// Webhook API Contracts
// =============================================================================

export interface WebhookAPI {
  registerWebhook(config: WebhookRegistrationRequest): Promise<WebhookRegistrationResponse>;
  updateWebhook(id: string, config: Partial<WebhookRegistrationRequest>): Promise<WebhookRegistrationResponse>;
  deleteWebhook(id: string): Promise<void>;
  listWebhooks(): Promise<WebhookRegistrationResponse[]>;
  getWebhookDeliveries(webhookId: string): Promise<WebhookDeliveryRecord[]>;
  redeliverWebhook(webhookId: string, deliveryId: string): Promise<WebhookDeliveryRecord>;
}

export interface WebhookRegistrationRequest {
  url: string;
  events: PublishEventType[] | ["*"];
  headers?: Record<string, string>;
  secret?: string;
  active?: boolean;
  retryConfig?: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
  filter?: {
    contentTypeIds?: string[];
    entryStatuses?: EntryStatus[];
  };
}

export interface WebhookRegistrationResponse {
  id: string;
  url: string;
  events: PublishEventType[] | ["*"];
  headers: Record<string, string>;
  active: boolean;
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
  filter?: {
    contentTypeIds?: string[];
    entryStatuses?: EntryStatus[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryRecord {
  id: string;
  webhookId: string;
  eventType: PublishEventType;
  status: "pending" | "delivering" | "delivered" | "failed" | "retrying";
  attempts: number;
  createdAt: string;
  deliveredAt?: string;
  error?: string;
  responseStatus?: number;
  responseBody?: string;
}

// =============================================================================
// Event Subscription API Contracts
// =============================================================================

export interface EventSubscriptionAPI {
  subscribe<T>(
    eventType: PublishEventType,
    handler: EventHandler<T>,
    options?: { priority?: number; once?: boolean }
  ): SubscriptionHandle;
  
  subscribeToAll(handler: EventHandler<unknown>): SubscriptionHandle;
  
  unsubscribe(handle: SubscriptionHandle): void;
  
  emit<T>(eventType: PublishEventType, data?: T, entry?: Entry): Promise<void>;
}

export type EventHandler<T> = (payload: PublishEventPayload<T>) => void | Promise<void>;

export interface SubscriptionHandle {
  id: string;
  eventType: PublishEventType;
  unsubscribe: () => void;
}

// =============================================================================
// Real-time API Contracts (WebSocket/SSE)
// =============================================================================

export interface RealtimeAPI {
  connect(): Promise<void>;
  disconnect(): void;
  subscribeToChannel(channel: string, handler: (message: RealtimeMessage) => void): () => void;
  publishToChannel(channel: string, message: unknown): void;
}

export interface RealtimeMessage {
  id: string;
  channel: string;
  type: PublishEventType;
  payload: PublishEventPayload;
  timestamp: string;
}

// =============================================================================
// Client SDK Types
// =============================================================================

export interface ContentClientConfig {
  baseUrl: string;
  apiKey?: string;
  token?: string;
  
  // Caching
  cache?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  
  // Realtime
  realtime?: {
    enabled: boolean;
    transport: "websocket" | "sse";
    reconnect: boolean;
    reconnectAttempts: number;
  };
  
  // Retry
  retry?: {
    maxRetries: number;
    retryDelay: number;
    retryCondition: (error: unknown) => boolean;
  };
}

export interface ContentClient {
  // Delivery
  entries: ContentDeliveryAPI;
  
  // Management (if authenticated)
  management?: ContentManagementAPI;
  
  // Webhooks (if authenticated)
  webhooks?: WebhookAPI;
  
  // Events
  events: EventSubscriptionAPI;
  
  // Realtime
  realtime?: RealtimeAPI;
  
  // Utilities
  previewToken(token: string): ContentClient;
  withLocale(locale: string): ContentClient;
  
  // Cache
  clearCache(): void;
  prefetch(query: ContentDeliveryQuery): Promise<void>;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface APIResponse<T> {
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    requestId: string;
    timestamp: string;
  };
}

export interface PaginatedAPIResponse<T> extends APIResponse<T> {
  meta: APIResponse<T>["meta"] & {
    pagination: {
      total: number;
      page: number;
      perPage: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}
