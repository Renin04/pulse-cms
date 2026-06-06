import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthContext } from "@/lib/api-utils";
import { jsonResponse, handleApiError, ApiError } from "@/lib/api-utils";

const voteBodySchema = z.object({
  entryId: z.string().min(1),
  pollHash: z.string().min(1),
  optionId: z.string().min(1).optional(),
  allowMultiple: z.boolean().default(false),
  retractAll: z.boolean().default(false),
  voterId: z.string().optional(),
});

function getVoterHash(userId: string | null, voterId: string | null): string {
  if (userId) return `user:${userId}`;
  if (voterId) return `anon:${voterId}`;
  return `anon:${crypto.randomUUID()}`;
}

async function getVoteCounts(entryId: string, pollHash: string) {
  const rows = await prisma.pollVote.groupBy({
    by: ["optionId"],
    where: { entryId, pollHash },
    _count: { optionId: true },
  });
  return Object.fromEntries(rows.map((r) => [r.optionId, r._count.optionId]));
}

async function getMyVotes(entryId: string, pollHash: string, voterHash: string) {
  const rows = await prisma.pollVote.findMany({
    where: { entryId, pollHash, voterHash },
    select: { optionId: true },
  });
  return rows.map((r) => r.optionId);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = voteBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("INVALID_INPUT", "Invalid request body", 400);
    }

    const { entryId, pollHash, optionId, allowMultiple, retractAll, voterId } = parsed.data;

    const authCtx = await getAuthContext(req);
    const userId = authCtx?.userId ?? null;
    const voterHash = getVoterHash(userId, voterId ?? null);

    if (retractAll) {
      await prisma.pollVote.deleteMany({
        where: { entryId, pollHash, voterHash },
      });
    } else if (optionId) {
      // For single-choice polls, remove any existing votes first
      if (!allowMultiple) {
        await prisma.pollVote.deleteMany({
          where: { entryId, pollHash, voterHash },
        });
      }

      // Check if this specific option is already voted
      const existing = await prisma.pollVote.findUnique({
        where: {
          entryId_pollHash_optionId_voterHash: {
            entryId,
            pollHash,
            optionId,
            voterHash,
          },
        },
      });

      if (existing) {
        // Toggle off (retract this option)
        await prisma.pollVote.delete({ where: { id: existing.id } });
      } else {
        // Cast vote
        await prisma.pollVote.create({
          data: {
            entryId,
            pollHash,
            optionId,
            userId,
            voterHash,
          },
        });
      }
    } else {
      throw new ApiError("INVALID_INPUT", "optionId is required unless retractAll is true", 400);
    }

    const counts = await getVoteCounts(entryId, pollHash);
    const myVotes = await getMyVotes(entryId, pollHash, voterHash);

    return jsonResponse({ counts, myVotes });
  } catch (err) {
    return handleApiError(err);
  }
}
