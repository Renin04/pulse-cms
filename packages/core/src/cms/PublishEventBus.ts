/**
 * Publish Event Bus
 *
 * Event system for content publishing lifecycle with webhook scaffolding.
 * Enables integrations with external systems for publish/update/delete events.
 */

import type { Entry, EntryStatus } from "./types";

export type PublishEventType =
  | "entry.created"
  | "entry.updated"
  | "entry.published"
  | "entry.unpublished"
  | "entry.scheduled"
  | "entry.schedule_cancelled"
  | "entry.archived"
  | "entry.deleted"
  | "entry.restored"
  | "content_type.created"
  | "content_type.updated"
  | "content_type.deleted"
  | "media.uploaded"
  | "media.updated"
  | "media.deleted";

export interface PublishEventPayload<T = unknown> {
  eventType: PublishEventType;
  timestamp: string;
  entry?: Entry;
  data?: T;
  metadata: {
    source: string;
    version: string;
    requestId: string;
    [key: string]: unknown;
  };
}

export type PublishEventHandler<T = unknown> = (payload: PublishEventPayload<T>) => void | Promise<void>;

export interface WebhookConfig {
  id: string;
  url: string;
  events: PublishEventType[] | ["*"];
  headers?: Record<string, string>;
  secret?: string;
  active: boolean;
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

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: PublishEventType;
  payload: PublishEventPayload;
  status: "pending" | "delivering" | "delivered" | "failed" | "retrying";
  attempts: number;
  createdAt: string;
  deliveredAt?: string;
  error?: string;
  responseStatus?: number;
  responseBody?: string;
}

export interface PublishHook {
  id: string;
  name: string;
  events: PublishEventType[];
  priority: number;
  handler: PublishEventHandler;
  once?: boolean;
}

export class PublishEventBus {
  private handlers: Map<PublishEventType, Set<PublishHook>> = new Map();
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private globalHandlers: Set<PublishHook> = new Set();
  private requestId: string = "";

  constructor() {
    this.generateRequestId();
  }

