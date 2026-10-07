import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import { getSettings } from "@/lib/settings";
import { getBreakRanges, isDateInBreak } from "@/lib/breaks";
import { getRoutineForWeekday } from "@/lib/routines";
import { dayKey, isoWeekday, nowInTz } from "@/lib/dates";
import type { SetType } from "@/generated/prisma/client";

// ---- Sesiones ----

// Retoma una sesión en curso de esta rutina si ya existe, o crea una nueva
// precargada con la lista actual de ejercicios de la rutina (en orden). Se
// crea en la BD al instante (no se mantiene en estado del cliente) para que
// cerrar la app a mitad de entreno nunca pierda el progreso.
export async function startOrResumeSession(
  routineId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const userId = await requireUserId();

  const existing = await prisma.workoutSession.findFirst({
    where: { userId, routineId, status: "IN_PROGRESS" },
  });
  if (existing) return { ok: true, id: existing.id };

  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  if (!routine) return { ok: false, error: "Rutina no encontrada." };

  const settings = await getSettings();
  const session = await prisma.workoutSession.create({
    data: {
      userId,
      routineId: routine.id,
      routineName: routine.name,
      dateKey: dayKey(nowInTz(settings.timezone)),
      exercises: {
        create: routine.exercises.map((re) => ({
          userId,
          exerciseId: re.exerciseId,
          order: re.order,
        })),
      },
    },
  });
  return { ok: true, id: session.id };
}

// ---- Integración con "Hoy" ----

// assignedRoutine es la rutina asignada de forma permanente al día de la
// semana actual (Routine.weekdays) — es solo una sugerencia por defecto.
// `session` es lo que de verdad se empezó hoy, que puede ser una rutina
// *distinta* (el usuario eligió "Cambiar rutina") o ninguna (libre) — por eso
// buscamos cualquier sesión de hoy, no una limitada a assignedRoutine.
export type TodayGymStatus =
  | { scheduled: false }
  | {
      scheduled: true;
      assignedRoutine: { id: string; name: string } | null;
      session:
        | {
            id: string;
            status: "IN_PROGRESS" | "COMPLETED";
            routineName: string;
            exercisesTotal: number;
            exercisesDone: number;
          }
        | null;
    };

export async function getTodayGymStatus(): Promise<TodayGymStatus> {
  const settings = await getSettings();
  const today = nowInTz(settings.timezone);
  const todayWeekday = isoWeekday(today);
  const breaks = await getBreakRanges();
  // Un día de descanso de cuenta (vacaciones, enfermedad) anula el día de
  // gimnasio asignado, igual que si ese día de la semana no tuviera rutina.
  const isScheduledDay = settings.gymWeekdays.includes(todayWeekday) && !isDateInBreak(breaks, dayKey(today));

  const userId = await requireUserId();
  const [routine, session] = await Promise.all([
    isScheduledDay ? getRoutineForWeekday(todayWeekday) : Promise.resolve(null),
    prisma.workoutSession.findFirst({
      where: { userId, dateKey: dayKey(today) },
      orderBy: { startedAt: "desc" },
      include: { exercises: { select: { sets: { select: { id: true }, take: 1 } } } },
    }),
  ]);

  // Un entreno empezado hoy (ej. libre, o antes de cambiar la programación)
  // tiene que seguir apareciendo y poder retomarse aunque hoy no tenga rutina
  // asignada — la tarjeta solo se oculta cuando de verdad no hay nada.
  if (!isScheduledDay && !session) return { scheduled: false };

  return {
    scheduled: true,
    assignedRoutine: routine ? { id: routine.id, name: routine.name } : null,
    session: session
      ? {
          id: session.id,
          status: session.status,
          routineName: session.routineName,
          exercisesTotal: session.exercises.length,
          exercisesDone: session.exercises.filter((e) => e.sets.length > 0).length,
        }
      : null,
  };
}

// Una sesión suelta no ligada a ninguna Routine — "hoy monto el entreno a
// mano". Nunca toca Routine.weekdays ni la lista de ejercicios de ninguna rutina.
export async function startFreeformSession(
  name?: string
): Promise<{ ok: true; id: string }> {
  const userId = await requireUserId();
  const settings = await getSettings();
  const today = dayKey(nowInTz(settings.timezone));

  const existing = await prisma.workoutSession.findFirst({
    where: { userId, routineId: null, dateKey: today, status: "IN_PROGRESS" },
  });
  if (existing) return { ok: true, id: existing.id };

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      routineId: null,
      routineName: name?.trim() || "Entrenamiento libre",
      dateKey: today,
    },
  });
  return { ok: true, id: session.id };
}

