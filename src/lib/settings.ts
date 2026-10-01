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
