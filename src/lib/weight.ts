import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";

export async function getWeightForDate(date: string) {
  const userId = await requireUserId();
  return prisma.weightLog.findUnique({ where: { userId_date: { userId, date } } });
}

// Most recent entry strictly before `date` — used to suggest a starting
// value when today has no entry yet, however many days ago it was. Never
// written to the DB on its own; only used to pre-fill the input.
export async function getLatestWeightBefore(date: string) {
  const userId = await requireUserId();
  return prisma.weightLog.findFirst({
    where: { userId, date: { lt: date } },
    orderBy: { date: "desc" },
  });
}

// One entry per day, entered from "Hoy" — upsert so re-entering the same day corrects it.
export async function setWeight(
  date: string,
  weightKg: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    return { ok: false, error: "Peso inválido." };
  }
  await prisma.weightLog.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, weightKg },
    update: { weightKg },
  });
  return { ok: true };
}

export async function listWeightHistory(fromDate?: string, toDate?: string) {
  const userId = await requireUserId();
  return prisma.weightLog.findMany({
    where: {
      userId,
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
    orderBy: { date: "asc" },
  });
}
