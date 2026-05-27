// No external type imports needed

export type CommentStatus = "active" | "resolved" | "rejected" | "deleted";
export type SuggestionStatus = "pending" | "accepted" | "rejected" | "applied";
export type CommentType = "comment" | "suggestion" | "review";

export interface CommentRange {
  blockId: string;
  startOffset?: number;
  endOffset?: number;
}

export interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string;
}

export interface CommentReply {
  id: string;
  author: CommentAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  type: CommentType;
  author: CommentAuthor;
  content: string;
  range?: CommentRange;
  status: CommentStatus;
  replies: CommentReply[];
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SuggestionChange {
  blockId: string;
  property: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface Suggestion {
  id: string;
  type: "suggestion";
  author: CommentAuthor;
  commentId: string;
  description: string;
  changes: SuggestionChange[];
  status: SuggestionStatus;
  appliedAt?: string;
  appliedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentThread {
  id: string;
  comment: Comment;
  suggestions: Suggestion[];
  lastActivityAt: string;
}

export interface CommentFilterOptions {
  status?: CommentStatus[];
  type?: CommentType[];
  authorId?: string;
  blockId?: string;
  since?: string;
  until?: string;
}

export class CommentSystem {
  private comments = new Map<string, Comment>();
  private suggestions = new Map<string, Suggestion>();
  private blockComments = new Map<string, Set<string>>();

  addComment(comment: Omit<Comment, "id" | "createdAt" | "updatedAt" | "replies" | "status">): Comment {
    const timestamp = new Date().toISOString();
    const id = this.generateId("comment");

    const fullComment: Comment = {
      ...comment,
      id,
      replies: [],
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.comments.set(id, fullComment);

    if (comment.range?.blockId) {
      if (!this.blockComments.has(comment.range.blockId)) {
        this.blockComments.set(comment.range.blockId, new Set());
      }
      this.blockComments.get(comment.range.blockId)!.add(id);
    }

    return fullComment;
  }

  addReply(commentId: string, reply: Omit<CommentReply, "id" | "createdAt" | "updatedAt">): CommentReply | null {
    const comment = this.comments.get(commentId);
    if (!comment) return null;

    const timestamp = new Date().toISOString();
    const id = this.generateId("reply");

    const fullReply: CommentReply = {
      ...reply,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    comment.replies.push(fullReply);
    comment.updatedAt = timestamp;

    return fullReply;
  }

  updateComment(commentId: string, content: string): Comment | null {
    const comment = this.comments.get(commentId);
    if (!comment || comment.status === "deleted") return null;

    comment.content = content;
    comment.updatedAt = new Date().toISOString();

    return comment;
  }

  resolveComment(commentId: string, resolvedBy: string): Comment | null {
    const comment = this.comments.get(commentId);
    if (!comment || comment.status === "deleted") return null;

    const timestamp = new Date().toISOString();
    comment.status = "resolved";
    comment.resolvedAt = timestamp;
    comment.resolvedBy = resolvedBy;
    comment.updatedAt = timestamp;

    return comment;
  }

  rejectComment(commentId: string): Comment | null {
    const comment = this.comments.get(commentId);
    if (!comment || comment.status === "deleted") return null;

    comment.status = "rejected";
    comment.updatedAt = new Date().toISOString();

    return comment;
  }

  reopenComment(commentId: string): Comment | null {
    const comment = this.comments.get(commentId);
    if (!comment || comment.status === "deleted") return null;

    comment.status = "active";
    comment.resolvedAt = undefined;
    comment.resolvedBy = undefined;
    comment.updatedAt = new Date().toISOString();

    return comment;
  }

  deleteComment(commentId: string): boolean {
    const comment = this.comments.get(commentId);
    if (!comment) return false;

    comment.status = "deleted";
    comment.updatedAt = new Date().toISOString();

    if (comment.range?.blockId) {
      this.blockComments.get(comment.range.blockId)?.delete(commentId);
    }

    return true;
  }

  createSuggestion(
    commentId: string,
    suggestion: Omit<Suggestion, "id" | "commentId" | "createdAt" | "updatedAt" | "status" | "type">,
  ): Suggestion | null {
    const comment = this.comments.get(commentId);
    if (!comment) return null;

    const timestamp = new Date().toISOString();
    const id = this.generateId("suggestion");

    const fullSuggestion: Suggestion = {
      ...suggestion,
      id,
      commentId,
      type: "suggestion",
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.suggestions.set(id, fullSuggestion);

    return fullSuggestion;
  }

  acceptSuggestion(suggestionId: string): Suggestion | null {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion || suggestion.status !== "pending") return null;

    suggestion.status = "accepted";
    suggestion.updatedAt = new Date().toISOString();

    return suggestion;
  }

  applySuggestion(suggestionId: string, appliedBy: string): Suggestion | null {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion || suggestion.status !== "accepted") return null;

    const timestamp = new Date().toISOString();
    suggestion.status = "applied";
    suggestion.appliedAt = timestamp;
    suggestion.appliedBy = appliedBy;
    suggestion.updatedAt = timestamp;

    return suggestion;
  }

  rejectSuggestion(suggestionId: string): Suggestion | null {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion || suggestion.status !== "pending") return null;

    suggestion.status = "rejected";
    suggestion.updatedAt = new Date().toISOString();

    return suggestion;
  }

  getComment(commentId: string): Comment | undefined {
    return this.comments.get(commentId);
  }

  getSuggestion(suggestionId: string): Suggestion | undefined {
    return this.suggestions.get(suggestionId);
  }

  getCommentsForBlock(blockId: string): Comment[] {
    const commentIds = this.blockComments.get(blockId);
    if (!commentIds) return [];

    return [...commentIds]
      .map((id) => this.comments.get(id))
      .filter((c): c is Comment => c !== undefined && c.status !== "deleted");
  }

  getThreads(options: CommentFilterOptions = {}): CommentThread[] {
    const threads: CommentThread[] = [];

    for (const comment of this.comments.values()) {
      if (comment.status === "deleted") continue;

      if (options.status && !options.status.includes(comment.status)) continue;
      if (options.type && !options.type.includes(comment.type)) continue;
      if (options.authorId && comment.author.id !== options.authorId) continue;
      if (options.blockId && comment.range?.blockId !== options.blockId) continue;
      if (options.since && comment.createdAt < options.since) continue;
      if (options.until && comment.createdAt > options.until) continue;

      const suggestions = this.getSuggestionsForComment(comment.id);

      threads.push({
        id: comment.id,
        comment,
        suggestions,
        lastActivityAt: this.getLastActivityTime(comment),
      });
    }

    threads.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));

    return threads;
  }

  getStats(): {
    total: number;
    active: number;
    resolved: number;
    rejected: number;
    suggestions: {
      total: number;
      pending: number;
      accepted: number;
      applied: number;
      rejected: number;
    };
  } {
    let active = 0;
    let resolved = 0;
    let rejected = 0;

    for (const comment of this.comments.values()) {
      if (comment.status === "active") active++;
      else if (comment.status === "resolved") resolved++;
      else if (comment.status === "rejected") rejected++;
    }

    let pending = 0;
    let accepted = 0;
    let applied = 0;
    let sRejected = 0;

    for (const suggestion of this.suggestions.values()) {
      if (suggestion.status === "pending") pending++;
      else if (suggestion.status === "accepted") accepted++;
      else if (suggestion.status === "applied") applied++;
      else if (suggestion.status === "rejected") sRejected++;
    }

    return {
      total: active + resolved + rejected,
      active,
      resolved,
      rejected,
      suggestions: {
        total: pending + accepted + applied + sRejected,
        pending,
        accepted,
        applied,
        rejected: sRejected,
      },
    };
  }

  export(): {
    comments: Comment[];
    suggestions: Suggestion[];
  } {
    return {
      comments: [...this.comments.values()],
      suggestions: [...this.suggestions.values()],
    };
  }

  import(data: { comments: Comment[]; suggestions: Suggestion[] }): void {
    for (const comment of data.comments) {
      this.comments.set(comment.id, comment);
      if (comment.range?.blockId && comment.status !== "deleted") {
        if (!this.blockComments.has(comment.range.blockId)) {
          this.blockComments.set(comment.range.blockId, new Set());
        }
        this.blockComments.get(comment.range.blockId)!.add(comment.id);
      }
    }

    for (const suggestion of data.suggestions) {
      this.suggestions.set(suggestion.id, suggestion);
    }
  }

  clear(): void {
    this.comments.clear();
    this.suggestions.clear();
    this.blockComments.clear();
  }

  private getSuggestionsForComment(commentId: string): Suggestion[] {
    const result: Suggestion[] = [];
    for (const suggestion of this.suggestions.values()) {
      if (suggestion.commentId === commentId) {
        result.push(suggestion);
      }
    }
    return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  private getLastActivityTime(comment: Comment): string {
    let lastTime = comment.updatedAt;

    for (const reply of comment.replies) {
      if (reply.updatedAt > lastTime) {
        lastTime = reply.updatedAt;
      }
    }

    return lastTime;
  }

  private generateId(prefix: string): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }
}

export function createCommentSystem(): CommentSystem {
  return new CommentSystem();
}
