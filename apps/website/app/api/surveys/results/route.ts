import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, ApiError } from "@/lib/api-utils";

const querySchema = z.object({
  entryId: z.string().min(1),
  surveyHash: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = querySchema.safeParse(searchParams);
    if (!parsed.success) {
      throw new ApiError("INVALID_INPUT", "Missing entryId or surveyHash", 400);
    }

    const { entryId, surveyHash } = parsed.data;

    // Get all responses for this survey
    const responses = await prisma.surveyResponse.findMany({
      where: { entryId, surveyHash },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate per question
    const questionMap = new Map<string, { answers: string[]; counts: Record<string, number>; total: number }>();

    for (const r of responses) {
      if (!questionMap.has(r.questionId)) {
        questionMap.set(r.questionId, { answers: [], counts: {}, total: 0 });
      }
      const q = questionMap.get(r.questionId)!;
      q.answers.push(r.answer);
      q.counts[r.answer] = (q.counts[r.answer] || 0) + 1;
      q.total += 1;
    }

    const results = Object.fromEntries(
      Array.from(questionMap.entries()).map(([questionId, data]) => [
        questionId,
        {
          totalResponses: data.total,
          frequency: data.counts,
          // For text questions, include raw answers (last 50)
          samples: data.answers.slice(0, 50),
        },
      ])
    );

    // Total unique respondents
    const uniqueVoters = new Set(responses.map((r) => r.voterHash)).size;

    return jsonResponse({
      totalResponses: responses.length,
      uniqueRespondents: uniqueVoters,
      results,
    });
  } catch (err) {
    console.error('[Survey results] Unhandled error:', err);
    return handleApiError(err);
  }
}
