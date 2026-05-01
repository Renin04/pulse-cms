/**
 * Publish Event Bus Tests
 *
 * Tests for publish hooks/events and webhook scaffolding including:
 * - Event subscription and emission
 * - Webhook registration and delivery
 * - Delivery tracking
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PublishEventBus } from "../src/cms/PublishEventBus";
import type { PublishEventPayload, WebhookConfig } from "../src/cms/PublishEventBus";

describe("PublishEventBus", () => {
  let eventBus: PublishEventBus;

  beforeEach(() => {
    eventBus = new PublishEventBus();
  });

  describe("Event Subscription", () => {
    it("should subscribe to events", async () => {
      const handler = vi.fn();
      
      eventBus.on("entry.created", handler);
      await eventBus.emit("entry.created", { id: "1" });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "entry.created",
          data: { id: "1" },
        })
      );
    });

    it("should unsubscribe from events", async () => {
      const handler = vi.fn();
      
      const unsubscribe = eventBus.on("entry.created", handler);
      unsubscribe();
      
      await eventBus.emit("entry.created", { id: "1" });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should support once-only subscriptions", async () => {
      const handler = vi.fn();
      
      eventBus.once("entry.created", handler);
      
      await eventBus.emit("entry.created", { id: "1" });
      await eventBus.emit("entry.created", { id: "2" });

      expect(handler).toHaveBeenCalledOnce();
    });

    it("should support global handlers", async () => {
      const handler = vi.fn();
      
      eventBus.onAny(handler);
      
      await eventBus.emit("entry.created", { id: "1" });
      await eventBus.emit("entry.published", { id: "1" });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should unsubscribe global handlers", async () => {
      const handler = vi.fn();
      
      const unsubscribe = eventBus.onAny(handler);
      unsubscribe();
      
      await eventBus.emit("entry.created", { id: "1" });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle errors in handlers gracefully", async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error("Handler error"));
      const successHandler = vi.fn();
      
      // Spy on console.error
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      eventBus.on("entry.created", errorHandler);
      eventBus.on("entry.created", successHandler);
      
      await eventBus.emit("entry.created", { id: "1" });

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it("should include metadata in payload", async () => {
      const handler = vi.fn();
      
      eventBus.on("entry.created", handler);
      await eventBus.emit("entry.created", { id: "1" });

      const payload = handler.mock.calls[0][0] as PublishEventPayload;
      expect(payload.metadata).toBeDefined();
      expect(payload.metadata.source).toBe("pulse-cms");
      expect(payload.metadata.version).toBe("1.0.0");
      expect(payload.metadata.requestId).toBeDefined();
    });
  });

  describe("Webhook Management", () => {
    it("should register webhooks", () => {
      const config: Omit<WebhookConfig, "id"> = {
        url: "https://example.com/webhook",
        events: ["entry.created", "entry.updated"],
        active: true,
      };

      const webhook = eventBus.registerWebhook(config);

      expect(webhook.id).toBeDefined();
      expect(webhook.url).toBe(config.url);
      expect(webhook.events).toEqual(config.events);
    });

    it("should update webhooks", () => {
      const webhook = eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["entry.created"],
        active: true,
      });

      const updated = eventBus.updateWebhook(webhook.id, { active: false });

      expect(updated?.active).toBe(false);
    });

    it("should return undefined for unknown webhook updates", () => {
      const result = eventBus.updateWebhook("unknown", { active: false });
      expect(result).toBeUndefined();
    });

    it("should unregister webhooks", () => {
      const webhook = eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["entry.created"],
        active: true,
      });

      expect(eventBus.unregisterWebhook(webhook.id)).toBe(true);
      expect(eventBus.getWebhook(webhook.id)).toBeUndefined();
    });

    it("should list webhooks", () => {
      eventBus.registerWebhook({
        url: "https://example.com/webhook1",
        events: ["entry.created"],
        active: true,
      });
      eventBus.registerWebhook({
        url: "https://example.com/webhook2",
        events: ["entry.updated"],
        active: false,
      });

      const webhooks = eventBus.listWebhooks();
      expect(webhooks).toHaveLength(2);
    });

    it("should list only active webhooks", () => {
      eventBus.registerWebhook({
        url: "https://example.com/active",
        events: ["entry.created"],
        active: true,
      });
      eventBus.registerWebhook({
        url: "https://example.com/inactive",
        events: ["entry.updated"],
        active: false,
      });

      const activeWebhooks = eventBus.listActiveWebhooks();
      expect(activeWebhooks).toHaveLength(1);
      expect(activeWebhooks[0].url).toBe("https://example.com/active");
    });

    it("should support wildcard event subscriptions", async () => {
      const webhook = eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["*" as never],
        active: true,
      });

      await eventBus.emit("entry.created", { id: "1" });
      await eventBus.emit("entry.published", { id: "1" });
      await eventBus.emit("entry.deleted", { id: "1" });

      const deliveries = eventBus.listDeliveries({ webhookId: webhook.id });
      expect(deliveries).toHaveLength(3);
    });

    it("should filter webhooks by content type", async () => {
      const webhook = eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["entry.created"],
        active: true,
        filter: {
          contentTypeIds: ["article"],
        },
      });

      await eventBus.emit("entry.created", { id: "1" }, {
        id: "1",
        contentTypeId: "article",
        title: "Article",
        slug: "article",
        status: "published",
        fieldValues: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      });

      await eventBus.emit("entry.created", { id: "2" }, {
        id: "2",
        contentTypeId: "page",
        title: "Page",
        slug: "page",
        status: "published",
        fieldValues: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      });

      const deliveries = eventBus.listDeliveries({ webhookId: webhook.id });
      expect(deliveries).toHaveLength(1);
    });

    it("should filter webhooks by entry status", async () => {
      const webhook = eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["entry.updated"],
        active: true,
        filter: {
          entryStatuses: ["published"],
        },
      });

      await eventBus.emit("entry.updated", { id: "1" }, {
        id: "1",
        contentTypeId: "article",
        title: "Published Article",
        slug: "published-article",
        status: "published",
        fieldValues: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      });

      await eventBus.emit("entry.updated", { id: "2" }, {
        id: "2",
        contentTypeId: "article",
        title: "Draft Article",
        slug: "draft-article",
        status: "draft",
        fieldValues: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
      });

      const deliveries = eventBus.listDeliveries({ webhookId: webhook.id });
      expect(deliveries).toHaveLength(1);
    });
  });

  describe("Delivery Tracking", () => {
    it("should track webhook deliveries", async () => {
      const webhook = eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["entry.created"],
        active: true,
      });

      await eventBus.emit("entry.created", { id: "1" });

      const deliveries = eventBus.listDeliveries();
      expect(deliveries.length).toBeGreaterThan(0);

      const delivery = deliveries[0];
      expect(delivery.webhookId).toBe(webhook.id);
      expect(delivery.eventType).toBe("entry.created");
      expect(delivery.status).toBeDefined();
    });

    it("should get delivery by id", async () => {
      eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["entry.created"],
        active: true,
      });

      await eventBus.emit("entry.created", { id: "1" });

      const deliveries = eventBus.listDeliveries();
      const delivery = eventBus.getDelivery(deliveries[0].id);

      expect(delivery).toBeDefined();
      expect(delivery?.id).toBe(deliveries[0].id);
    });

    it("should filter deliveries by webhook", async () => {
      const webhook1 = eventBus.registerWebhook({
        url: "https://example.com/webhook1",
        events: ["entry.created"],
        active: true,
      });
      const webhook2 = eventBus.registerWebhook({
        url: "https://example.com/webhook2",
        events: ["entry.created"],
        active: true,
      });

      await eventBus.emit("entry.created", { id: "1" });

      const deliveries1 = eventBus.listDeliveries({ webhookId: webhook1.id });
      const deliveries2 = eventBus.listDeliveries({ webhookId: webhook2.id });

      expect(deliveries1.length).toBeGreaterThan(0);
      expect(deliveries2.length).toBeGreaterThan(0);
    });

    it("should filter deliveries by event type", async () => {
      eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["*" as never],
        active: true,
      });

      await eventBus.emit("entry.created", { id: "1" });
      await eventBus.emit("entry.published", { id: "1" });

      const createdDeliveries = eventBus.listDeliveries({ eventType: "entry.created" });
      const publishedDeliveries = eventBus.listDeliveries({ eventType: "entry.published" });

      expect(createdDeliveries.length).toBeGreaterThan(0);
      expect(publishedDeliveries.length).toBeGreaterThan(0);
    });

    it("should limit deliveries", async () => {
      eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["*" as never],
        active: true,
      });

      await eventBus.emit("entry.created", { id: "1" });
      await eventBus.emit("entry.created", { id: "2" });
      await eventBus.emit("entry.created", { id: "3" });
      await eventBus.emit("entry.created", { id: "4" });
      await eventBus.emit("entry.created", { id: "5" });

      const deliveries = eventBus.listDeliveries({ limit: 3 });
      expect(deliveries).toHaveLength(3);
    });

    it("should return delivery stats", async () => {
      const webhook = eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["entry.created"],
        active: true,
      });

      await eventBus.emit("entry.created", { id: "1" });
      await eventBus.emit("entry.created", { id: "2" });

      const stats = eventBus.getDeliveryStats();
      expect(stats.total).toBeGreaterThanOrEqual(2);

      const webhookStats = eventBus.getDeliveryStats(webhook.id);
      expect(webhookStats.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Utility Methods", () => {
    it("should clear all state", () => {
      eventBus.on("entry.created", () => {});
      eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["entry.created"],
        active: true,
      });

      eventBus.clear();

      const stats = eventBus.getStats();
      expect(stats.handlers).toBe(0);
      expect(stats.webhooks).toBe(0);
    });

    it("should return stats", () => {
      eventBus.on("entry.created", () => {});
      eventBus.on("entry.published", () => {});
      eventBus.registerWebhook({
        url: "https://example.com/webhook",
        events: ["entry.created"],
        active: true,
      });

      const stats = eventBus.getStats();
      expect(stats.handlers).toBeGreaterThan(0);
      expect(stats.webhooks).toBe(1);
    });
  });

  describe("All Event Types", () => {
    const allEventTypes = [
      "entry.created",
      "entry.updated",
      "entry.published",
      "entry.unpublished",
      "entry.scheduled",
      "entry.schedule_cancelled",
      "entry.archived",
      "entry.deleted",
      "entry.restored",
      "content_type.created",
      "content_type.updated",
      "content_type.deleted",
      "media.uploaded",
      "media.updated",
      "media.deleted",
    ];

    allEventTypes.forEach((eventType) => {
      it(`should support ${eventType} events`, async () => {
        const handler = vi.fn();
        eventBus.on(eventType as any, handler);
        
        await eventBus.emit(eventType as any, { test: true });
        
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType,
            data: { test: true },
          })
        );
      });
    });
  });
});
