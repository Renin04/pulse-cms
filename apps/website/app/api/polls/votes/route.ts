import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthContext } from "@/lib/api-utils";
import { jsonResponse, handleApiError, ApiError } from "@/lib/api-utils";

const querySchema = z.object({
  entryId: z.string().min(1),
  pollHash: z.string().min(1),
  voterId: z.string().optional(),
});

function getVoterHash(userId: string | null, voterId: string | null): string {
  if (userId) return `user:${userId}`;
  if (voterId) return `anon:${voterId}`;
  return `anon:${crypto.randomUUID()}`;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = querySchema.safeParse(searchParams);
    if (!parsed.success) {
      throw new ApiError("INVALID_INPUT", "Missing entryId or pollHash", 400);
    }

    const { entryId, pollHash, voterId } = parsed.data;

    const authCtx = await getAuthContext(req);
    const userId = authCtx?.userId ?? null;
    const voterHash = getVoterHash(userId, voterId ?? null);

    const countsRows = await prisma.pollVote.groupBy({
      by: ["optionId"],
      where: { entryId, pollHash },
      _count: { optionId: true },
    });
    const counts = Object.fromEntries(countsRows.map((r) => [r.optionId, r._count.optionId]));

    const myVotesRows = await prisma.pollVote.findMany({
      where: { entryId, pollHash, voterHash },
      select: { optionId: true },
    });
    const myVotes = myVotesRows.map((r) => r.optionId);

    return jsonResponse({ counts, myVotes, debug: { voterHash, entryId, pollHash, voterId: voterId ?? null } });
  } catch (err) {
    return handleApiError(err);
  }
}
