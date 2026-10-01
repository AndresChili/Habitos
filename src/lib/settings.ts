import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import type { Settings } from "@/generated/prisma/client";

export async function getSettings(): Promise<Settings> {
  const userId = await requireUserId();
  const existing = await prisma.settings.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.settings.create({ data: { userId } });
}

export async function updateGymWeekdays(weekdays: number[]) {
  const userId = await requireUserId();
  const clean = Array.from(new Set(weekdays.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))).sort();
  await prisma.settings.upsert({
    where: { userId },
    create: { userId, gymWeekdays: clean },
    update: { gymWeekdays: clean },
  });
}
