import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import { getSettings } from "@/lib/settings";
import { getRoutineForWeekday } from "@/lib/routines";
import { dayKey, isoWeekday, nowInTz } from "@/lib/dates";
import type { SetType } from "@/generated/prisma/client";

// ---- Sessions ----

// Resumes an existing in-progress session for this routine if there is one,
// otherwise creates a new one pre-populated with the routine's current
// exercise list (in order). Created immediately in the DB (not held in
// client state) so closing the app mid-workout never loses progress.
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

// ---- "Hoy" integration ----

// assignedRoutine is whichever routine is permanently assigned to today's
// weekday (Routine.weekdays) — it's only a default suggestion. `session` is
// whatever was actually started today, which may run a *different* routine
// (the user chose "Cambiar rutina") or no routine at all (freeform) — so we
// look up any session for today, not one scoped to assignedRoutine.
export type TodayGymStatus =
  | { scheduled: false }
  | {
      scheduled: true;
      assignedRoutine: { id: string; name: string } | null;
      session: { id: string; status: "IN_PROGRESS" | "COMPLETED"; routineName: string } | null;
    };

export async function getTodayGymStatus(): Promise<TodayGymStatus> {
  const settings = await getSettings();
  const today = nowInTz(settings.timezone);
  const todayWeekday = isoWeekday(today);
  if (!settings.gymWeekdays.includes(todayWeekday)) return { scheduled: false };

  const userId = await requireUserId();
  const [routine, session] = await Promise.all([
    getRoutineForWeekday(todayWeekday),
    prisma.workoutSession.findFirst({
      where: { userId, dateKey: dayKey(today) },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  return {
    scheduled: true,
    assignedRoutine: routine ? { id: routine.id, name: routine.name } : null,
    session: session ? { id: session.id, status: session.status, routineName: session.routineName } : null,
  };
}

// A one-off session not tied to any Routine — "I'll build today's workout
// manually." Never touches Routine.weekdays or any routine's exercise list.
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

// ---- Session-only exercise changes (never touch the Routine template) ----

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

// Removes this exercise (and any sets logged for it) from today's session
// only — the Routine it came from, and every other day's history, is
// untouched.
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

export async function listSessions(limit = 30) {
  const userId = await requireUserId();
  return prisma.workoutSession.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { exercises: { include: { exercise: true } } },
  });
}

// ---- Sets ----

export async function addSet(
  workoutExerciseId: string,
  weightKg: number,
  reps: number,
  setType: SetType
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
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

  const last = await prisma.setEntry.findFirst({
    where: { workoutExerciseId },
    orderBy: { order: "desc" },
  });
  const set = await prisma.setEntry.create({
    data: { workoutExerciseId, userId, order: (last?.order ?? -1) + 1, weightKg, reps, setType },
  });
  return { ok: true, id: set.id };
}

export async function updateSet(
  id: string,
  weightKg: number,
  reps: number,
  setType: SetType
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 500) {
    return { ok: false, error: "Peso inválido." };
  }
  if (!Number.isInteger(reps) || reps < 1 || reps > 100) {
    return { ok: false, error: "Repeticiones inválidas." };
  }
  await prisma.setEntry.updateMany({ where: { id, userId }, data: { weightKg, reps, setType } });
  return { ok: true };
}

export async function deleteSet(id: string) {
  const userId = await requireUserId();
  await prisma.setEntry.deleteMany({ where: { id, userId } });
}

// The most recent completed sets logged for this exercise, from any session
// other than the one currently in progress — "última vez: X kg × Y".
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

// ---- History ----

export async function listExerciseHistory(exerciseId: string, limit = 20) {
  const userId = await requireUserId();
  return prisma.workoutExercise.findMany({
    where: { userId, exerciseId, workoutSession: { status: "COMPLETED" } },
    orderBy: { workoutSession: { startedAt: "desc" } },
    take: limit,
    include: { sets: { orderBy: { order: "asc" } }, workoutSession: { select: { startedAt: true, routineName: true } } },
  });
}

// ---- PRs ----

export type ExercisePRs = {
  exerciseId: string;
  exerciseName: string;
  bestWeight: { weightKg: number; reps: number; date: Date } | null;
  bestReps: { weightKg: number; reps: number; date: Date } | null;
  bestVolume: { volume: number; date: Date } | null;
  bestEstimatedOneRm: { value: number; weightKg: number; reps: number; date: Date } | null;
};

function estimateOneRm(weightKg: number, reps: number): number | null {
  if (reps > 15) return null; // Epley gets unreliable past this — don't pretend otherwise
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

// All PRs across every exercise the user has ever logged — for the Récords page.
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

// ---- Suggestions (conservative, observational, never prescriptive) ----

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
