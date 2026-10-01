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

// Visible to a user: global (seeded, userId null) + their own custom ones.
export async function listExercises(includeArchived = false) {
  const userId = await requireUserId();
  return prisma.exercise.findMany({
    where: {
      OR: [{ userId: null }, { userId }],
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: [{ primaryMuscle: "asc" }, { name: "asc" }],
  });
}

export async function getExercise(id: string) {
  const userId = await requireUserId();
  return prisma.exercise.findFirst({ where: { id, OR: [{ userId: null }, { userId }] } });
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

// Only the user's own custom exercises can be archived — global ones (userId
// null) are excluded by this filter automatically, never hard-deleted either
// way, so WorkoutExercise/RoutineExercise rows referencing them stay valid.
export async function archiveExercise(id: string) {
  const userId = await requireUserId();
  await prisma.exercise.updateMany({ where: { id, userId }, data: { archivedAt: new Date() } });
}

export async function restoreExercise(id: string) {
  const userId = await requireUserId();
  await prisma.exercise.updateMany({ where: { id, userId }, data: { archivedAt: null } });
}
