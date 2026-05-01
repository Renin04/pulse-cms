/**
 * Taxonomy Manager
 *
 * Manages CMS taxonomies including categories, tags, and custom taxonomy types
 * with hierarchical term support.
 */

import type { Taxonomy, TaxonomyTerm } from "./types";
import { validateTaxonomy, validateTaxonomyTerm } from "./schemas";
import { generateId, now, slugify, ensureUniqueSlug } from "./utils";

export class TaxonomyManager {
  private taxonomies: Map<string, Taxonomy> = new Map();
  private termIndex: Map<string, TaxonomyTerm> = new Map(); // Global term lookup

  // ============================================================================
  // Taxonomy CRUD
  // ============================================================================

  register(taxonomy: Omit<Taxonomy, "id" | "createdAt" | "updatedAt" | "terms"> & Partial<Taxonomy>): Taxonomy {
    const validated = validateTaxonomy({
      ...taxonomy,
      id: taxonomy.id ?? generateId(),
      terms: taxonomy.terms ?? [],
      createdAt: taxonomy.createdAt ?? now(),
      updatedAt: taxonomy.updatedAt ?? now(),
    });

    if (this.taxonomies.has(validated.id)) {
      throw new Error(`Taxonomy with ID "${validated.id}" already exists`);
    }

    if (this.slugExists(validated.slug, validated.id)) {
      throw new Error(`Taxonomy with slug "${validated.slug}" already exists`);
    }

    this.taxonomies.set(validated.id, validated);

    // Index all terms
    for (const term of validated.terms) {
      this.termIndex.set(term.id, term);
    }

    return validated;
  }

  update(id: string, updates: Partial<Omit<Taxonomy, "id" | "createdAt" | "terms">>): Taxonomy {
    const existing = this.get(id);
    if (!existing) {
      throw new Error(`Taxonomy with ID "${id}" not found`);
    }

    // Check slug uniqueness
    if (updates.slug && updates.slug !== existing.slug) {
      if (this.slugExists(updates.slug, id)) {
        throw new Error(`Taxonomy with slug "${updates.slug}" already exists`);
      }
    }

    const updated: Taxonomy = {
      ...existing,
      ...updates,
      id, // Preserve ID
      terms: existing.terms, // Preserve terms
      createdAt: existing.createdAt, // Preserve creation time
      updatedAt: now(),
    };

    const validated = validateTaxonomy(updated);
    this.taxonomies.set(id, validated);

    return validated;
  }

  unregister(id: string): boolean {
    const taxonomy = this.taxonomies.get(id);
    if (!taxonomy) return false;

    // Remove terms from index
    for (const term of taxonomy.terms) {
      this.termIndex.delete(term.id);
    }

    return this.taxonomies.delete(id);
  }

  get(id: string): Taxonomy | undefined {
    return this.taxonomies.get(id);
  }

  getBySlug(slug: string): Taxonomy | undefined {
    return Array.from(this.taxonomies.values()).find((t) => t.slug === slug);
  }

  has(id: string): boolean {
    return this.taxonomies.has(id);
  }

