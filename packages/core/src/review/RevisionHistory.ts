import type { Block, BlockData } from "../types/block";

export interface RevisionChange {
  type: "insert" | "delete" | "update" | "move";
  blockId: string;
  property?: string;
  oldValue?: unknown;
  newValue?: unknown;
  blockType?: string;
}

export interface RevisionAuthor {
  id: string;
  name: string;
}

export interface Revision<TBlock extends Block<BlockData> = Block<BlockData>> {
  id: string;
  documentId: string;
  author: RevisionAuthor;
  summary: string;
  changes: RevisionChange[];
  blocksBefore: TBlock[];
  blocksAfter: TBlock[];
  createdAt: string;
  parentRevisionId?: string;
  tags?: string[];
}

export interface DiffResult {
  added: Block[];
  removed: Block[];
  modified: Array<{
    block: Block;
    changes: Array<{
      property: string;
      oldValue: unknown;
      newValue: unknown;
    }>;
  }>;
  unchanged: Block[];
}

export interface RevisionFilterOptions {
  authorId?: string;
  since?: string;
  until?: string;
  tags?: string[];
}

export class RevisionHistory<TBlock extends Block<BlockData> = Block<BlockData>> {
  private revisions = new Map<string, Revision<TBlock>>();
  private documentRevisions = new Map<string, string[]>();
  private maxRevisionsPerDocument = 100;

  /**
   * Create a new revision.
   */
  createRevision(
    documentId: string,
    author: RevisionAuthor,
    summary: string,
    blocksBefore: TBlock[],
    blocksAfter: TBlock[],
    options: { parentRevisionId?: string; tags?: string[] } = {},
  ): Revision<TBlock> {
    const id = this.generateId();
    const timestamp = new Date().toISOString();

    const changes = this.computeChanges(blocksBefore, blocksAfter);

    const revision: Revision<TBlock> = {
      id,
      documentId,
      author,
      summary,
      changes,
      blocksBefore,
      blocksAfter,
      createdAt: timestamp,
      parentRevisionId: options.parentRevisionId,
      tags: options.tags,
    };

    this.revisions.set(id, revision);

    // Index by document
    if (!this.documentRevisions.has(documentId)) {
      this.documentRevisions.set(documentId, []);
    }
    this.documentRevisions.get(documentId)!.unshift(id);

    // Prune old revisions if needed
    this.pruneOldRevisions(documentId);

    return revision;
  }

  /**
   * Get a revision by ID.
   */
  getRevision(revisionId: string): Revision<TBlock> | undefined {
    return this.revisions.get(revisionId);
  }

  /**
   * Get all revisions for a document.
   */
  getDocumentRevisions(
    documentId: string,
    options: RevisionFilterOptions = {},
  ): Revision<TBlock>[] {
    const revisionIds = this.documentRevisions.get(documentId) ?? [];

    let revisions = revisionIds
      .map((id) => this.revisions.get(id))
      .filter((r): r is Revision<TBlock> => r !== undefined);

    if (options.authorId) {
      revisions = revisions.filter((r) => r.author.id === options.authorId);
    }
    if (options.since) {
      revisions = revisions.filter((r) => r.createdAt >= options.since!);
    }
    if (options.until) {
      revisions = revisions.filter((r) => r.createdAt <= options.until!);
    }
    if (options.tags && options.tags.length > 0) {
      revisions = revisions.filter((r) =>
        options.tags!.some((tag) => r.tags?.includes(tag)),
      );
    }

    return revisions;
  }

  /**
   * Get the timeline (revisions in chronological order).
   */
  getTimeline(documentId: string): Revision<TBlock>[] {
    return this.getDocumentRevisions(documentId).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }

  /**
   * Compare two revisions and return the diff.
   */
  compareRevisions(fromRevisionId: string, toRevisionId: string): DiffResult {
    const fromRevision = this.revisions.get(fromRevisionId);
    const toRevision = this.revisions.get(toRevisionId);

    if (!fromRevision || !toRevision) {
      throw new Error("One or both revisions not found");
    }

    return this.computeDiff(fromRevision.blocksAfter, toRevision.blocksAfter);
  }

  /**
   * Restore a document to a specific revision.
   */
  restoreRevision(revisionId: string): TBlock[] | null {
    const revision = this.revisions.get(revisionId);
    if (!revision) return null;

    return JSON.parse(JSON.stringify(revision.blocksAfter));
  }

  /**
   * Get the latest revision for a document.
   */
  getLatestRevision(documentId: string): Revision<TBlock> | undefined {
    const revisionIds = this.documentRevisions.get(documentId);
    if (!revisionIds || revisionIds.length === 0) return undefined;

    return this.revisions.get(revisionIds[0]);
  }

  /**
   * Get revision statistics.
   */
  getStats(documentId: string): {
    total: number;
    authors: string[];
    firstRevision: string | null;
    lastRevision: string | null;
  } {
    const revisions = this.getDocumentRevisions(documentId);
    const authors = new Set(revisions.map((r) => r.author.id));

    return {
      total: revisions.length,
      authors: [...authors],
      firstRevision: revisions[revisions.length - 1]?.createdAt ?? null,
      lastRevision: revisions[0]?.createdAt ?? null,
    };
  }

