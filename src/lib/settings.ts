import { prisma } from "@/lib/db";
import type { Settings } from "@/generated/prisma/client";

const SETTINGS_ID = 1;

export async function getSettings(): Promise<Settings> {
  const existing = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: SETTINGS_ID } });
}
