import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonResponse, handleApiError, ApiError, logAudit } from '@/lib/api-utils';

/**
 * Background Job Runner — Scheduled Publishing
 *
 * Production usage:
 * - Call this endpoint via a cron service (Vercel Cron, GitHub Actions, etc.)
 * - Protect it with CRON_SECRET in production
 * - Example cron: curl -H "Authorization: Bearer $CRON_SECRET" https://yoursite.com/api/jobs/publish
 */

export async function GET(req: NextRequest) {
  return runJobs(req);
}

export async function POST(req: NextRequest) {
  return runJobs(req);
}

async function runJobs(req: NextRequest) {
  try {
    // In production, require a cron secret to prevent unauthorized job execution
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (token !== cronSecret) {
        throw new ApiError('UNAUTHORIZED', 'Invalid cron secret', 401);
      }
    }

    const now = new Date();

    // Find pending jobs that are due
    const pendingJobs = await prisma.publishJob.findMany({
      where: {
        executed: false,
        failed: false,
        scheduledAt: { lte: now },
      },
      orderBy: { scheduledAt: 'asc' },
      include: { entry: true },
    });

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      details: [] as Array<{ jobId: string; entryId: string; action: string; status: string; error?: string }>,
    };

    for (const job of pendingJobs) {
      results.processed += 1;

      try {
        if (!job.entry) {
          throw new Error('Entry not found for job');
        }

        const previousStatus = job.entry.status;
        let newStatus = job.entry.status;

        if (job.action === 'publish') {
          newStatus = 'published';
          await prisma.entry.update({
            where: { id: job.entryId },
            data: {
              status: 'published',
              publishedAt: now,
              scheduledAt: null,
              updatedAt: now,
            },
          });
        } else if (job.action === 'unpublish') {
          newStatus = 'draft';
          await prisma.entry.update({
            where: { id: job.entryId },
            data: {
              status: 'draft',
              publishedAt: null,
              scheduledAt: null,
              updatedAt: now,
            },
          });
        } else if (job.action === 'archive') {
          newStatus = 'archived';
          await prisma.entry.update({
            where: { id: job.entryId },
            data: {
              status: 'archived',
              scheduledAt: null,
              updatedAt: now,
            },
          });
        }

        await prisma.publishJob.update({
          where: { id: job.id },
          data: {
            executed: true,
            executedAt: now,
            failed: false,
            error: null,
          },
        });

        await logAudit(job.action, 'entry', {
          userId: job.createdBy,
          entryId: job.entryId,
          resourceId: job.id,
          fromStatus: previousStatus,
          toStatus: newStatus,
          metadata: { jobId: job.id, executedAt: now.toISOString() },
          req,
        });

        results.succeeded += 1;
        results.details.push({ jobId: job.id, entryId: job.entryId, action: job.action, status: 'success' });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        await prisma.publishJob.update({
          where: { id: job.id },
          data: {
            executed: true,
            executedAt: now,
            failed: true,
            error: message,
          },
        });

        results.failed += 1;
        results.details.push({ jobId: job.id, entryId: job.entryId, action: job.action, status: 'failed', error: message });
      }
    }

    return jsonResponse({
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