// ---- Cambios de ejercicios solo de la sesión (nunca tocan la plantilla Routine) ----

export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const [session, exercise] = await Promise.all([
    prisma.workoutSession.findFirst({ where: { id: sessionId, userId, status: "IN_PROGRESS" } }),
    prisma.exercise.findFirst({ where: { id: exerciseId, userId } }),
  ]);
  if (!session) return { ok: false, error: "Entrenamiento no encontrado." };
  if (!exercise) return { ok: false, error: "Ejercicio no encontrado." };

  const last = await prisma.workoutExercise.findFirst({
    where: { workoutSessionId: sessionId },
    orderBy: { order: "desc" },
  });
  await prisma.workoutExercise.create({
    data: { workoutSessionId: sessionId, userId, exerciseId, order: (last?.order ?? -1) + 1 },
  });
  return { ok: true };
}

// Quita este ejercicio (y las series registradas en él) solo de la sesión de
// hoy — la Routine de la que vino, y el historial de cualquier otro día, no se tocan.
export async function removeExerciseFromSession(workoutExerciseId: string) {
  const userId = await requireUserId();
  await prisma.workoutExercise.deleteMany({
    where: { id: workoutExerciseId, userId, workoutSession: { status: "IN_PROGRESS" } },
  });
}

export async function getSession(id: string) {
  const userId = await requireUserId();
  return prisma.workoutSession.findFirst({
    where: { id, userId },
    include: {
      exercises: {
        include: { exercise: true, sets: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function finishSession(id: string) {
  const userId = await requireUserId();
  await prisma.workoutSession.updateMany({
    where: { id, userId, status: "IN_PROGRESS" },
    data: { status: "COMPLETED", finishedAt: new Date() },
  });
}

// Borra una sesión entera (en curso o completada) con sus ejercicios y
// series — ej. una prueba. A diferencia de finalizar, esto la elimina del
// todo, así deja de contar para los récords y de aparecer en Hoy.
export async function deleteSession(id: string) {
  const userId = await requireUserId();
  await prisma.workoutSession.deleteMany({ where: { id, userId } });
}

// Todas las sesiones (cualquier estado) cuyo dateKey cae dentro del mes dado
// — dateKey es "yyyy-MM-dd", así que comparar como string plano es seguro aquí.
export async function listSessionsForMonth(monthKey: string) {
  const userId = await requireUserId();
  const sessions = await prisma.workoutSession.findMany({
    where: { userId, dateKey: { gte: `${monthKey}-01`, lte: `${monthKey}-31` } },
    orderBy: { startedAt: "asc" },
    select: { id: true, dateKey: true, routineName: true, status: true },
  });

  const byDate = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const arr = byDate.get(s.dateKey) ?? [];
    arr.push(s);
    byDate.set(s.dateKey, arr);
  }
  return byDate;
}

export async function listSessions(limit = 30) {
  const userId = await requireUserId();
  return prisma.workoutSession.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { exercises: { include: { exercise: true } } },
  });
}

// ---- Series ----

// Todas las series (sin contar calentamientos) registradas jamás para este
// ejercicio, en cualquier sesión (completada o todavía en curso) — la base
// contra la que se compara una serie nueva para decidir si es PR.
// `excludeSetId` permite que una serie en edición se compare contra todo lo
// demás, no contra su propio valor desactualizado.
export async function getPrHistory(exerciseId: string, excludeSetId?: string): Promise<PrHistoryEntry[]> {
  const userId = await requireUserId();
  return prisma.setEntry.findMany({
    where: {
      userId,
      setType: { not: "WARMUP" },
      workoutExercise: { exerciseId },
      ...(excludeSetId ? { id: { not: excludeSetId } } : {}),
    },
    select: { weightKg: true, reps: true },
  });
}

export type PrHistoryEntry = { weightKg: number; reps: number };

// Una serie es PR si ninguna serie anterior iguala o supera tanto su peso
// como sus repeticiones a la vez — así 70kg×9 es PR aunque el peso máximo
// histórico sea 80kg, porque nadie hizo antes 70kg con 9 o más repeticiones.
function isNewPr(setType: SetType, weightKg: number, reps: number, history: PrHistoryEntry[]): boolean {
  if (setType === "WARMUP") return false;
  return !history.some((h) => h.weightKg >= weightKg && h.reps >= reps);
}

export async function addSet(
  workoutExerciseId: string,
  weightKg: number,
  reps: number,
  setType: SetType
): Promise<{ ok: true; id: string; isPr: boolean } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 500) {
    return { ok: false, error: "Peso inválido." };
  }
  if (!Number.isInteger(reps) || reps < 1 || reps > 100) {
    return { ok: false, error: "Repeticiones inválidas." };
  }

  const workoutExercise = await prisma.workoutExercise.findFirst({
    where: { id: workoutExerciseId, userId },
  });
  if (!workoutExercise) return { ok: false, error: "Ejercicio de sesión no encontrado." };

  const [last, history] = await Promise.all([
    prisma.setEntry.findFirst({ where: { workoutExerciseId }, orderBy: { order: "desc" } }),
    getPrHistory(workoutExercise.exerciseId),
  ]);
  const isPr = isNewPr(setType, weightKg, reps, history);
  const set = await prisma.setEntry.create({
    data: { workoutExerciseId, userId, order: (last?.order ?? -1) + 1, weightKg, reps, setType, isPr },
  });
  return { ok: true, id: set.id, isPr };
}

export async function updateSet(
  id: string,
  weightKg: number,
  reps: number,
  setType: SetType
): Promise<{ ok: true; isPr: boolean } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 500) {
    return { ok: false, error: "Peso inválido." };
  }
  if (!Number.isInteger(reps) || reps < 1 || reps > 100) {
    return { ok: false, error: "Repeticiones inválidas." };
  }

  const existing = await prisma.setEntry.findFirst({
    where: { id, userId },
    include: { workoutExercise: { select: { exerciseId: true } } },
  });
  if (!existing) return { ok: false, error: "Serie no encontrada." };

  const history = await getPrHistory(existing.workoutExercise.exerciseId, id);
  const isPr = isNewPr(setType, weightKg, reps, history);
  await prisma.setEntry.updateMany({ where: { id, userId }, data: { weightKg, reps, setType, isPr } });
  return { ok: true, isPr };
}

