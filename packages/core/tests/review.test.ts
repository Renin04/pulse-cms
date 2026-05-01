import { describe, expect, it, beforeEach } from "vitest";
import {
  createCommentSystem,
  createRevisionHistory,
  type CommentAuthor,
  type RevisionAuthor,
} from "../src/review";
import type { Block } from "../src/types/block";

describe("PM4-5: Review & Revision - Comment System", () => {
  let commentSystem: ReturnType<typeof createCommentSystem>;
  const author: CommentAuthor = { id: "user1", name: "Test User" };

  beforeEach(() => {
    commentSystem = createCommentSystem();
  });

  it("adds a comment", () => {
    const comment = commentSystem.addComment({
      type: "comment",
      author,
      content: "This is a test comment",
      range: { blockId: "block1" },
      mentions: [],
    });

    expect(comment.id).toBeDefined();
    expect(comment.content).toBe("This is a test comment");
    expect(comment.status).toBe("active");
    expect(comment.replies).toHaveLength(0);
  });

  it("adds a reply to a comment", () => {
    const comment = commentSystem.addComment({
      type: "comment",
      author,
      content: "Parent comment",
      mentions: [],
    });

    const reply = commentSystem.addReply(comment.id, {
      author,
      content: "Reply to comment",
    });

    expect(reply).not.toBeNull();
    expect(reply?.content).toBe("Reply to comment");

    const updatedComment = commentSystem.getComment(comment.id);
    expect(updatedComment?.replies).toHaveLength(1);
  });

  it("resolves a comment", () => {
    const comment = commentSystem.addComment({
      type: "comment",
      author,
      content: "Comment to resolve",
      mentions: [],
    });

    const resolved = commentSystem.resolveComment(comment.id, "user2");

    expect(resolved?.status).toBe("resolved");
    expect(resolved?.resolvedBy).toBe("user2");
    expect(resolved?.resolvedAt).toBeDefined();
  });

  it("deletes a comment (soft delete)", () => {
    const comment = commentSystem.addComment({
      type: "comment",
      author,
      content: "Comment to delete",
      mentions: [],
    });

    const deleted = commentSystem.deleteComment(comment.id);

    expect(deleted).toBe(true);

    const retrieved = commentSystem.getComment(comment.id);
    expect(retrieved?.status).toBe("deleted");
  });

  it("creates and accepts a suggestion", () => {
    const comment = commentSystem.addComment({
      type: "suggestion",
      author,
      content: "Suggestion comment",
      mentions: [],
    });

    const suggestion = commentSystem.createSuggestion(comment.id, {
      author,
      description: "Change text color",
      changes: [
        {
          blockId: "block1",
          property: "color",
          oldValue: "black",
          newValue: "blue",
        },
      ],
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion?.status).toBe("pending");

    const accepted = commentSystem.acceptSuggestion(suggestion!.id);
    expect(accepted?.status).toBe("accepted");

    const applied = commentSystem.applySuggestion(suggestion!.id, "user2");
    expect(applied?.status).toBe("applied");
  });

  it("gets comments for a block", () => {
    commentSystem.addComment({
      type: "comment",
      author,
      content: "Comment on block1",
      range: { blockId: "block1" },
      mentions: [],
    });

    commentSystem.addComment({
      type: "comment",
      author,
      content: "Comment on block2",
      range: { blockId: "block2" },
      mentions: [],
    });

    const block1Comments = commentSystem.getCommentsForBlock("block1");
    expect(block1Comments).toHaveLength(1);
    expect(block1Comments[0].content).toBe("Comment on block1");
  });

  it("gets threads with filters", () => {
    commentSystem.addComment({
      type: "comment",
      author,
      content: "Active comment",
      mentions: [],
    });

    const resolvedComment = commentSystem.addComment({
      type: "comment",
      author,
      content: "Resolved comment",
      mentions: [],
    });
    commentSystem.resolveComment(resolvedComment.id, "user2");

    const activeThreads = commentSystem.getThreads({ status: ["active"] });
    expect(activeThreads).toHaveLength(1);

    const resolvedThreads = commentSystem.getThreads({ status: ["resolved"] });
    expect(resolvedThreads).toHaveLength(1);
  });

  it("returns comment statistics", () => {
    commentSystem.addComment({ type: "comment", author, content: "Comment 1", mentions: [] });
    commentSystem.addComment({ type: "comment", author, content: "Comment 2", mentions: [] });
    const c3 = commentSystem.addComment({ type: "comment", author, content: "Comment 3", mentions: [] });
    commentSystem.resolveComment(c3.id, "user2");

    const stats = commentSystem.getStats();
    expect(stats.total).toBe(3);
    expect(stats.active).toBe(2);
    expect(stats.resolved).toBe(1);
  });

  it("exports and imports comments", () => {
    const comment = commentSystem.addComment({
      type: "comment",
      author,
      content: "Export test",
      mentions: [],
    });

    const exported = commentSystem.export();
    expect(exported.comments).toHaveLength(1);

    const newSystem = createCommentSystem();
    newSystem.import(exported);

    expect(newSystem.getComment(comment.id)).toBeDefined();
  });
});

describe("PM4-5: Review & Revision - Revision History", () => {
  let revisionHistory: ReturnType<typeof createRevisionHistory>;
  const author: RevisionAuthor = { id: "user1", name: "Test User" };

  beforeEach(() => {
    revisionHistory = createRevisionHistory();
  });

  it("creates a revision", () => {
    const blocksBefore: Block[] = [];
    const blocksAfter: Block[] = [
      {
        id: "block1",
        type: "text",
        data: { text: "Hello" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const revision = revisionHistory.createRevision(
      "doc1",
      author,
      "Initial content",
      blocksBefore,
      blocksAfter,
    );

    expect(revision.id).toBeDefined();
    expect(revision.documentId).toBe("doc1");
    expect(revision.summary).toBe("Initial content");
    expect(revision.changes).toHaveLength(1);
    expect(revision.changes[0].type).toBe("insert");
  });

  it("computes changes between revisions", () => {
    const blocks1: Block[] = [
      {
        id: "block1",
        type: "text",
        data: { text: "Hello" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const blocks2: Block[] = [
      {
        id: "block1",
        type: "text",
        data: { text: "Hello World" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const revision = revisionHistory.createRevision("doc1", author, "Update text", blocks1, blocks2);

    expect(revision.changes).toHaveLength(1);
    expect(revision.changes[0].type).toBe("update");
    expect(revision.changes[0].blockId).toBe("block1");
  });

  it("gets document revisions", () => {
    const blocks: Block[] = [];

    revisionHistory.createRevision("doc1", author, "Revision 1", blocks, blocks);
    revisionHistory.createRevision("doc1", author, "Revision 2", blocks, blocks);
    revisionHistory.createRevision("doc2", author, "Other doc", blocks, blocks);

    const doc1Revisions = revisionHistory.getDocumentRevisions("doc1");
    expect(doc1Revisions).toHaveLength(2);
  });

  it("compares two revisions", () => {
    const blocks1: Block[] = [
      {
        id: "block1",
        type: "text",
        data: { text: "Version 1" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const blocks2: Block[] = [
      {
        id: "block1",
        type: "text",
        data: { text: "Version 2" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "block2",
        type: "text",
        data: { text: "New block" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const rev1 = revisionHistory.createRevision("doc1", author, "First", [], blocks1);
    const rev2 = revisionHistory.createRevision("doc1", author, "Second", blocks1, blocks2);

    const diff = revisionHistory.compareRevisions(rev1.id, rev2.id);

    expect(diff.added).toHaveLength(1);
    expect(diff.modified).toHaveLength(1);
  });

  it("restores a revision", () => {
    const blocks: Block[] = [
      {
        id: "block1",
        type: "text",
        data: { text: "Original" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const revision = revisionHistory.createRevision("doc1", author, "Save", [], blocks);
    const restored = revisionHistory.restoreRevision(revision.id);

    expect(restored).toHaveLength(1);
    expect((restored![0].data as { text: string }).text).toBe("Original");
  });

  it("gets revision statistics", () => {
    const blocks: Block[] = [];

    revisionHistory.createRevision("doc1", { id: "user1", name: "User 1" }, "Rev 1", blocks, blocks);
    revisionHistory.createRevision("doc1", { id: "user2", name: "User 2" }, "Rev 2", blocks, blocks);

    const stats = revisionHistory.getStats("doc1");
    expect(stats.total).toBe(2);
    expect(stats.authors).toHaveLength(2);
    expect(stats.authors).toContain("user1");
    expect(stats.authors).toContain("user2");
  });

  it("filters revisions by author", () => {
    const blocks: Block[] = [];

    revisionHistory.createRevision("doc1", { id: "user1", name: "User 1" }, "Rev 1", blocks, blocks);
    revisionHistory.createRevision("doc1", { id: "user2", name: "User 2" }, "Rev 2", blocks, blocks);

    const user1Revisions = revisionHistory.getDocumentRevisions("doc1", { authorId: "user1" });
    expect(user1Revisions).toHaveLength(1);
    expect(user1Revisions[0].author.id).toBe("user1");
  });

  it("exports and imports revisions", () => {
    const blocks: Block[] = [];

    revisionHistory.createRevision("doc1", author, "Export test", blocks, blocks);

    const exported = revisionHistory.export("doc1");
    expect(exported).toHaveLength(1);

    const newHistory = createRevisionHistory();
    newHistory.import(exported);

    expect(newHistory.getDocumentRevisions("doc1")).toHaveLength(1);
  });
});