  private generateRequestId(): void {
    this.requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // ============================================================================
  // Event Subscription
  // ============================================================================

  on<T>(eventType: PublishEventType, handler: PublishEventHandler<T>, options?: { priority?: number; once?: boolean }): () => void {
    const hook: PublishHook = {
      id: this.generateHookId(),
      name: "anonymous",
      events: [eventType],
      priority: options?.priority ?? 0,
      handler: handler as PublishEventHandler,
      once: options?.once,
    };

    const handlers = this.handlers.get(eventType) ?? new Set();
    handlers.add(hook);
    this.handlers.set(eventType, handlers);

    // Return unsubscribe function
    return () => {
      handlers.delete(hook);
    };
  }

  once<T>(eventType: PublishEventType, handler: PublishEventHandler<T>): void {
    this.on(eventType, handler, { once: true });
  }

  onAny(handler: PublishEventHandler): () => void {
    const hook: PublishHook = {
      id: this.generateHookId(),
      name: "global",
      events: ["*"] as unknown as PublishEventType[],
      priority: 0,
      handler,
    };

    this.globalHandlers.add(hook);
    return () => {
      this.globalHandlers.delete(hook);
    };
  }

  off(eventType: PublishEventType, handler: PublishEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;

    for (const hook of handlers) {
      if (hook.handler === handler) {
        handlers.delete(hook);
        return;
      }
    }
  }

  private generateHookId(): string {
    return `hook_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // ============================================================================
  // Event Emission
  // ============================================================================

  async emit<T>(eventType: PublishEventType, data?: T, entry?: Entry): Promise<void> {
    const payload: PublishEventPayload<T> = {
      eventType,
      timestamp: new Date().toISOString(),
      entry,
      data,
      metadata: {
        source: "pulse-cms",
        version: "1.0.0",
        requestId: this.requestId,
      },
    };

    // Execute specific handlers
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const sortedHandlers = Array.from(handlers).sort((a, b) => b.priority - a.priority);
      
      for (const hook of sortedHandlers) {
        try {
          await hook.handler(payload);
          
          if (hook.once) {
            handlers.delete(hook);
          }
        } catch (error) {
          console.error(`Error in publish hook "${hook.name}" for event "${eventType}":`, error);
        }
      }
    }

    // Execute global handlers
    for (const hook of this.globalHandlers) {
      try {
        await hook.handler(payload);
      } catch (error) {
        console.error(`Error in global publish hook for event "${eventType}":`, error);
      }
    }

    // Trigger webhooks
    await this.triggerWebhooks(eventType, payload);
  }

  // ============================================================================
  // Webhook Management
  // ============================================================================

  registerWebhook(config: Omit<WebhookConfig, "id">): WebhookConfig {
    const webhook: WebhookConfig = {
      ...config,
      id: this.generateWebhookId(),
    };

    this.webhooks.set(webhook.id, webhook);
    return webhook;
  }

  updateWebhook(id: string, updates: Partial<WebhookConfig>): WebhookConfig | undefined {
    const existing = this.webhooks.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.webhooks.set(id, updated);
    return updated;
  }

  unregisterWebhook(id: string): boolean {
    return this.webhooks.delete(id);
  }

  getWebhook(id: string): WebhookConfig | undefined {
    return this.webhooks.get(id);
  }

  listWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  listActiveWebhooks(): WebhookConfig[] {
    return this.listWebhooks().filter((w) => w.active);
  }

  private generateWebhookId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // ============================================================================
  // Webhook Delivery
  // ============================================================================

  private async triggerWebhooks(eventType: PublishEventType, payload: PublishEventPayload): Promise<void> {
    const activeWebhooks = this.listActiveWebhooks();

    for (const wh of activeWebhooks) {
      // Check if webhook is subscribed to this event
      if (!this.shouldTriggerWebhook(wh, eventType, payload)) {
        continue;
      }

      const delivery = this.createDelivery(wh, eventType, payload);
      
      // In a real implementation, this would queue the delivery for async processing
      // For now, we simulate the delivery
      this.simulateWebhookDelivery(delivery, wh);
    }
  }

  private shouldTriggerWebhook(webhook: WebhookConfig, eventType: PublishEventType, payload: PublishEventPayload): boolean {
    // Check event subscription
    const subscribedEvents = webhook.events as string[];
    if (!subscribedEvents.includes("*") && !subscribedEvents.includes(eventType)) {
      return false;
    }

    // Check content type filter
    if (webhook.filter?.contentTypeIds && payload.entry) {
      if (!webhook.filter.contentTypeIds.includes(payload.entry.contentTypeId)) {
        return false;
      }
    }

    // Check status filter
    if (webhook.filter?.entryStatuses && payload.entry) {
      if (!webhook.filter.entryStatuses.includes(payload.entry.status)) {
        return false;
      }
    }

    return true;
  }

  private createDelivery(webhook: WebhookConfig, eventType: PublishEventType, payload: PublishEventPayload): WebhookDelivery {
    const delivery: WebhookDelivery = {
      id: this.generateDeliveryId(),
      webhookId: webhook.id,
      eventType,
      payload,
      status: "pending",
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    this.deliveries.set(delivery.id, delivery);
    return delivery;
  }

  private generateDeliveryId(): string {
    return `dlv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async simulateWebhookDelivery(delivery: WebhookDelivery, webhook: WebhookConfig): Promise<void> {
    delivery.status = "delivering";
    delivery.attempts++;

    // Simulate async delivery
    // In production, this would make an actual HTTP request
    // webhook config would be used for headers, auth, etc.
    void webhook; // Mark as intentionally used
    setTimeout(() => {
      delivery.status = "delivered";
      delivery.deliveredAt = new Date().toISOString();
      delivery.responseStatus = 200;
    }, 0);
  }

  // ============================================================================
  // Delivery Tracking
  // ============================================================================

  getDelivery(id: string): WebhookDelivery | undefined {
    return this.deliveries.get(id);
  }

  listDeliveries(options?: {
    webhookId?: string;
    eventType?: PublishEventType;
    status?: WebhookDelivery["status"];
    limit?: number;
  }): WebhookDelivery[] {
    let deliveries = Array.from(this.deliveries.values());

    if (options?.webhookId) {
      deliveries = deliveries.filter((d) => d.webhookId === options.webhookId);
    }

    if (options?.eventType) {
      deliveries = deliveries.filter((d) => d.eventType === options.eventType);
    }

    if (options?.status) {
      deliveries = deliveries.filter((d) => d.status === options.status);
    }

    // Sort by createdAt desc
    deliveries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options?.limit) {
      deliveries = deliveries.slice(0, options.limit);
    }

    return deliveries;
  }

  getDeliveryStats(webhookId?: string): {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    retrying: number;
  } {
    const deliveries = webhookId
      ? Array.from(this.deliveries.values()).filter((d) => d.webhookId === webhookId)
      : Array.from(this.deliveries.values());

    return {
      total: deliveries.length,
      delivered: deliveries.filter((d) => d.status === "delivered").length,
      failed: deliveries.filter((d) => d.status === "failed").length,
      pending: deliveries.filter((d) => d.status === "pending").length,
      retrying: deliveries.filter((d) => d.status === "retrying").length,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  clear(): void {
    this.handlers.clear();
    this.webhooks.clear();
    this.deliveries.clear();
    this.globalHandlers.clear();
  }

  getStats(): {
    handlers: number;
    webhooks: number;
    deliveries: number;
  } {
    return {
      handlers: this.handlers.size,
      webhooks: this.webhooks.size,
      deliveries: this.deliveries.size,
    };
  }
}

export default PublishEventBus;
