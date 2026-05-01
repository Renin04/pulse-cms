/**
 * Workflow Engine
 *
 * Manages CMS content workflow with status transitions, validation,
 * approval checkpoints, and scheduling capabilities.
 */

import type { Entry, EntryStatus } from "./types";
import { validateApprovalCheckpoint } from "./schemas";
import { generateId, now } from "./utils";

// ============================================================================
// Workflow Types
// ============================================================================

export type WorkflowRole = "author" | "editor" | "admin" | "reviewer";

export interface WorkflowPermission {
  role: WorkflowRole;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canSchedule: boolean;
  canArchive: boolean;
  canApprove: boolean;
  canReject: boolean;
  allowedTransitions: WorkflowTransition[];
}

export interface WorkflowTransition {
  from: EntryStatus | EntryStatus[];
  to: EntryStatus;
  requiresApproval: boolean;
  allowedRoles: WorkflowRole[];
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  type: "fieldPresent" | "fieldValue" | "custom";
  fieldId?: string;
  value?: unknown;
  validator?: string; // Function string for custom validation
}

export interface ApprovalCheckpoint {
  id: string;
  entryId: string;
  transition: { from: EntryStatus; to: EntryStatus };
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
}

export interface ScheduledAction {
  id: string;
  entryId: string;
  action: "publish" | "unpublish" | "archive";
  scheduledAt: string;
  executedAt?: string;
  executed: boolean;
  createdBy: string;
  createdAt: string;
}

export interface WorkflowAuditLog {
  id: string;
  entryId: string;
  action: string;
  fromStatus?: EntryStatus;
  toStatus?: EntryStatus;
  performedBy: string;
  performedAt: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowConfig {
  defaultRole?: WorkflowRole;
  autoPublish?: boolean;
  requireApprovalFor?: EntryStatus[];
  allowedTransitions?: WorkflowTransition[];
}

// ============================================================================
// Default Workflow Configuration
// ============================================================================

export const DEFAULT_WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // Draft can go to review or be published directly (if permissions allow)
  { from: "draft", to: "review", requiresApproval: false, allowedRoles: ["author", "editor", "admin"] },
  { from: "draft", to: "scheduled", requiresApproval: false, allowedRoles: ["editor", "admin"] },
  { from: "draft", to: "published", requiresApproval: true, allowedRoles: ["editor", "admin"] },
  
  // Review can be approved (published), rejected (back to draft), or stay in review
  { from: "review", to: "draft", requiresApproval: false, allowedRoles: ["editor", "admin", "reviewer"] },
  { from: "review", to: "scheduled", requiresApproval: false, allowedRoles: ["editor", "admin"] },
  { from: "review", to: "published", requiresApproval: false, allowedRoles: ["editor", "admin"] },
  
  // Published can be unpublished (back to draft), archived, or scheduled
  { from: "published", to: "draft", requiresApproval: false, allowedRoles: ["editor", "admin"] },
  { from: "published", to: "archived", requiresApproval: false, allowedRoles: ["editor", "admin"] },
  { from: "published", to: "scheduled", requiresApproval: false, allowedRoles: ["editor", "admin"] },
  
  // Scheduled can be published (when time comes), cancelled (back to draft), or rescheduled
  { from: "scheduled", to: "draft", requiresApproval: false, allowedRoles: ["editor", "admin"] },
  { from: "scheduled", to: "published", requiresApproval: false, allowedRoles: ["editor", "admin"] },
  { from: "scheduled", to: "archived", requiresApproval: false, allowedRoles: ["editor", "admin"] },
  
  // Archived can be restored to draft or published
  { from: "archived", to: "draft", requiresApproval: false, allowedRoles: ["admin"] },
  { from: "archived", to: "published", requiresApproval: true, allowedRoles: ["admin"] },
];

export const DEFAULT_PERMISSIONS: Record<WorkflowRole, WorkflowPermission> = {
  author: {
    role: "author",
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canPublish: false,
    canSchedule: false,
    canArchive: false,
    canApprove: false,
    canReject: false,
    allowedTransitions: [
      { from: "draft", to: "review", requiresApproval: false, allowedRoles: ["author"] },
    ],
  },
  editor: {
    role: "editor",
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canPublish: true,
    canSchedule: true,
    canArchive: true,
    canApprove: true,
    canReject: true,
    allowedTransitions: DEFAULT_WORKFLOW_TRANSITIONS.filter(t => 
      !t.requiresApproval || t.to !== "published" || t.from !== "archived"
    ),
  },
  admin: {
    role: "admin",
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canPublish: true,
    canSchedule: true,
    canArchive: true,
    canApprove: true,
    canReject: true,
    allowedTransitions: DEFAULT_WORKFLOW_TRANSITIONS,
  },
  reviewer: {
    role: "reviewer",
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canPublish: false,
    canSchedule: false,
    canArchive: false,
    canApprove: true,
    canReject: true,
    allowedTransitions: [
      { from: "review", to: "draft", requiresApproval: false, allowedRoles: ["reviewer"] },
      { from: "review", to: "published", requiresApproval: false, allowedRoles: ["reviewer"] },
    ],
  },
};

