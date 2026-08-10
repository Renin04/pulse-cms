/**
 * Entry Access Control
 *
 * Pulse has no ownership/ACL model yet, so until one ships this central helper
 * decides who may touch a single entry: editorial staff (anyone holding
 * content.publish) may access every entry; everyone else may only access
 * entries they authored. Used by the single-entry GET/PUT/DELETE routes and
 * the preview-token route so drafts are no longer world-readable inside the
 * authenticated CMS surface.
 */

import { AuthContext, hasPermission } from "./auth";
import { ApiError } from "./api-utils";

export type EntryAccessAction = "read" | "update" | "delete" | "preview";

export interface EntryAccessSubject {
  authorId: string | null;
}

export function canAccessEntry(
  ctx: AuthContext,
  entry: EntryAccessSubject,
  _action: EntryAccessAction
): boolean {
  if (hasPermission(ctx, "content.publish")) return true; // editorial staff
  return entry.authorId !== null && entry.authorId === ctx.userId;
}

export function assertEntryAccess(
  ctx: AuthContext,
  entry: EntryAccessSubject,
  action: EntryAccessAction
): void {
  if (!canAccessEntry(ctx, entry, action)) {
    throw new ApiError("FORBIDDEN", "You do not have access to this entry", 403);
  }
}