  list(): Taxonomy[] {
    return Array.from(this.taxonomies.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  count(): number {
    return this.taxonomies.size;
  }

  reset(): void {
    this.taxonomies.clear();
    this.termIndex.clear();
  }

  // ============================================================================
  // Term Management
  // ============================================================================

  addTerm(
    taxonomyId: string,
    term: Omit<TaxonomyTerm, "id" | "taxonomyId" | "slug"> & { slug?: string },
  ): TaxonomyTerm {
    const taxonomy = this.get(taxonomyId);
    if (!taxonomy) {
      throw new Error(`Taxonomy with ID "${taxonomyId}" not found`);
    }

    // Generate unique slug
    const baseSlug = term.slug ?? slugify(term.name);
    const slug = this.generateUniqueTermSlug(baseSlug, taxonomyId);

    const newTerm: TaxonomyTerm = validateTaxonomyTerm({
      ...term,
      id: generateId(),
      taxonomyId,
      slug,
    });

    // Check for hierarchical constraints
    if (newTerm.parentId && !taxonomy.config.hierarchical) {
      throw new Error(`Taxonomy "${taxonomy.name}" does not support hierarchical terms`);
    }

    // Validate parent exists
    if (newTerm.parentId && !taxonomy.terms.some((t) => t.id === newTerm.parentId)) {
      throw new Error(`Parent term with ID "${newTerm.parentId}" not found`);
    }

    taxonomy.terms.push(newTerm);
    taxonomy.updatedAt = now();

    this.termIndex.set(newTerm.id, newTerm);

    return newTerm;
  }

  updateTerm(
    taxonomyId: string,
    termId: string,
    updates: Partial<Omit<TaxonomyTerm, "id" | "taxonomyId">>,
  ): TaxonomyTerm {
    const taxonomy = this.get(taxonomyId);
    if (!taxonomy) {
      throw new Error(`Taxonomy with ID "${taxonomyId}" not found`);
    }

    const termIndex = taxonomy.terms.findIndex((t) => t.id === termId);
    if (termIndex === -1) {
      throw new Error(`Term with ID "${termId}" not found in taxonomy`);
    }

    const existing = taxonomy.terms[termIndex];

    // Handle slug change
    let newSlug = existing.slug;
    if (updates.slug && updates.slug !== existing.slug) {
      newSlug = this.generateUniqueTermSlug(updates.slug, taxonomyId, termId);
    }

    // Validate parent change
    if (updates.parentId !== undefined && updates.parentId !== existing.parentId) {
      if (updates.parentId && !taxonomy.config.hierarchical) {
        throw new Error(`Taxonomy "${taxonomy.name}" does not support hierarchical terms`);
      }

      if (updates.parentId && !taxonomy.terms.some((t) => t.id === updates.parentId)) {
        throw new Error(`Parent term with ID "${updates.parentId}" not found`);
      }

      // Prevent circular references
      if (updates.parentId === termId) {
        throw new Error("A term cannot be its own parent");
      }

      // Check if this would create a cycle
      if (updates.parentId && this.isDescendant(taxonomy, termId, updates.parentId)) {
        throw new Error("Cannot set a descendant as parent (would create a cycle)");
      }
    }

    const updated: TaxonomyTerm = {
      ...existing,
      ...updates,
      id: termId, // Preserve ID
      taxonomyId, // Preserve taxonomy ID
      slug: newSlug,
    };

    const validated = validateTaxonomyTerm(updated);
    taxonomy.terms[termIndex] = validated;
    taxonomy.updatedAt = now();

    this.termIndex.set(termId, validated);

    return validated;
  }

  removeTerm(taxonomyId: string, termId: string): boolean {
    const taxonomy = this.get(taxonomyId);
    if (!taxonomy) {
      throw new Error(`Taxonomy with ID "${taxonomyId}" not found`);
    }

    const termIndex = taxonomy.terms.findIndex((t) => t.id === termId);
    if (termIndex === -1) {
      return false;
    }

    // Check if any terms have this as parent
    if (taxonomy.terms.some((t) => t.parentId === termId)) {
      throw new Error(`Cannot delete term "${termId}" because it has child terms`);
    }

    taxonomy.terms.splice(termIndex, 1);
    taxonomy.updatedAt = now();

    this.termIndex.delete(termId);

    return true;
  }

  getTerm(termId: string): TaxonomyTerm | undefined {
    return this.termIndex.get(termId);
  }

  getTermBySlug(taxonomyId: string, slug: string): TaxonomyTerm | undefined {
    const taxonomy = this.get(taxonomyId);
    if (!taxonomy) return undefined;

    return taxonomy.terms.find((t) => t.slug === slug);
  }

  // ============================================================================
  // Hierarchy Helpers
  // ============================================================================

  getTermTree(taxonomyId: string, parentId: string | null = null): TaxonomyTerm[] {
    const taxonomy = this.get(taxonomyId);
    if (!taxonomy) return [];

    return taxonomy.terms
      .filter((t) => (parentId === null ? !t.parentId : t.parentId === parentId))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  getTermChildren(taxonomyId: string, parentId: string): TaxonomyTerm[] {
    return this.getTermTree(taxonomyId, parentId);
  }

  getTermDescendants(taxonomyId: string, termId: string): TaxonomyTerm[] {
    const taxonomy = this.get(taxonomyId);
    if (!taxonomy) return [];

    const descendants: TaxonomyTerm[] = [];
    const queue = [termId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = taxonomy.terms.filter((t) => t.parentId === currentId);

      for (const child of children) {
        descendants.push(child);
        queue.push(child.id);
      }
    }

    return descendants;
  }

  getTermAncestors(taxonomyId: string, termId: string): TaxonomyTerm[] {
    const taxonomy = this.get(taxonomyId);
    if (!taxonomy) return [];

    const ancestors: TaxonomyTerm[] = [];
    let currentId: string | null | undefined = termId;

    while (currentId) {
      const term = taxonomy.terms.find((t) => t.id === currentId);
      if (!term) break;

      if (term.parentId) {
        const parent = taxonomy.terms.find((t) => t.id === term.parentId);
        if (parent) {
          ancestors.unshift(parent);
        }
      }

      currentId = term.parentId;
    }

    return ancestors;
  }

  getTermPath(taxonomyId: string, termId: string): TaxonomyTerm[] {
    return [...this.getTermAncestors(taxonomyId, termId), this.getTerm(termId)!].filter(Boolean);
  }

  getTermPathSlugs(taxonomyId: string, termId: string): string {
    const path = this.getTermPath(taxonomyId, termId);
    return path.map((t) => t.slug).join("/");
  }

  private isDescendant(taxonomy: Taxonomy, ancestorId: string, candidateId: string): boolean {
    const children = taxonomy.terms.filter((t) => t.parentId === ancestorId);

    for (const child of children) {
      if (child.id === candidateId) return true;
      if (this.isDescendant(taxonomy, child.id, candidateId)) return true;
    }

    return false;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  searchTerms(taxonomyId: string, query: string): TaxonomyTerm[] {
    const taxonomy = this.get(taxonomyId);
    if (!taxonomy) return [];

    const lowerQuery = query.toLowerCase();
    return taxonomy.terms.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.slug.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery),
    );
  }

  getTermsByEntry(): TaxonomyTerm[] {
    // This would typically query entry-taxonomy relationships
    // For now, return empty array as the relationship is stored on Entry
    // Parameters: entryId: string, taxonomyId?: string
    return [];
  }

  reorderTerms(taxonomyId: string, orderedTermIds: string[]): Taxonomy {
    const taxonomy = this.get(taxonomyId);
    if (!taxonomy) {
      throw new Error(`Taxonomy with ID "${taxonomyId}" not found`);
    }

    // Validate all term IDs exist
    for (const termId of orderedTermIds) {
      if (!taxonomy.terms.some((t) => t.id === termId)) {
        throw new Error(`Term with ID "${termId}" not found in taxonomy`);
      }
    }

    // Update order for each term
    for (let i = 0; i < orderedTermIds.length; i++) {
      const term = taxonomy.terms.find((t) => t.id === orderedTermIds[i])!;
      term.order = i;
    }

    taxonomy.updatedAt = now();
    return taxonomy;
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getTermStats(taxonomyId: string): Map<string, number> {
    const taxonomy = this.get(taxonomyId);
    if (!taxonomy) return new Map();

    // This would typically query entry counts per term
    // For now, return stored entryCount or 0
    const stats = new Map<string, number>();
    for (const term of taxonomy.terms) {
      stats.set(term.id, term.entryCount ?? 0);
    }

    return stats;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private slugExists(slug: string, excludeId?: string): boolean {
    return Array.from(this.taxonomies.values()).some((t) => t.slug === slug && t.id !== excludeId);
  }

  private termSlugExists(slug: string, taxonomyId: string, excludeTermId?: string): boolean {
    const taxonomy = this.get(taxonomyId);
    if (!taxonomy) return false;

    return taxonomy.terms.some((t) => t.slug === slug && t.id !== excludeTermId);
  }

  private generateUniqueTermSlug(baseSlug: string, taxonomyId: string, excludeTermId?: string): string {
    return ensureUniqueSlug(
      baseSlug,
      (s) => !this.termSlugExists(s, taxonomyId, excludeTermId),
      { separator: "-" },
    );
  }
}