// ============================================================================
// Workflow Engine
// ============================================================================

export class WorkflowEngine {
  private transitions: WorkflowTransition[];
  private permissions: Map<string, WorkflowPermission> = new Map();
  private checkpoints: Map<string, ApprovalCheckpoint> = new Map();
  private scheduledActions: Map<string, ScheduledAction> = new Map();
  private auditLogs: WorkflowAuditLog[] = [];
  private config: WorkflowConfig;

  constructor(config: WorkflowConfig = {}) {
    this.config = config;
    this.transitions = config.allowedTransitions ?? DEFAULT_WORKFLOW_TRANSITIONS;
    
    // Initialize default permissions
    for (const [role, permission] of Object.entries(DEFAULT_PERMISSIONS)) {
      this.permissions.set(role, permission);
    }
  }

  // ============================================================================
  // Transition Validation
  // ============================================================================

  /**
   * Check if a status transition is valid
   */
  canTransition(
    entry: Entry,
    toStatus: EntryStatus,
    userRole: WorkflowRole = this.config.defaultRole ?? "author",
  ): { allowed: boolean; reason?: string; requiresApproval?: boolean } {
    const fromStatus = entry.status;

    // Find matching transition
    const transition = this.findTransition(fromStatus, toStatus);
    if (!transition) {
      return { 
        allowed: false, 
        reason: `Transition from "${fromStatus}" to "${toStatus}" is not allowed` 
      };
    }

    // Check role permissions
    if (!transition.allowedRoles.includes(userRole)) {
      return { 
        allowed: false, 
        reason: `Role "${userRole}" is not allowed to perform this transition` 
      };
    }

    // Check custom conditions
    if (transition.conditions) {
      for (const condition of transition.conditions) {
        if (!this.evaluateCondition(entry, condition)) {
          return { 
            allowed: false, 
            reason: `Condition not met: ${condition.type}` 
          };
        }
      }
    }

    return { 
      allowed: true, 
      requiresApproval: transition.requiresApproval 
    };
  }

  /**
   * Validate and execute a status transition
   */
  transition(
    entry: Entry,
    toStatus: EntryStatus,
    userId: string,
    userRole: WorkflowRole = this.config.defaultRole ?? "author",
    options?: {
      skipApproval?: boolean;
      notes?: string;
    },
  ): { 
    success: boolean; 
    entry?: Entry; 
    checkpoint?: ApprovalCheckpoint;
    error?: string;
  } {
    const validation = this.canTransition(entry, toStatus, userRole);
    
    if (!validation.allowed) {
      return { success: false, error: validation.reason };
    }

    // If approval is required and not skipped, create checkpoint
    if (validation.requiresApproval && !options?.skipApproval) {
      const checkpoint = this.createCheckpoint(entry.id, entry.status, toStatus, userId);
      return { success: false, checkpoint, error: "Approval required" };
    }

    // Perform the transition
    const fromStatus = entry.status;
    const updatedEntry: Entry = {
      ...entry,
      status: toStatus,
      updatedAt: now(),
    };

    // Update publishedAt if publishing
    if (toStatus === "published" && !entry.publishedAt) {
      updatedEntry.publishedAt = now();
    }

    // Clear scheduledAt if not scheduled
    if (toStatus !== "scheduled") {
      updatedEntry.scheduledAt = null as unknown as string | undefined;
    }

    // Log the action
    this.logAudit({
      entryId: entry.id,
      action: "transition",
      fromStatus,
      toStatus,
      performedBy: userId,
      metadata: { notes: options?.notes },
    });

    return { success: true, entry: updatedEntry };
  }

  // ============================================================================
  // Approval Checkpoints
  // ============================================================================

  /**
   * Create an approval checkpoint for a transition
   */
  createCheckpoint(
    entryId: string,
    fromStatus: EntryStatus,
    toStatus: EntryStatus,
    requestedBy: string,
  ): ApprovalCheckpoint {
    const checkpoint: ApprovalCheckpoint = {
      id: generateId(),
      entryId,
      transition: { from: fromStatus, to: toStatus },
      requestedBy,
      requestedAt: now(),
      status: "pending",
    };

    const validated = validateApprovalCheckpoint(checkpoint);
    this.checkpoints.set(validated.id, validated);

    this.logAudit({
      entryId,
      action: "checkpoint_created",
      performedBy: requestedBy,
      metadata: { fromStatus, toStatus, checkpointId: validated.id },
    });

    return validated;
  }

