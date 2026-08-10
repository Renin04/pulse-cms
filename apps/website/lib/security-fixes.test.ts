/**
 * Security regression tests for the audit fixes (issues #5 / #6):
 * S1 rank guards, S3 refresh-token revocation, S5 password required,
 * S7 last-super-admin guard, S8 media ownership, N1 reset 501,
 * N2 bulk action scopes, N3 preview access check.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-0123456789abcdef";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret-0123456789abcdef";
});

vi.mock("@/lib/db", () => ({
  prisma: {
    role: { findMany: vi.fn(), findUnique: vi.fn() },
    userRole: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    refreshToken: { create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
    entry: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    mediaAsset: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));

// Keep the real ApiError/jsonResponse/handleApiError/logAudit behavior, stub
// only the auth entry points so each test controls the caller's context.
let currentCtx: any = { userId: "actor", email: "a@b.c", roles: [], permissions: [] };
vi.mock("@/lib/api-utils", async () => {
  const actual = await vi.importActual<any>("@/lib/api-utils");
  const { ForbiddenError, hasPermission } = await vi.importActual<any>("@/lib/auth");
  return {
    ...actual,
    requireAuth: vi.fn(async () => currentCtx),
    requireAuthAndPermission: vi.fn(async (_req: unknown, scope: string) => {
      if (!hasPermission(currentCtx, scope)) {
        throw new ForbiddenError(`Forbidden: missing permission '${scope}'`);
      }
      return currentCtx;
    }),
    logAudit: vi.fn(async () => {}),
  };
});

import { prisma } from "@/lib/db";
import {
  assertCanAssignRoles,
  assertCanModifyUser,
  assertNotRemovingLastSuperAdmin,
  assertRoleNotInUse,
} from "./rbac";
import { storeRefreshToken, getActiveRefreshToken, revokeRefreshToken, hashRefreshToken } from "./refresh-tokens";
import { createRefreshToken } from "@/lib/auth";

const roleFindMany = vi.mocked(prisma.role.findMany);
const roleFindUnique = vi.mocked(prisma.role.findUnique);
const userRoleFindMany = vi.mocked(prisma.userRole.findMany);
const userRoleFindFirst = vi.mocked(prisma.userRole.findFirst);
const userRoleCount = vi.mocked(prisma.userRole.count);

function makeRequest(body?: unknown): NextRequest {
  return {
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => body ?? {},
    nextUrl: new URL("http://localhost/api"),
  } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  currentCtx = { userId: "actor", email: "a@b.c", roles: [], permissions: [] };
});

describe("rbac rank guards (S1/S6/S7)", () => {
  it("allows assigning roles below the actor's rank", async () => {
    currentCtx.roles = ["admin"];
    roleFindMany
      .mockResolvedValueOnce([{ rank: 80 }] as never) // actor rank
      .mockResolvedValueOnce([{ id: "r1", name: "author", rank: 20 }] as never); // target roles
    await expect(assertCanAssignRoles(currentCtx, ["r1"])).resolves.toBeUndefined();
  });

  it("blocks assigning a role at or above the actor's rank (self-escalation)", async () => {
    currentCtx.roles = ["admin"];
    roleFindMany
      .mockResolvedValueOnce([{ rank: 80 }] as never)
      .mockResolvedValueOnce([{ id: "r0", name: "super_admin", rank: 100 }] as never);
    await expect(assertCanAssignRoles(currentCtx, ["r0"])).rejects.toMatchObject({ status: 403 });
  });

  it("blocks modifying a user at or above the actor's rank", async () => {
    currentCtx.roles = ["admin"];
    roleFindMany.mockResolvedValueOnce([{ rank: 80 }] as never); // actor
    userRoleFindMany.mockResolvedValueOnce([{ role: { rank: 100 } }] as never); // target
    await expect(assertCanModifyUser(currentCtx, "target")).rejects.toMatchObject({ status: 403 });
  });

  it("allows modifying a lower-ranked user", async () => {
    currentCtx.roles = ["super_admin"];
    roleFindMany.mockResolvedValueOnce([{ rank: 100 }] as never);
    userRoleFindMany.mockResolvedValueOnce([{ role: { rank: 20 } }] as never);
    await expect(assertCanModifyUser(currentCtx, "target")).resolves.toBeUndefined();
  });

  it("blocks removing the last super_admin (S7)", async () => {
    roleFindUnique.mockResolvedValueOnce({ id: "sa-role" } as never);
    userRoleFindFirst.mockResolvedValueOnce({ id: "m1" } as never);
    userRoleCount.mockResolvedValueOnce(1 as never);
    await expect(assertNotRemovingLastSuperAdmin("target", [])).rejects.toMatchObject({ status: 409 });
  });

  it("allows removing a super_admin when another remains", async () => {
    roleFindUnique.mockResolvedValueOnce({ id: "sa-role" } as never);
    userRoleFindFirst.mockResolvedValueOnce({ id: "m1" } as never);
    userRoleCount.mockResolvedValueOnce(2 as never);
    await expect(assertNotRemovingLastSuperAdmin("target", [])).resolves.toBeUndefined();
  });

  it("blocks deleting a role that still has users (S6)", async () => {
    userRoleCount.mockResolvedValueOnce(3 as never);
    await expect(assertRoleNotInUse("r1")).rejects.toMatchObject({ status: 409 });
    userRoleCount.mockResolvedValueOnce(0 as never);
    await expect(assertRoleNotInUse("r1")).resolves.toBeUndefined();
  });
});

describe("refresh token store (S3)", () => {
  it("stores only the SHA-256 hash of the token", async () => {
    await storeRefreshToken("u1", "raw-token", new Date(Date.now() + 1000));
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "u1", tokenHash: hashRefreshToken("raw-token") }),
    });
  });

  it("returns null for revoked, expired, or unknown tokens", async () => {
    const findUnique = vi.mocked(prisma.refreshToken.findUnique);
    findUnique.mockResolvedValueOnce(null as never);
    expect(await getActiveRefreshToken("x")).toBeNull();

    findUnique.mockResolvedValueOnce({ revokedAt: new Date(), expiresAt: new Date(Date.now() + 1000) } as never);
    expect(await getActiveRefreshToken("x")).toBeNull();

    findUnique.mockResolvedValueOnce({ revokedAt: null, expiresAt: new Date(Date.now() - 1000) } as never);
    expect(await getActiveRefreshToken("x")).toBeNull();

    findUnique.mockResolvedValueOnce({ revokedAt: null, expiresAt: new Date(Date.now() + 1000) } as never);
    expect(await getActiveRefreshToken("x")).not.toBeNull();
  });

  it("revoke marks the token revoked", async () => {
    await revokeRefreshToken("raw-token");
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { tokenHash: hashRefreshToken("raw-token"), revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});

describe("auth routes", () => {
  it("reset-password answers 501 (N1)", async () => {
    const { POST } = await import("../app/api/auth/reset-password/route");
    const res = await POST();
    expect(res.status).toBe(501);
  });

  it("refresh rejects an unknown/revoked token (replay fails closed)", async () => {
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValueOnce(null as never);
    const { POST } = await import("../app/api/auth/refresh/route");
    const token = await createRefreshToken("user-1");
    const res = await POST(makeRequest({ refreshToken: token }));
    expect(res.status).toBe(401);
  });

  it("refresh rejects a garbage token with 401 (not 500)", async () => {
    const { POST } = await import("../app/api/auth/refresh/route");
    const res = await POST(makeRequest({ refreshToken: "not-a-jwt" }));
    expect(res.status).toBe(401);
  });

  it("logout revokes the presented refresh token", async () => {
    const { POST } = await import("../app/api/auth/logout/route");
    const res = await POST(makeRequest({ refreshToken: "raw-token" }));
    expect(res.status).toBe(200);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });
});

describe("users routes (S1/S5/S7)", () => {
  it("POST /api/users rejects a missing password (S5)", async () => {
    currentCtx = { userId: "admin-1", roles: ["super_admin"], permissions: [] };
    const { POST } = await import("../app/api/users/route");
    const res = await POST(makeRequest({ email: "new@user.dev" }));
    expect(res.status).toBe(400);
  });

  it("POST /api/users blocks an admin creating a super_admin (S1)", async () => {
    currentCtx = { userId: "admin-1", roles: ["admin"], permissions: ["users.manage"] };
    roleFindMany
      .mockResolvedValueOnce([{ rank: 80 }] as never) // actor rank
      .mockResolvedValueOnce([{ id: "r0", name: "super_admin", rank: 100 }] as never);
    const { POST } = await import("../app/api/users/route");
    const res = await POST(makeRequest({ email: "new@user.dev", password: "secret-123", roleIds: ["r0"] }));
    expect(res.status).toBe(403);
  });

  it("PUT /api/users/[id]/roles blocks self-escalation to super_admin (S1)", async () => {
    currentCtx = { userId: "admin-1", roles: ["admin"], permissions: ["users.manage"] };
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "admin-1" } as never);
    roleFindMany
      .mockResolvedValueOnce([{ rank: 80 }] as never)
      .mockResolvedValueOnce([{ id: "r0", name: "super_admin", rank: 100 }] as never);
    const { PUT } = await import("../app/api/users/[id]/roles/route");
    const res = await PUT(makeRequest({ roleIds: ["r0"] }), { params: { id: "admin-1" } });
    expect(res.status).toBe(403);
  });
});

describe("entries bulk + preview (N2/N3)", () => {
  it("bulk publish is rejected for a content.update-only author (N2)", async () => {
    currentCtx = { userId: "author-1", roles: ["author"], permissions: ["content.read", "content.create", "content.update"] };
    const { POST } = await import("../app/api/cms/entries/bulk/route");
    const res = await POST(makeRequest({ ids: ["e1"], action: "publish" }));
    expect(res.status).toBe(403);
  });

  it("bulk delete requires content.delete (N2)", async () => {
    currentCtx = { userId: "author-1", roles: ["author"], permissions: ["content.read", "content.create", "content.update"] };
    const { POST } = await import("../app/api/cms/entries/bulk/route");
    const res = await POST(makeRequest({ ids: ["e1"], action: "delete" }));
    expect(res.status).toBe(403);
  });

  it("preview token is refused for someone else's draft (N3)", async () => {
    currentCtx = { userId: "author-1", roles: ["author"], permissions: ["content.read", "content.create", "content.update"] };
    vi.mocked(prisma.entry.findUnique).mockResolvedValueOnce({ id: "e1", authorId: "someone-else" } as never);
    const { POST } = await import("../app/api/cms/entries/[id]/preview/route");
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "e1" }) });
    expect(res.status).toBe(403);
  });

  it("preview token is issued to the entry's own author (N3)", async () => {
    currentCtx = { userId: "author-1", roles: ["author"], permissions: ["content.read"] };
    vi.mocked(prisma.entry.findUnique).mockResolvedValueOnce({ id: "e1", authorId: "author-1" } as never);
    const { POST } = await import("../app/api/cms/entries/[id]/preview/route");
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "e1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.url).toContain("/blog/preview?token=");
  });
});

describe("media delete ownership (S8)", () => {
  it("blocks deleting another user's upload without an elevated scope", async () => {
    currentCtx = { userId: "editor-1", roles: ["editor"], permissions: ["media.manage"] };
    vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValueOnce({ id: "m1", uploaderId: "someone-else", metadata: "{}" } as never);
    const { DELETE } = await import("../app/api/media/[id]/route");
    const res = await DELETE(makeRequest(), { params: { id: "m1" } });
    expect(res.status).toBe(403);
  });

  it("allows deleting your own upload", async () => {
    currentCtx = { userId: "editor-1", roles: ["editor"], permissions: ["media.manage"] };
    vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValueOnce({ id: "m1", uploaderId: "editor-1", metadata: "{}" } as never);
    vi.mocked(prisma.mediaAsset.delete).mockResolvedValueOnce({} as never);
    const { DELETE } = await import("../app/api/media/[id]/route");
    const res = await DELETE(makeRequest(), { params: { id: "m1" } });
    expect(res.status).toBe(200);
  });
});
