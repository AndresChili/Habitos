import { prisma } from "@/lib/db";

export async function getWeightForDate(date: string) {
  return prisma.weightLog.findUnique({ where: { date } });
}

// One entry per day, entered from "Hoy" — upsert so re-entering the same day corrects it.
export async function setWeight(
  date: string,
  weightKg: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    return { ok: false, error: "Peso inválido." };
  }
  await prisma.weightLog.upsert({
    where: { date },
    create: { date, weightKg },
    update: { weightKg },
  });
  return { ok: true };
}

export async function listWeightHistory(fromDate?: string, toDate?: string) {
  return prisma.weightLog.findMany({
    where: {
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
    orderBy: { date: "asc" },
  });
}