  /**
   * Approve a pending checkpoint
   */
  approveCheckpoint(
    checkpointId: string,
    approvedBy: string,
    options?: { notes?: string },
  ): { success: boolean; checkpoint?: ApprovalCheckpoint; error?: string } {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return { success: false, error: "Checkpoint not found" };
    }

    if (checkpoint.status !== "pending") {
      return { success: false, error: `Checkpoint is already ${checkpoint.status}` };
    }

    const updated: ApprovalCheckpoint = {
      ...checkpoint,
      status: "approved",
      approvedBy,
      approvedAt: now(),
      notes: options?.notes,
    };

    this.checkpoints.set(checkpointId, updated);

    this.logAudit({
      entryId: checkpoint.entryId,
      action: "checkpoint_approved",
      performedBy: approvedBy,
      metadata: { checkpointId, notes: options?.notes },
    });

    return { success: true, checkpoint: updated };
  }

  /**
   * Reject a pending checkpoint
   */
  rejectCheckpoint(
    checkpointId: string,
    rejectedBy: string,
    reason: string,
    options?: { notes?: string },
  ): { success: boolean; checkpoint?: ApprovalCheckpoint; error?: string } {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return { success: false, error: "Checkpoint not found" };
    }

    if (checkpoint.status !== "pending") {
      return { success: false, error: `Checkpoint is already ${checkpoint.status}` };
    }

    const updated: ApprovalCheckpoint = {
      ...checkpoint,
      status: "rejected",
      rejectedBy,
      rejectedAt: now(),
      rejectionReason: reason,
      notes: options?.notes,
    };

    this.checkpoints.set(checkpointId, updated);

    this.logAudit({
      entryId: checkpoint.entryId,
      action: "checkpoint_rejected",
      performedBy: rejectedBy,
      metadata: { checkpointId, reason, notes: options?.notes },
    });

    return { success: true, checkpoint: updated };
  }

  /**
   * Get checkpoint by ID
   */
  getCheckpoint(id: string): ApprovalCheckpoint | undefined {
    return this.checkpoints.get(id);
  }

  /**
   * Get all checkpoints for an entry
   */
  getEntryCheckpoints(entryId: string): ApprovalCheckpoint[] {
    return Array.from(this.checkpoints.values())
      .filter(cp => cp.entryId === entryId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  /**
   * Get pending checkpoints
   */
  getPendingCheckpoints(): ApprovalCheckpoint[] {
    return Array.from(this.checkpoints.values())
      .filter(cp => cp.status === "pending")
      .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
  }

  // ============================================================================
  // Scheduling
  // ============================================================================

  /**
   * Schedule an action for an entry
   */
  scheduleAction(
    entryId: string,
    action: "publish" | "unpublish" | "archive",
    scheduledAt: string,
    createdBy: string,
  ): ScheduledAction {
    const scheduledAction: ScheduledAction = {
      id: generateId(),
      entryId,
      action,
      scheduledAt,
      executed: false,
      createdBy,
      createdAt: now(),
    };

    this.scheduledActions.set(scheduledAction.id, scheduledAction);

    this.logAudit({
      entryId,
      action: "scheduled",
      performedBy: createdBy,
      metadata: { action, scheduledAt, scheduledActionId: scheduledAction.id },
    });

    return scheduledAction;
  }

  /**
   * Cancel a scheduled action
   */
  cancelScheduledAction(id: string, cancelledBy: string): { success: boolean; error?: string } {
    const action = this.scheduledActions.get(id);
    if (!action) {
      return { success: false, error: "Scheduled action not found" };
    }

    if (action.executed) {
      return { success: false, error: "Cannot cancel already executed action" };
    }

    this.scheduledActions.delete(id);

    this.logAudit({
      entryId: action.entryId,
      action: "schedule_cancelled",
      performedBy: cancelledBy,
      metadata: { scheduledActionId: id },
    });

    return { success: true };
  }

  /**
   * Get pending scheduled actions
   */
  getPendingScheduledActions(): ScheduledAction[] {
    return Array.from(this.scheduledActions.values())
      .filter(sa => !sa.executed)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  /**
   * Get scheduled actions for an entry
   */
  getEntryScheduledActions(entryId: string): ScheduledAction[] {
    return Array.from(this.scheduledActions.values())
      .filter(sa => sa.entryId === entryId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Execute pending scheduled actions that are due
   */
  executeDueActions(currentTime: string = now()): Array<{ action: ScheduledAction; result: { success: boolean; error?: string } }> {
    const dueActions = this.getPendingScheduledActions().filter(
      sa => new Date(sa.scheduledAt) <= new Date(currentTime),
    );

    const results: Array<{ action: ScheduledAction; result: { success: boolean; error?: string } }> = [];

    for (const action of dueActions) {
      // Mark as executed
      const executed: ScheduledAction = {
        ...action,
        executed: true,
        executedAt: now(),
      };
      this.scheduledActions.set(action.id, executed);

      this.logAudit({
        entryId: action.entryId,
        action: "schedule_executed",
        performedBy: "system",
        metadata: { scheduledActionId: action.id, action: action.action },
      });

      results.push({ action: executed, result: { success: true } });
    }

    return results;
  }

  // ============================================================================
  // Permission Management
  // ============================================================================

  /**
   * Set custom permission for a role
   */
  setPermission(role: WorkflowRole, permission: Partial<WorkflowPermission>): void {
    const existing = this.permissions.get(role) ?? DEFAULT_PERMISSIONS[role];
    this.permissions.set(role, { ...existing, ...permission, role });
  }

  /**
   * Get permission for a role
   */
  getPermission(role: WorkflowRole): WorkflowPermission {
    return this.permissions.get(role) ?? DEFAULT_PERMISSIONS[role];
  }

  /**
   * Check if a role has a specific permission
   */
  hasPermission(
    role: WorkflowRole,
    permission: keyof Omit<WorkflowPermission, "role" | "allowedTransitions">,
  ): boolean {
    const perm = this.getPermission(role);
    return perm[permission] === true;
  }

  // ============================================================================
  // Audit Logging
  // ============================================================================

  /**
   * Get audit logs for an entry
   */
  getEntryAuditLogs(entryId: string): WorkflowAuditLog[] {
    return this.auditLogs
      .filter(log => log.entryId === entryId)
      .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
  }

  /**
   * Get all audit logs with optional filtering
   */
  getAuditLogs(filter?: { 
    entryId?: string; 
    action?: string; 
    performedBy?: string;
    from?: string;
    to?: string;
  }): WorkflowAuditLog[] {
    let logs = [...this.auditLogs];

    if (filter?.entryId) {
      logs = logs.filter(l => l.entryId === filter.entryId);
    }
    if (filter?.action) {
      logs = logs.filter(l => l.action === filter.action);
    }
    if (filter?.performedBy) {
      logs = logs.filter(l => l.performedBy === filter.performedBy);
    }
    if (filter?.from) {
      logs = logs.filter(l => new Date(l.performedAt) >= new Date(filter.from!));
    }
    if (filter?.to) {
      logs = logs.filter(l => new Date(l.performedAt) <= new Date(filter.to!));
    }

    return logs.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
  }

  // ============================================================================
  // Workflow Guards
  // ============================================================================

  /**
   * Check if entry has SEO metadata issues
   */
  checkSEOGaps(entry: Entry): {
    hasTitle: boolean;
    hasDescription: boolean;
    titleLength: number;
    descriptionLength: number;
    issues: string[];
    score: number; // 0-100
  } {
    const issues: string[] = [];
    const meta = entry.metadata;
    const title = meta?.seoTitle || entry.title;
    const description = meta?.seoDescription;

    // Check title
    const hasTitle = !!title && title.trim().length > 0;
    const titleLength = title?.length ?? 0;
    if (!hasTitle) {
      issues.push("Missing SEO title");
    } else if (titleLength < 30) {
      issues.push("SEO title is too short (recommended: 30-60 characters)");
    } else if (titleLength > 60) {
      issues.push("SEO title is too long (recommended: 30-60 characters)");
    }

    // Check description
    const hasDescription = !!description && description.trim().length > 0;
    const descriptionLength = description?.length ?? 0;
    if (!hasDescription) {
      issues.push("Missing SEO description");
    } else if (descriptionLength < 50) {
      issues.push("SEO description is too short (recommended: 50-160 characters)");
    } else if (descriptionLength > 160) {
      issues.push("SEO description is too long (recommended: 50-160 characters)");
    }

    // Check slug
    if (!entry.slug || entry.slug.length < 3) {
      issues.push("Slug is too short or missing");
    }

    // Calculate score
    let score = 100;
    if (!hasTitle) score -= 30;
    if (!hasDescription) score -= 30;
    if (titleLength < 30 || titleLength > 60) score -= 10;
    if (descriptionLength < 50 || descriptionLength > 160) score -= 10;
    if (!entry.slug || entry.slug.length < 3) score -= 10;

    return {
      hasTitle,
      hasDescription,
      titleLength,
      descriptionLength,
      issues,
      score: Math.max(0, score),
    };
  }

  /**
   * Validate entry has minimum SEO requirements for publishing
   */
  validateSEOMinimum(entry: Entry): { valid: boolean; errors: string[] } {
    const check = this.checkSEOGaps(entry);
    const errors = [...check.issues];

    // Minimum requirements for publishing
    if (!check.hasTitle) {
      errors.push("SEO title is required for publishing");
    }
    if (!check.hasDescription) {
      errors.push("SEO description is required for publishing");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check blocks for media accessibility issues
   */
  checkMediaAccessibility(blocks?: unknown[]): {
    imagesWithoutAlt: number;
    imagesTotal: number;
    issues: string[];
    hasAccessibilityIssues: boolean;
  } {
    const issues: string[] = [];
    let imagesWithoutAlt = 0;
    let imagesTotal = 0;

    if (!blocks || !Array.isArray(blocks)) {
      return { imagesWithoutAlt: 0, imagesTotal: 0, issues: [], hasAccessibilityIssues: false };
    }

    for (const block of blocks) {
      if (typeof block !== "object" || block === null) continue;
      const b = block as Record<string, unknown>;
      
      // Check image blocks
      if (b.type === "image") {
        imagesTotal++;
        const data = b.data as Record<string, unknown> | undefined;
        if (!data?.alt || String(data.alt).trim() === "") {
          imagesWithoutAlt++;
        }
      }
    }

    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} image(s) missing alt text`);
    }

    return {
      imagesWithoutAlt,
      imagesTotal,
      issues,
      hasAccessibilityIssues: imagesWithoutAlt > 0,
    };
  }

  /**
   * Run full pre-publish validation
   */
  validateForPublish(entry: Entry): {
    canPublish: boolean;
    seo: { valid: boolean; errors: string[]; score: number };
    media: { valid: boolean; errors: string[]; imagesWithoutAlt: number };
    allErrors: string[];
  } {
    const seoCheck = this.validateSEOMinimum(entry);
    const seoGaps = this.checkSEOGaps(entry);
    const mediaCheck = this.checkMediaAccessibility(entry.blocks);

    const allErrors = [...seoCheck.errors, ...mediaCheck.issues];

    return {
      canPublish: seoCheck.valid && !mediaCheck.hasAccessibilityIssues,
      seo: {
        valid: seoCheck.valid,
        errors: seoCheck.errors,
        score: seoGaps.score,
      },
      media: {
        valid: !mediaCheck.hasAccessibilityIssues,
        errors: mediaCheck.issues,
        imagesWithoutAlt: mediaCheck.imagesWithoutAlt,
      },
      allErrors,
    };
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private findTransition(fromStatus: EntryStatus, toStatus: EntryStatus): WorkflowTransition | undefined {
    return this.transitions.find(t => {
      const fromStatuses = Array.isArray(t.from) ? t.from : [t.from];
      return fromStatuses.includes(fromStatus) && t.to === toStatus;
    });
  }

  private evaluateCondition(entry: Entry, condition: WorkflowCondition): boolean {
    switch (condition.type) {
      case "fieldPresent": {
        if (!condition.fieldId) return false;
        return entry.fieldValues.some(fv => fv.fieldId === condition.fieldId && fv.value != null);
      }
      
      case "fieldValue": {
        if (!condition.fieldId) return false;
        const fv = entry.fieldValues.find(fv => fv.fieldId === condition.fieldId);
        return fv?.value === condition.value;
      }
      
      case "custom": {
        // Custom validation would require function execution
        // For now, return true to allow transition
        return true;
      }
      
      default:
        return true;
    }
  }

  private logAudit(log: Omit<WorkflowAuditLog, "id" | "performedAt">): void {
    const auditLog: WorkflowAuditLog = {
      ...log,
      id: generateId(),
      performedAt: now(),
    };
    this.auditLogs.push(auditLog);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createWorkflowEngine(config?: WorkflowConfig): WorkflowEngine {
  return new WorkflowEngine(config);
}

export function createWorkflowTransition(
  from: EntryStatus | EntryStatus[],
  to: EntryStatus,
  options?: Partial<Omit<WorkflowTransition, "from" | "to">>,
): WorkflowTransition {
  return {
    from,
    to,
    requiresApproval: false,
    allowedRoles: ["author", "editor", "admin"],
    ...options,
  };
}
