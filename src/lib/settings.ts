import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import type { Settings } from "@/generated/prisma/client";

// Memoizado por request — varios loaders (hábitos, entrenamientos) necesitan
// settings cada uno, y sin esto cada uno volvería a consultarlo por separado.
export const getSettings = cache(async (): Promise<Settings> => {
  const userId = await requireUserId();
  const existing = await prisma.settings.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.settings.create({ data: { userId } });
});

export async function updateGymWeekdays(weekdays: number[]) {
  const userId = await requireUserId();
  const clean = Array.from(new Set(weekdays.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))).sort();
  await prisma.settings.upsert({
    where: { userId },
    create: { userId, gymWeekdays: clean },
    update: { gymWeekdays: clean },
  });
}
