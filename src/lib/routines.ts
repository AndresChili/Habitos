import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";

export async function listRoutines(includeArchived = false) {
  const userId = await requireUserId();
  return prisma.routine.findMany({
    where: includeArchived ? { userId } : { userId, archivedAt: null },
    include: { exercises: { include: { exercise: true }, orderBy: { order: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRoutine(id: string) {
  const userId = await requireUserId();
  return prisma.routine.findFirst({
    where: { id, userId },
    include: { exercises: { include: { exercise: true }, orderBy: { order: "asc" } } },
  });
}

export async function createRoutine(
  name: string,
  description?: string | null
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "El nombre no puede estar vacío." };

  const routine = await prisma.routine.create({
    data: { userId, name: trimmed, description: description?.trim() || null },
  });
  return { ok: true, id: routine.id };
}

export async function updateRoutine(
  id: string,
  name: string,
  description?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "El nombre no puede estar vacío." };

  await prisma.routine.updateMany({
    where: { id, userId },
    data: { name: trimmed, description: description?.trim() || null },
  });
  return { ok: true };
}

export async function archiveRoutine(id: string) {
  const userId = await requireUserId();
  await prisma.routine.updateMany({ where: { id, userId }, data: { archivedAt: new Date() } });
}

export async function restoreRoutine(id: string) {
  const userId = await requireUserId();
  await prisma.routine.updateMany({ where: { id, userId }, data: { archivedAt: null } });
}

// Real delete, requested explicitly — past WorkoutSessions survive because
// WorkoutSession.routineId is onDelete: SetNull and routineName is a
// snapshot taken at session start, so history keeps reading correctly.
export async function deleteRoutine(id: string) {
  const userId = await requireUserId();
  await prisma.routine.deleteMany({ where: { id, userId } });
}

export async function duplicateRoutine(
  id: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const original = await prisma.routine.findFirst({
    where: { id, userId },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  if (!original) return { ok: false, error: "Rutina no encontrada." };

  const copy = await prisma.routine.create({
    data: {
      userId,
      name: `${original.name} (copia)`,
      description: original.description,
      exercises: {
        create: original.exercises.map((re) => ({
          userId,
          exerciseId: re.exerciseId,
          order: re.order,
          targetRepMin: re.targetRepMin,
          targetRepMax: re.targetRepMax,
        })),
      },
    },
  });
  return { ok: true, id: copy.id };
}

export async function addExerciseToRoutine(
  routineId: string,
  exerciseId: string,
  targetRepMin?: number | null,
  targetRepMax?: number | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const [routine, exercise] = await Promise.all([
    prisma.routine.findFirst({ where: { id: routineId, userId } }),
    prisma.exercise.findFirst({ where: { id: exerciseId, userId } }),
  ]);
  if (!routine) return { ok: false, error: "Rutina no encontrada." };
  if (!exercise) return { ok: false, error: "Ejercicio no encontrado." };

  const last = await prisma.routineExercise.findFirst({
    where: { routineId },
    orderBy: { order: "desc" },
  });
  await prisma.routineExercise.create({
    data: {
      routineId,
      userId,
      exerciseId,
      order: (last?.order ?? -1) + 1,
      targetRepMin: targetRepMin ?? null,
      targetRepMax: targetRepMax ?? null,
    },
  });
  return { ok: true };
}

export async function updateRoutineExerciseTarget(
  id: string,
  targetRepMin?: number | null,
  targetRepMax?: number | null
) {
  const userId = await requireUserId();
  await prisma.routineExercise.updateMany({
    where: { id, userId },
    data: { targetRepMin: targetRepMin ?? null, targetRepMax: targetRepMax ?? null },
  });
}

export async function removeExerciseFromRoutine(id: string) {
  const userId = await requireUserId();
  await prisma.routineExercise.deleteMany({ where: { id, userId } });
}

// `orderedIds` is the full list of RoutineExercise ids for this routine, in
// the desired new order.
export async function reorderRoutineExercises(routineId: string, orderedIds: string[]) {
  const userId = await requireUserId();
  const owned = await prisma.routineExercise.findMany({
    where: { routineId, userId, id: { in: orderedIds } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((r) => r.id));

  await prisma.$transaction(
    orderedIds
      .filter((id) => ownedIds.has(id))
      .map((id, index) => prisma.routineExercise.update({ where: { id }, data: { order: index } }))
  );
}