  /**
   * Export all revisions for a document.
   */
  export(documentId: string): Revision<TBlock>[] {
    return this.getDocumentRevisions(documentId);
  }

  /**
   * Import revisions.
   */
  import(revisions: Revision<TBlock>[]): void {
    for (const revision of revisions) {
      this.revisions.set(revision.id, revision);

      if (!this.documentRevisions.has(revision.documentId)) {
        this.documentRevisions.set(revision.documentId, []);
      }
      this.documentRevisions.get(revision.documentId)!.push(revision.id);
    }

    // Sort by date
    for (const [docId, ids] of this.documentRevisions.entries()) {
      ids.sort((a, b) => {
        const revA = this.revisions.get(a);
        const revB = this.revisions.get(b);
        if (!revA || !revB) return 0;
        return revB.createdAt.localeCompare(revA.createdAt);
      });
      this.documentRevisions.set(docId, ids);
    }
  }

  /**
   * Delete a revision.
   */
  deleteRevision(revisionId: string): boolean {
    const revision = this.revisions.get(revisionId);
    if (!revision) return false;

    this.revisions.delete(revisionId);

    const docRevisions = this.documentRevisions.get(revision.documentId);
    if (docRevisions) {
      const index = docRevisions.indexOf(revisionId);
      if (index >= 0) {
        docRevisions.splice(index, 1);
      }
    }

    return true;
  }

  /**
   * Clear all revisions for a document.
   */
  clearDocument(documentId: string): void {
    const revisionIds = this.documentRevisions.get(documentId) ?? [];
    for (const id of revisionIds) {
      this.revisions.delete(id);
    }
    this.documentRevisions.delete(documentId);
  }

  private computeChanges(before: TBlock[], after: TBlock[]): RevisionChange[] {
    const changes: RevisionChange[] = [];
    const beforeMap = new Map(before.map((b) => [b.id, b]));
    const afterMap = new Map(after.map((b) => [b.id, b]));

    // Find deleted blocks
    for (const block of before) {
      if (!afterMap.has(block.id)) {
        changes.push({
          type: "delete",
          blockId: block.id,
          blockType: block.type,
          oldValue: block.data,
        });
      }
    }

    // Find added and updated blocks
    for (const block of after) {
      const oldBlock = beforeMap.get(block.id);
      if (!oldBlock) {
        changes.push({
          type: "insert",
          blockId: block.id,
          blockType: block.type,
          newValue: block.data,
        });
      } else if (JSON.stringify(oldBlock.data) !== JSON.stringify(block.data)) {
        changes.push({
          type: "update",
          blockId: block.id,
          blockType: block.type,
          oldValue: oldBlock.data,
          newValue: block.data,
        });
      }
    }

    // Detect moves (simplified - just check if order changed)
    const beforeOrder = before.map((b) => b.id);
    const afterOrder = after.map((b) => b.id);
    const commonIds = beforeOrder.filter((id) => afterOrder.includes(id));

    for (let i = 0; i < commonIds.length; i++) {
      const id = commonIds[i];
      const beforeIndex = beforeOrder.indexOf(id);
      const afterIndex = afterOrder.indexOf(id);

      if (beforeIndex !== afterIndex) {
        changes.push({
          type: "move",
          blockId: id,
        });
      }
    }

    return changes;
  }

  private computeDiff(before: TBlock[], after: TBlock[]): DiffResult {
    const result: DiffResult = {
      added: [],
      removed: [],
      modified: [],
      unchanged: [],
    };

    const beforeMap = new Map(before.map((b) => [b.id, b]));
    const afterMap = new Map(after.map((b) => [b.id, b]));

    for (const block of before) {
      if (!afterMap.has(block.id)) {
        result.removed.push(block);
      }
    }

    for (const block of after) {
      const oldBlock = beforeMap.get(block.id);
      if (!oldBlock) {
        result.added.push(block);
      } else if (JSON.stringify(oldBlock.data) !== JSON.stringify(block.data)) {
        const propertyChanges: Array<{ property: string; oldValue: unknown; newValue: unknown }> = [];

        // Compare data properties
        const allKeys = new Set([...Object.keys(oldBlock.data), ...Object.keys(block.data)]);
        for (const key of allKeys) {
          const oldVal = oldBlock.data[key];
          const newVal = block.data[key];
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            propertyChanges.push({
              property: key,
              oldValue: oldVal,
              newValue: newVal,
            });
          }
        }

        result.modified.push({
          block,
          changes: propertyChanges,
        });
      } else {
        result.unchanged.push(block);
      }
    }

    return result;
  }

  private pruneOldRevisions(documentId: string): void {
    const revisionIds = this.documentRevisions.get(documentId);
    if (!revisionIds || revisionIds.length <= this.maxRevisionsPerDocument) return;

    const toRemove = revisionIds.slice(this.maxRevisionsPerDocument);
    for (const id of toRemove) {
      this.revisions.delete(id);
    }

    this.documentRevisions.set(documentId, revisionIds.slice(0, this.maxRevisionsPerDocument));
  }

  private generateId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `rev-${crypto.randomUUID()}`;
    }
    return `rev-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }
}

export function createRevisionHistory<TBlock extends Block<BlockData> = Block<BlockData>>(): RevisionHistory<TBlock> {
  return new RevisionHistory<TBlock>();
}
