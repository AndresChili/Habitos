import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import type { Equipment, MuscleGroup } from "@/generated/prisma/client";

export type ExerciseInput = {
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment;
  instructions?: string | null;
};

export async function listExercises(includeArchived = false) {
  const userId = await requireUserId();
  return prisma.exercise.findMany({
    where: { userId, ...(includeArchived ? {} : { archivedAt: null }) },
    orderBy: [{ primaryMuscle: "asc" }, { name: "asc" }],
  });
}

export async function getExercise(id: string) {
  const userId = await requireUserId();
  return prisma.exercise.findFirst({ where: { id, userId } });
}

export async function createExercise(
  input: ExerciseInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "El nombre no puede estar vacío." };

  const exercise = await prisma.exercise.create({
    data: {
      userId,
      name,
      primaryMuscle: input.primaryMuscle,
      secondaryMuscles: input.secondaryMuscles ?? [],
      equipment: input.equipment,
      instructions: input.instructions?.trim() || null,
    },
  });
  return { ok: true, id: exercise.id };
}

export async function updateExercise(
  id: string,
  input: ExerciseInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "El nombre no puede estar vacío." };

  const result = await prisma.exercise.updateMany({
    where: { id, userId },
    data: {
      name,
      primaryMuscle: input.primaryMuscle,
      secondaryMuscles: input.secondaryMuscles ?? [],
      equipment: input.equipment,
      instructions: input.instructions?.trim() || null,
    },
  });
  if (result.count === 0) return { ok: false, error: "Ejercicio no encontrado." };
  return { ok: true };
}

// Se archiva, nunca se borra de verdad — así las filas WorkoutExercise/
// RoutineExercise que lo referencian se mantienen válidas (ver el comentario
// del modelo Exercise en schema.prisma).
export async function archiveExercise(id: string) {
  const userId = await requireUserId();
  await prisma.exercise.updateMany({ where: { id, userId }, data: { archivedAt: new Date() } });
}

export async function restoreExercise(id: string) {
  const userId = await requireUserId();
  await prisma.exercise.updateMany({ where: { id, userId }, data: { archivedAt: null } });
}