export async function deleteSet(id: string) {
  const userId = await requireUserId();
  await prisma.setEntry.deleteMany({ where: { id, userId } });
}

// Las series completadas más recientes registradas para este ejercicio, de
// cualquier sesión que no sea la que está en curso ahora — "última vez: X kg × Y".
export async function getLastPerformance(exerciseId: string, excludeSessionId?: string) {
  const userId = await requireUserId();
  const lastEntry = await prisma.workoutExercise.findFirst({
    where: {
      userId,
      exerciseId,
      workoutSessionId: excludeSessionId ? { not: excludeSessionId } : undefined,
      workoutSession: { status: "COMPLETED" },
    },
    orderBy: { workoutSession: { startedAt: "desc" } },
    include: { sets: { orderBy: { order: "asc" } }, workoutSession: { select: { startedAt: true } } },
  });
  if (!lastEntry || lastEntry.sets.length === 0) return null;
  return { date: lastEntry.workoutSession.startedAt, sets: lastEntry.sets };
}

// ---- Historial ----

export async function listExerciseHistory(exerciseId: string, limit = 20) {
  const userId = await requireUserId();
  return prisma.workoutExercise.findMany({
    where: { userId, exerciseId, workoutSession: { status: "COMPLETED" } },
    orderBy: { workoutSession: { startedAt: "desc" } },
    take: limit,
    include: { sets: { orderBy: { order: "asc" } }, workoutSession: { select: { startedAt: true, routineName: true } } },
  });
}

// Borra un registro pasado (un ejercicio registrado dentro de una sesión
// terminada, con sus series) — ej. datos de prueba. Los PR/récords se
// recalculan automáticamente, ya que se derivan de esta tabla y no se guardan aparte.
export async function deleteHistoryEntry(workoutExerciseId: string) {
  const userId = await requireUserId();
  await prisma.workoutExercise.deleteMany({
    where: { id: workoutExerciseId, userId, workoutSession: { status: "COMPLETED" } },
  });
}

// ---- Récords personales ----

export type ExercisePRs = {
  exerciseId: string;
  exerciseName: string;
  bestWeight: { weightKg: number; reps: number; date: Date } | null;
  bestReps: { weightKg: number; reps: number; date: Date } | null;
  bestVolume: { volume: number; date: Date } | null;
  bestEstimatedOneRm: { value: number; weightKg: number; reps: number; date: Date } | null;
};

function estimateOneRm(weightKg: number, reps: number): number | null {
  if (reps > 15) return null; // A partir de aquí la fórmula de Epley deja de ser fiable — mejor no fingir que no
  return weightKg * (1 + reps / 30);
}

