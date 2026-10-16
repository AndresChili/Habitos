// Reglas de negocio puras (sin BD, sin "server-only") que viven aquí en vez
// de en habits.ts/breaks.ts/workouts.ts para poder probarlas con tests
// unitarios rápidos, sin necesitar una conexión real a la base de datos.
import type { HabitPause, SetType } from "@/generated/prisma/client";

export type BreakRange = { fromDate: string; toDate: string | null };

export function isDateInBreak(breaks: BreakRange[], date: string): boolean {
  return breaks.some((b) => date >= b.fromDate && (b.toDate === null || date <= b.toDate));
}

export function isPausedOn(pauses: HabitPause[], date: string): boolean {
  return pauses.some((p) => date >= p.fromDate && (p.toDate === null || date <= p.toDate));
}

export function isCurrentlyPaused(pauses: HabitPause[]): boolean {
  return pauses.some((p) => p.toDate === null);
}

export type PrHistoryEntry = { weightKg: number; reps: number };

// El PR es siempre el peso máximo levantado — nunca una serie con menos
// peso que el máximo histórico, por muchas repeticiones que haga. Solo hay
// una excepción: igualar el peso máximo actual con más repeticiones que
// las que se hicieron la vez que se levantó ese mismo peso máximo también
// cuenta como PR (progresar en reps sin perder el récord de peso).
export function isNewPr(
  setType: SetType,
  weightKg: number,
  reps: number,
  history: PrHistoryEntry[]
): boolean {
  if (setType === "WARMUP") return false;
  if (history.length === 0) return true;
  const bestWeight = Math.max(...history.map((h) => h.weightKg));
  if (weightKg > bestWeight) return true;
  if (weightKg < bestWeight) return false;
  const bestRepsAtMaxWeight = Math.max(...history.filter((h) => h.weightKg === bestWeight).map((h) => h.reps));
  return reps > bestRepsAtMaxWeight;
}

export function estimateOneRm(weightKg: number, reps: number): number | null {
  if (reps > 15) return null; // A partir de aquí la fórmula de Epley deja de ser fiable — mejor no fingir que no
  return weightKg * (1 + reps / 30);
}
