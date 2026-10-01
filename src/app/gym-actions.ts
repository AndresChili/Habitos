"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addExerciseToRoutine,
  createRoutine,
  deleteRoutine,
  duplicateRoutine,
  removeExerciseFromRoutine,
  reorderRoutineExercises,
  updateRoutine,
  updateRoutineExerciseTarget,
  updateRoutineWeekdays,
} from "@/lib/routines";
import { createExercise, type ExerciseInput } from "@/lib/exercises";
import { updateGymWeekdays } from "@/lib/settings";
import {
  addExerciseToSession,
  addSet,
  deleteSet,
  finishSession,
  removeExerciseFromSession,
  startOrResumeSession,
  updateSet,
} from "@/lib/workouts";
import type { SetType } from "@/generated/prisma/client";

// ---- Ejercicios ----

export async function createExerciseAction(input: ExerciseInput) {
  const result = await createExercise(input);
  revalidatePath("/gimnasio/ejercicios");
  return result;
}

// ---- Rutinas ----

export async function createRoutineAction(name: string, description?: string, weekdays: number[] = []) {
  const result = await createRoutine(name, description, weekdays);
  revalidatePath("/gimnasio");
  revalidatePath("/");
  return result;
}

export async function updateRoutineAction(id: string, name: string, description?: string) {
  const result = await updateRoutine(id, name, description);
  revalidatePath(`/gimnasio/rutinas/${id}`);
  revalidatePath("/gimnasio");
  return result;
}

export async function updateRoutineWeekdaysAction(id: string, weekdays: number[]) {
  await updateRoutineWeekdays(id, weekdays);
  revalidatePath(`/gimnasio/rutinas/${id}`);
  revalidatePath("/gimnasio");
  revalidatePath("/");
}

// ---- Configuración ----

export async function updateGymWeekdaysAction(weekdays: number[]) {
  await updateGymWeekdays(weekdays);
  revalidatePath("/gimnasio");
  revalidatePath("/");
}

export async function deleteRoutineAction(id: string) {
  await deleteRoutine(id);
  revalidatePath("/gimnasio");
  redirect("/gimnasio");
}

export async function duplicateRoutineAction(id: string) {
  const result = await duplicateRoutine(id);
  revalidatePath("/gimnasio");
  return result;
}

export async function addExerciseToRoutineAction(
  routineId: string,
  exerciseId: string,
  targetRepMin?: number,
  targetRepMax?: number
) {
  const result = await addExerciseToRoutine(routineId, exerciseId, targetRepMin, targetRepMax);
  revalidatePath(`/gimnasio/rutinas/${routineId}`);
  return result;
}

export async function updateRoutineExerciseTargetAction(
  id: string,
  routineId: string,
  targetRepMin?: number,
  targetRepMax?: number
) {
  await updateRoutineExerciseTarget(id, targetRepMin, targetRepMax);
  revalidatePath(`/gimnasio/rutinas/${routineId}`);
}

export async function removeExerciseFromRoutineAction(id: string, routineId: string) {
  await removeExerciseFromRoutine(id);
  revalidatePath(`/gimnasio/rutinas/${routineId}`);
}

export async function reorderRoutineExercisesAction(routineId: string, orderedIds: string[]) {
  await reorderRoutineExercises(routineId, orderedIds);
  revalidatePath(`/gimnasio/rutinas/${routineId}`);
}

// ---- Entrenamiento ----

export async function startWorkoutAction(routineId: string) {
  const result = await startOrResumeSession(routineId);
  if (!result.ok) redirect(`/gimnasio/rutinas/${routineId}`);
  redirect(`/gimnasio/entrenar/${result.id}`);
}

export async function addSetAction(
  workoutExerciseId: string,
  sessionId: string,
  weightKg: number,
  reps: number,
  setType: SetType
) {
  const result = await addSet(workoutExerciseId, weightKg, reps, setType);
  revalidatePath(`/gimnasio/entrenar/${sessionId}`);
  return result;
}

export async function updateSetAction(
  id: string,
  sessionId: string,
  weightKg: number,
  reps: number,
  setType: SetType
) {
  const result = await updateSet(id, weightKg, reps, setType);
  revalidatePath(`/gimnasio/entrenar/${sessionId}`);
  return result;
}

export async function deleteSetAction(id: string, sessionId: string) {
  await deleteSet(id);
  revalidatePath(`/gimnasio/entrenar/${sessionId}`);
}

export async function finishWorkoutAction(sessionId: string) {
  await finishSession(sessionId);
  revalidatePath("/gimnasio");
  revalidatePath("/");
  redirect("/gimnasio");
}

export async function addExerciseToSessionAction(sessionId: string, exerciseId: string) {
  const result = await addExerciseToSession(sessionId, exerciseId);
  revalidatePath(`/gimnasio/entrenar/${sessionId}`);
  return result;
}

export async function removeExerciseFromSessionAction(workoutExerciseId: string, sessionId: string) {
  await removeExerciseFromSession(workoutExerciseId);
  revalidatePath(`/gimnasio/entrenar/${sessionId}`);
}
