import { db } from "@/lib/db";
import { logError, logInfo } from "@/lib/observability";

export async function enqueueJob(name: string, queue: string, payload: Record<string, unknown>, runAfter = new Date()) {
  return db.job.create({
    data: { name, queue, payload: payload as never, runAfter },
  });
}

export async function runDueJobs(
  queue: string,
  handlers: Record<string, (payload: Record<string, unknown>) => Promise<void>>,
  limit = 25
) {
  const jobs = await db.job.findMany({
    where: { queue, status: "QUEUED", runAfter: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  for (const job of jobs) {
    await db.job.update({ where: { id: job.id }, data: { status: "RUNNING", lockedAt: new Date() } });
    try {
      const handler = handlers[job.name];
      if (!handler) throw new Error(`No handler registered for job ${job.name}`);
      await handler(job.payload as Record<string, unknown>);
      await db.job.update({ where: { id: job.id }, data: { status: "SUCCEEDED" } });
      logInfo("job.succeeded", { jobId: job.id, queue, name: job.name });
    } catch (err) {
      const attempts = job.attempts + 1;
      await db.job.update({
        where: { id: job.id },
        data: {
          attempts,
          status: attempts >= job.maxAttempts ? "DEAD_LETTER" : "QUEUED",
          runAfter: new Date(Date.now() + Math.min(60_000 * 2 ** attempts, 60 * 60 * 1000)),
          lastError: err instanceof Error ? err.message : "Unknown error",
        },
      });
      logError("job.failed", err, { jobId: job.id, queue, name: job.name, attempts });
    }
  }
  return jobs.length;
}
