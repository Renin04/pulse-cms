import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthContext } from "@/lib/api-utils";
import { jsonResponse, handleApiError, ApiError } from "@/lib/api-utils";

const answerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1),
});

const submitBodySchema = z.object({
  entryId: z.string().min(1),
  surveyHash: z.string().min(1),
  answers: z.array(answerSchema).min(1),
  voterId: z.string().optional(),
});

function getVoterHash(userId: string | null, voterId: string | null): string {
  if (userId) return `user:${userId}`;
  if (voterId) return `anon:${voterId}`;
  return `anon:${crypto.randomUUID()}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = submitBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("INVALID_INPUT", "Invalid request body", 400);
    }

    const { entryId, surveyHash, answers, voterId } = parsed.data;

    const authCtx = await getAuthContext(req);
    const userId = authCtx?.userId ?? null;
    const voterHash = getVoterHash(userId, voterId ?? null);

    // Delete existing responses from this voter for this survey
    await prisma.$executeRawUnsafe(
      `DELETE FROM survey_responses WHERE entry_id = ? AND survey_hash = ? AND voter_hash = ?`,
      entryId, surveyHash, voterHash
    );

    // Insert new responses
    for (const a of answers) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO survey_responses (id, entry_id, survey_hash, question_id, answer, voter_hash, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        crypto.randomUUID(), entryId, surveyHash, a.questionId, a.answer, voterHash, userId
      );
    }

    return jsonResponse({ success: true, submittedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[Survey submit] Unhandled error:', err);
    return handleApiError(err);
  }
}
