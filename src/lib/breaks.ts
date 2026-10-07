import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import type { Break, BreakReason } from "@/generated/prisma/client";

export type BreakRange = { fromDate: string; toDate: string | null };

export async function listBreaks(): Promise<Break[]> {
  const userId = await requireUserId();
  return prisma.break.findMany({ where: { userId }, orderBy: { fromDate: "desc" } });
}

// Todos los rangos de pausa de la cuenta — se usa desde hábitos y gimnasio
// para saber si una fecha cae dentro de alguno, sin volver a consultar la
// tabla por cada hábito o cada día del calendario.
export async function getBreakRanges(): Promise<BreakRange[]> {
  const userId = await requireUserId();
  return prisma.break.findMany({ where: { userId }, select: { fromDate: true, toDate: true } });
}

export function isDateInBreak(breaks: BreakRange[], date: string): boolean {
  return breaks.some((b) => date >= b.fromDate && (b.toDate === null || date <= b.toDate));
}

// La pausa (si hay alguna) que cubre justo esta fecha — para mostrar el
// aviso en "Hoy". Si hay varias superpuestas, la más reciente por fecha de
// inicio gana, que es la más probable de ser la relevante ahora.
export async function getBreakOnDate(date: string): Promise<Break | null> {
  const userId = await requireUserId();
  return prisma.break.findFirst({
    where: { userId, fromDate: { lte: date }, OR: [{ toDate: null }, { toDate: { gte: date } }] },
    orderBy: { fromDate: "desc" },
  });
}

export async function createBreak(
  fromDate: string,
  toDate: string | null,
  reason: BreakReason,
  note: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) return { ok: false, error: "Fecha de inicio inválida." };
  if (toDate !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(toDate)) return { ok: false, error: "Fecha de fin inválida." };
    if (toDate < fromDate) return { ok: false, error: "La fecha de fin no puede ser anterior a la de inicio." };
  }

  await prisma.break.create({
    data: { userId, fromDate, toDate, reason, note: note?.trim() || null },
  });
  return { ok: true };
}

export async function deleteBreak(id: string) {
  const userId = await requireUserId();
  await prisma.break.deleteMany({ where: { id, userId } });
}
