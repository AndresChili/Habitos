import "server-only";
import { prisma } from "@/lib/db";

// DB-backed (not in-memory) because Vercel Functions are stateless across
// instances — an in-memory counter would reset per cold start / per instance
// and not actually stop a distributed brute-force attempt.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;
const CLEANUP_OLDER_THAN_MS = 24 * 60 * 60 * 1000;

export async function isRateLimited(email: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const count = await prisma.loginAttempt.count({
    where: { email, success: false, createdAt: { gte: since } },
  });
  return count >= MAX_FAILED_ATTEMPTS;
}

export async function recordLoginAttempt(email: string, success: boolean): Promise<void> {
  await prisma.loginAttempt.create({ data: { email, success } });

  // Opportunistic cleanup so the table doesn't grow unbounded — no cron needed.
  if (Math.random() < 0.05) {
    const cutoff = new Date(Date.now() - CLEANUP_OLDER_THAN_MS);
    await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
  }
}
