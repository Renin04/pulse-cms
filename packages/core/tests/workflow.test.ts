/**
 * Workflow & Governance Tests
 *
 * Tests for CMS workflow engine, approval checkpoints, scheduling,
 * and role-based permissions.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  WorkflowEngine,
  createWorkflowEngine,
  createWorkflowTransition,
  DEFAULT_WORKFLOW_TRANSITIONS,
  DEFAULT_PERMISSIONS,
} from "../src/cms/WorkflowEngine";
import type { Entry, EntryStatus } from "../src/cms";

// Helper to create a test entry
function createTestEntry(status: EntryStatus = "draft", overrides?: Partial<Entry>): Entry {
  return {
    id: "entry-1",
    contentTypeId: "type-1",
    title: "Test Entry",
    slug: "test-entry",
    status,
    fieldValues: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Workflow Engine", () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = createWorkflowEngine();
  });

  // ============================================================================
  // Transition Validation
  // ============================================================================

  describe("canTransition", () => {
    it("should allow valid draft to review transition", () => {
      const entry = createTestEntry("draft");
      const result = engine.canTransition(entry, "review", "author");
      
      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(false);
    });

    it("should allow draft to published for editors with approval", () => {
      const entry = createTestEntry("draft");
      const result = engine.canTransition(entry, "published", "editor");
      
      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(true);
    });

    it("should block draft to published for authors", () => {
      const entry = createTestEntry("draft");
      const result = engine.canTransition(entry, "published", "author");
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not allowed");
    });

    it("should block invalid transitions", () => {
      const entry = createTestEntry("archived");
      const result = engine.canTransition(entry, "review", "admin");
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not allowed");
    });

    it("should block archived to published for editors (admin only)", () => {
      const entry = createTestEntry("archived");
      const result = engine.canTransition(entry, "published", "editor");
      
      expect(result.allowed).toBe(false);
    });

    it("should allow archived to published for admins with approval", () => {
      const entry = createTestEntry("archived");
      const result = engine.canTransition(entry, "published", "admin");
      
      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(true);
    });
  });

  describe("transition", () => {
    it("should execute valid transition", () => {
      const entry = createTestEntry("draft");
      const result = engine.transition(entry, "review", "user-1", "author");
      
      expect(result.success).toBe(true);
      expect(result.entry?.status).toBe("review");
    });

    it("should create checkpoint for approval-required transitions", () => {
      const entry = createTestEntry("draft");
      const result = engine.transition(entry, "published", "user-1", "editor");
      
      expect(result.success).toBe(false);
      expect(result.checkpoint).toBeDefined();
      expect(result.checkpoint?.status).toBe("pending");
      expect(result.checkpoint?.transition.from).toBe("draft");
      expect(result.checkpoint?.transition.to).toBe("published");
    });

    it("should skip approval when skipApproval option is set", () => {
      const entry = createTestEntry("draft");
      const result = engine.transition(entry, "published", "user-1", "editor", {
        skipApproval: true,
      });
      
      expect(result.success).toBe(true);
      expect(result.entry?.status).toBe("published");
      expect(result.entry?.publishedAt).toBeDefined();
    });

    it("should set publishedAt when publishing", () => {
      const entry = createTestEntry("draft");
      const result = engine.transition(entry, "published", "user-1", "editor", {
        skipApproval: true,
      });
      
      expect(result.entry?.publishedAt).toBeDefined();
    });

    it("should clear scheduledAt when transitioning to non-scheduled status", () => {
      const entry = createTestEntry("scheduled", { scheduledAt: new Date().toISOString() });
      const result = engine.transition(entry, "published", "user-1", "editor", {
        skipApproval: true,
      });
      
      expect(result.entry?.scheduledAt).toBeNull();
    });

    it("should return error for invalid transition", () => {
      const entry = createTestEntry("published");
      const result = engine.transition(entry, "review", "user-1", "author");
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ============================================================================
  // Approval Checkpoints
  // ============================================================================

  describe("Approval Checkpoints", () => {
    it("should create checkpoint", () => {
      const checkpoint = engine.createCheckpoint("entry-1", "draft", "published", "user-1");
      
      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.entryId).toBe("entry-1");
      expect(checkpoint.status).toBe("pending");
      expect(checkpoint.requestedBy).toBe("user-1");
    });

    it("should approve checkpoint", () => {
      const checkpoint = engine.createCheckpoint("entry-1", "draft", "published", "user-1");
      const result = engine.approveCheckpoint(checkpoint.id, "admin-1", { notes: "Looks good" });
      
      expect(result.success).toBe(true);
      expect(result.checkpoint?.status).toBe("approved");
      expect(result.checkpoint?.approvedBy).toBe("admin-1");
      expect(result.checkpoint?.notes).toBe("Looks good");
    });

    it("should reject checkpoint with reason", () => {
      const checkpoint = engine.createCheckpoint("entry-1", "draft", "published", "user-1");
      const result = engine.rejectCheckpoint(checkpoint.id, "admin-1", "Needs more work", {
        notes: "Check grammar",
      });
      
      expect(result.success).toBe(true);
      expect(result.checkpoint?.status).toBe("rejected");
      expect(result.checkpoint?.rejectedBy).toBe("admin-1");
      expect(result.checkpoint?.rejectionReason).toBe("Needs more work");
    });

    it("should not approve already approved checkpoint", () => {
      const checkpoint = engine.createCheckpoint("entry-1", "draft", "published", "user-1");
      engine.approveCheckpoint(checkpoint.id, "admin-1");
      
      const result = engine.approveCheckpoint(checkpoint.id, "admin-2");
      expect(result.success).toBe(false);
      expect(result.error).toContain("already approved");
    });

    it("should get checkpoints for entry", () => {
      engine.createCheckpoint("entry-1", "draft", "published", "user-1");
      engine.createCheckpoint("entry-1", "review", "published", "user-1");
      engine.createCheckpoint("entry-2", "draft", "published", "user-1");
      
      const entryCheckpoints = engine.getEntryCheckpoints("entry-1");
      expect(entryCheckpoints).toHaveLength(2);
    });

    it("should get pending checkpoints", () => {
      const cp1 = engine.createCheckpoint("entry-1", "draft", "published", "user-1");
      const cp2 = engine.createCheckpoint("entry-2", "draft", "published", "user-1");
      engine.approveCheckpoint(cp1.id, "admin-1");
      
      const pending = engine.getPendingCheckpoints();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(cp2.id);
    });
  });

  // ============================================================================
  // Scheduling
  // ============================================================================

  describe("Scheduling", () => {
    it("should schedule publish action", () => {
      const scheduledAt = new Date(Date.now() + 86400000).toISOString(); // tomorrow
      const action = engine.scheduleAction("entry-1", "publish", scheduledAt, "user-1");
      
      expect(action.id).toBeDefined();
      expect(action.entryId).toBe("entry-1");
      expect(action.action).toBe("publish");
      expect(action.scheduledAt).toBe(scheduledAt);
      expect(action.executed).toBe(false);
    });

    it("should get pending scheduled actions", () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      engine.scheduleAction("entry-1", "publish", future, "user-1");
      engine.scheduleAction("entry-2", "unpublish", future, "user-1");
      
      const pending = engine.getPendingScheduledActions();
      expect(pending).toHaveLength(2);
    });

    it("should get scheduled actions for entry", () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      engine.scheduleAction("entry-1", "publish", future, "user-1");
      engine.scheduleAction("entry-1", "archive", new Date(Date.now() + 172800000).toISOString(), "user-1");
      engine.scheduleAction("entry-2", "publish", future, "user-1");
      
      const entryActions = engine.getEntryScheduledActions("entry-1");
      expect(entryActions).toHaveLength(2);
    });

    it("should cancel scheduled action", () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const action = engine.scheduleAction("entry-1", "publish", future, "user-1");
      
      const result = engine.cancelScheduledAction(action.id, "user-2");
      expect(result.success).toBe(true);
      
      const pending = engine.getPendingScheduledActions();
      expect(pending).toHaveLength(0);
    });

    it("should not cancel already executed action", () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const action = engine.scheduleAction("entry-1", "publish", past, "user-1");
      
      // Simulate execution
      engine.executeDueActions();
      
      const result = engine.cancelScheduledAction(action.id, "user-2");
      expect(result.success).toBe(false);
      expect(result.error).toContain("already executed");
    });

    it("should execute due actions", () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const future = new Date(Date.now() + 86400000).toISOString();
      
      engine.scheduleAction("entry-1", "publish", past, "user-1");
      engine.scheduleAction("entry-2", "publish", future, "user-1");
      
      const results = engine.executeDueActions();
      
      expect(results).toHaveLength(1);
      expect(results[0].action.executed).toBe(true);
      expect(results[0].action.entryId).toBe("entry-1");
    });

    it("should not execute future actions", () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      engine.scheduleAction("entry-1", "publish", future, "user-1");
      
      const results = engine.executeDueActions();
      
      expect(results).toHaveLength(0);
    });
  });

  // ============================================================================
  // Permissions
  // ============================================================================

  describe("Permissions", () => {
    it("should get default permissions for author", () => {
      const perm = engine.getPermission("author");
      
      expect(perm.canCreate).toBe(true);
      expect(perm.canEdit).toBe(true);
      expect(perm.canPublish).toBe(false);
      expect(perm.canApprove).toBe(false);
    });

    it("should get default permissions for editor", () => {
      const perm = engine.getPermission("editor");
      
      expect(perm.canCreate).toBe(true);
      expect(perm.canEdit).toBe(true);
      expect(perm.canPublish).toBe(true);
      expect(perm.canApprove).toBe(true);
    });

    it("should get default permissions for admin", () => {
      const perm = engine.getPermission("admin");
      
      expect(perm.canCreate).toBe(true);
      expect(perm.canDelete).toBe(true);
      expect(perm.canPublish).toBe(true);
      expect(perm.canSchedule).toBe(true);
      expect(perm.canArchive).toBe(true);
    });

    it("should get default permissions for reviewer", () => {
      const perm = engine.getPermission("reviewer");
      
      expect(perm.canCreate).toBe(false);
      expect(perm.canApprove).toBe(true);
      expect(perm.canReject).toBe(true);
    });

    it("should check specific permissions", () => {
      expect(engine.hasPermission("author", "canPublish")).toBe(false);
      expect(engine.hasPermission("editor", "canPublish")).toBe(true);
      expect(engine.hasPermission("admin", "canDelete")).toBe(true);
    });

    it("should set custom permission", () => {
      engine.setPermission("author", { canPublish: true });
      
      expect(engine.hasPermission("author", "canPublish")).toBe(true);
    });
  });

  // ============================================================================
  // Audit Logging
  // ============================================================================

  describe("Audit Logging", () => {
    it("should log transitions", () => {
      const entry = createTestEntry("draft");
      engine.transition(entry, "review", "user-1", "author");
      
      const logs = engine.getEntryAuditLogs("entry-1");
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe("transition");
      expect(logs[0].fromStatus).toBe("draft");
      expect(logs[0].toStatus).toBe("review");
    });

    it("should log checkpoint creation", () => {
      engine.createCheckpoint("entry-1", "draft", "published", "user-1");
      
      const logs = engine.getEntryAuditLogs("entry-1");
      const checkpointLog = logs.find(l => l.action === "checkpoint_created");
      expect(checkpointLog).toBeDefined();
    });

    it("should log checkpoint approval", () => {
      const cp = engine.createCheckpoint("entry-1", "draft", "published", "user-1");
      engine.approveCheckpoint(cp.id, "admin-1");
      
      const logs = engine.getEntryAuditLogs("entry-1");
      const approvalLog = logs.find(l => l.action === "checkpoint_approved");
      expect(approvalLog).toBeDefined();
      expect(approvalLog?.performedBy).toBe("admin-1");
    });

    it("should log checkpoint rejection", () => {
      const cp = engine.createCheckpoint("entry-1", "draft", "published", "user-1");
      engine.rejectCheckpoint(cp.id, "admin-1", "Needs work");
      
      const logs = engine.getEntryAuditLogs("entry-1");
      const rejectionLog = logs.find(l => l.action === "checkpoint_rejected");
      expect(rejectionLog).toBeDefined();
    });

    it("should log scheduled actions", () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      engine.scheduleAction("entry-1", "publish", future, "user-1");
      
      const logs = engine.getEntryAuditLogs("entry-1");
      const scheduleLog = logs.find(l => l.action === "scheduled");
      expect(scheduleLog).toBeDefined();
    });

    it("should filter audit logs", () => {
      engine.createCheckpoint("entry-1", "draft", "published", "user-1");
      engine.createCheckpoint("entry-2", "draft", "published", "user-2");
      
      const entry1Logs = engine.getAuditLogs({ entryId: "entry-1" });
      expect(entry1Logs).toHaveLength(1);
      expect(entry1Logs[0].entryId).toBe("entry-1");
      
      const user2Logs = engine.getAuditLogs({ performedBy: "user-2" });
      expect(user2Logs).toHaveLength(1);
      expect(user2Logs[0].performedBy).toBe("user-2");
    });
  });

  // ============================================================================
  // Custom Configuration
  // ============================================================================

  describe("Custom Configuration", () => {
    it("should use custom transitions", () => {
      const customEngine = createWorkflowEngine({
        allowedTransitions: [
          createWorkflowTransition("draft", "published", { 
            requiresApproval: false, 
            allowedRoles: ["author"] 
          }),
        ],
      });
      
      const entry = createTestEntry("draft");
      const result = customEngine.canTransition(entry, "published", "author");
      
      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(false);
    });

    it("should use default role from config", () => {
      const customEngine = createWorkflowEngine({
        defaultRole: "editor",
      });
      
      const entry = createTestEntry("draft");
      // No role specified, should use default
      const result = customEngine.transition(entry, "published", "user-1");
      
      expect(result.success).toBe(false); // requires approval
      expect(result.checkpoint).toBeDefined();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle missing checkpoint gracefully", () => {
      const result = engine.approveCheckpoint("non-existent", "admin-1");
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should handle transition without user role", () => {
      const entry = createTestEntry("draft");
      const result = engine.canTransition(entry, "review");
      
      expect(result.allowed).toBe(true); // default role is author
    });

    it("should handle empty audit log filters", () => {
      engine.createCheckpoint("entry-1", "draft", "published", "user-1");
      
      const allLogs = engine.getAuditLogs();
      expect(allLogs.length).toBeGreaterThan(0);
    });

    it("should handle scheduled action not found", () => {
      const result = engine.cancelScheduledAction("non-existent", "user-1");
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });
});

describe("Default Configurations", () => {
  it("should have complete default transitions", () => {
    expect(DEFAULT_WORKFLOW_TRANSITIONS.length).toBeGreaterThan(0);
    
    // Check for key transitions
    const draftToReview = DEFAULT_WORKFLOW_TRANSITIONS.find(
      t => t.from === "draft" && t.to === "review"
    );
    expect(draftToReview).toBeDefined();
    expect(draftToReview?.requiresApproval).toBe(false);
  });

  it("should have permissions for all roles", () => {
    expect(DEFAULT_PERMISSIONS.author).toBeDefined();
    expect(DEFAULT_PERMISSIONS.editor).toBeDefined();
    expect(DEFAULT_PERMISSIONS.admin).toBeDefined();
    expect(DEFAULT_PERMISSIONS.reviewer).toBeDefined();
  });

  it("should have correct admin permissions", () => {
    const admin = DEFAULT_PERMISSIONS.admin;
    expect(admin.canCreate).toBe(true);
    expect(admin.canEdit).toBe(true);
    expect(admin.canDelete).toBe(true);
    expect(admin.canPublish).toBe(true);
    expect(admin.canSchedule).toBe(true);
    expect(admin.canArchive).toBe(true);
    expect(admin.canApprove).toBe(true);
    expect(admin.canReject).toBe(true);
  });
});
