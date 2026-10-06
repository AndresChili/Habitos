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

function cleanWeekdays(weekdays: number[]): number[] {
  return Array.from(new Set(weekdays.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))).sort();
}

// Un día de la semana pertenece como mucho a una rutina — asignarlo aquí lo
// quita de cualquier otra rutina de este usuario que lo tuviera.
async function claimWeekdaysExclusively(userId: string, routineId: string | null, weekdays: number[]) {
  if (weekdays.length === 0) return;
  const others = await prisma.routine.findMany({
    where: { userId, id: routineId ? { not: routineId } : undefined, archivedAt: null },
    select: { id: true, weekdays: true },
  });
  const conflicting = others.filter((r) => r.weekdays.some((d) => weekdays.includes(d)));
  await Promise.all(
    conflicting.map((r) =>
      prisma.routine.update({ where: { id: r.id }, data: { weekdays: r.weekdays.filter((d) => !weekdays.includes(d)) } })
    )
  );
}

export async function createRoutine(
  name: string,
  description?: string | null,
  weekdays: number[] = []
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "El nombre no puede estar vacío." };

  const clean = cleanWeekdays(weekdays);
  await claimWeekdaysExclusively(userId, null, clean);
  const routine = await prisma.routine.create({
    data: { userId, name: trimmed, description: description?.trim() || null, weekdays: clean },
  });
  return { ok: true, id: routine.id };
}

export async function updateRoutineWeekdays(id: string, weekdays: number[]) {
  const userId = await requireUserId();
  const clean = cleanWeekdays(weekdays);
  await claimWeekdaysExclusively(userId, id, clean);
  await prisma.routine.updateMany({ where: { id, userId }, data: { weekdays: clean } });
}

// La rutina asignada a un día de la semana dado (1=lunes..7=domingo), si existe.
export async function getRoutineForWeekday(weekday: number) {
  const userId = await requireUserId();
  return prisma.routine.findFirst({ where: { userId, archivedAt: null, weekdays: { has: weekday } } });
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

// Borrado real, pedido explícitamente — los WorkoutSession pasados sobreviven
// porque WorkoutSession.routineId es onDelete: SetNull y routineName es una
// foto fija tomada al empezar la sesión, así el historial se sigue leyendo bien.
export async function deleteRoutine(id: string) {
  const userId = await requireUserId();
  await prisma.routine.deleteMany({ where: { id, userId } });
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

// `orderedIds` es la lista completa de ids de RoutineExercise de esta rutina,
// en el nuevo orden deseado.
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