export async function computeExercisePRs(exerciseId: string): Promise<ExercisePRs | null> {
  const userId = await requireUserId();
  const exercise = await prisma.exercise.findFirst({ where: { id: exerciseId, userId } });
  if (!exercise) return null;

  const entries = await prisma.workoutExercise.findMany({
    where: { userId, exerciseId, workoutSession: { status: "COMPLETED" } },
    include: { sets: true, workoutSession: { select: { startedAt: true } } },
  });

  let bestWeight: ExercisePRs["bestWeight"] = null;
  let bestReps: ExercisePRs["bestReps"] = null;
  let bestVolume: ExercisePRs["bestVolume"] = null;
  let bestEstimatedOneRm: ExercisePRs["bestEstimatedOneRm"] = null;

  for (const entry of entries) {
    const date = entry.workoutSession.startedAt;
    let sessionVolume = 0;

    for (const set of entry.sets) {
      if (set.setType === "WARMUP") continue;
      sessionVolume += set.weightKg * set.reps;

      if (!bestWeight || set.weightKg > bestWeight.weightKg) {
        bestWeight = { weightKg: set.weightKg, reps: set.reps, date };
      }
      if (!bestReps || set.reps > bestReps.reps) {
        bestReps = { weightKg: set.weightKg, reps: set.reps, date };
      }
      const e1rm = estimateOneRm(set.weightKg, set.reps);
      if (e1rm !== null && (!bestEstimatedOneRm || e1rm > bestEstimatedOneRm.value)) {
        bestEstimatedOneRm = { value: e1rm, weightKg: set.weightKg, reps: set.reps, date };
      }
    }

    if (sessionVolume > 0 && (!bestVolume || sessionVolume > bestVolume.volume)) {
      bestVolume = { volume: sessionVolume, date };
    }
  }

  return { exerciseId, exerciseName: exercise.name, bestWeight, bestReps, bestVolume, bestEstimatedOneRm };
}

// Todos los PR de cada ejercicio que el usuario haya registrado alguna vez — para la página de Récords.
export async function listAllPRs(): Promise<ExercisePRs[]> {
  const userId = await requireUserId();
  const exerciseIds = await prisma.workoutExercise.findMany({
    where: { userId, workoutSession: { status: "COMPLETED" } },
    select: { exerciseId: true },
    distinct: ["exerciseId"],
  });

  const prs = await Promise.all(exerciseIds.map((e) => computeExercisePRs(e.exerciseId)));
  return prs
    .filter((p): p is ExercisePRs => p !== null)
    .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}

// ---- Sugerencias (conservadoras, observacionales, nunca prescriptivas) ----

export type Suggestion = { kind: "improved_reps" | "improved_weight" | "plateau" | "pr"; text: string };

function bestComparableSet(sets: { weightKg: number; reps: number; setType: SetType }[]) {
  const topSet = sets.find((s) => s.setType === "TOP_SET");
  if (topSet) return topSet;
  const working = sets.filter((s) => s.setType !== "WARMUP");
  if (working.length === 0) return null;
  return working.reduce((best, s) => (s.weightKg > best.weightKg ? s : best), working[0]);
}

export async function getSuggestion(exerciseId: string, currentSessionId: string): Promise<Suggestion | null> {
  const [last, current] = await Promise.all([
    getLastPerformance(exerciseId, currentSessionId),
    getSession(currentSessionId),
  ]);
  if (!last) return null;

  const currentEntry = current?.exercises.find((e) => e.exerciseId === exerciseId);
  if (!currentEntry || currentEntry.sets.length === 0) return null;

  const lastBest = bestComparableSet(last.sets);
  const currentBest = bestComparableSet(currentEntry.sets);
  if (!lastBest || !currentBest) return null;

  if (currentBest.weightKg > lastBest.weightKg) {
    return { kind: "improved_weight", text: `Nuevo peso: ${currentBest.weightKg}kg (antes ${lastBest.weightKg}kg).` };
  }
  if (currentBest.weightKg === lastBest.weightKg && currentBest.reps > lastBest.reps) {
    return {
      kind: "improved_reps",
      text: `Has mejorado ${currentBest.reps - lastBest.reps} rep. respecto a tu última sesión con este peso.`,
    };
  }
  if (currentBest.weightKg === lastBest.weightKg && currentBest.reps === lastBest.reps) {
    return { kind: "plateau", text: "Mismo peso y repeticiones que tu última sesión." };
  }
  return null;
}
