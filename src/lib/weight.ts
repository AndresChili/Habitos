import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";

export async function getWeightForDate(date: string) {
  const userId = await requireUserId();
  return prisma.weightLog.findUnique({ where: { userId_date: { userId, date } } });
}

// La entrada más reciente estrictamente anterior a `date` — se usa para
// sugerir un valor inicial cuando hoy todavía no tiene entrada, sin importar
// cuántos días hace que fue. Nunca se escribe sola en la BD; solo sirve para
// rellenar el input por defecto.
export async function getLatestWeightBefore(date: string) {
  const userId = await requireUserId();
  return prisma.weightLog.findFirst({
    where: { userId, date: { lt: date } },
    orderBy: { date: "desc" },
  });
}

// Una entrada por día, introducida desde "Hoy" — upsert para que volver a
// introducir el mismo día lo corrija.
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
