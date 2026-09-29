"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, destroySession, verifyPasscode } from "@/lib/auth";
import {
  archiveHabit,
  createHabit,
  getSettingsTz,
  pauseHabit,
  resumeHabit,
  restoreHabit,
  toggleLog,
  toggleQuotaLog,
  updateHabit,
  type HabitInput,
} from "@/lib/habits";
import { createTask, deleteTask, toggleTask, updateTask } from "@/lib/tasks";
import { setWeight } from "@/lib/weight";
import { dayKey, nowInTz } from "@/lib/dates";

export async function loginAction(formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!verifyPasscode(passcode)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  await createSession();
  redirect(next || "/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

async function todayKey(): Promise<string> {
  const tz = await getSettingsTz();
  return dayKey(nowInTz(tz));
}

// ---- Hábitos ----

export async function toggleHabitLogAction(habitId: string, date: string) {
  await toggleLog(habitId, date);
  revalidatePath("/");
  revalidatePath("/habitos");
}

export async function toggleQuotaLogAction(habitId: string) {
  await toggleQuotaLog(habitId, await getSettingsTz());
  revalidatePath("/habitos");
  revalidatePath("/");
}

export async function createHabitAction(input: HabitInput) {
  const result = await createHabit(input);
  revalidatePath("/habitos");
  revalidatePath("/");
  return result;
}

export async function updateHabitAction(id: string, input: HabitInput) {
  const result = await updateHabit(id, input);
  revalidatePath("/habitos");
  revalidatePath("/");
  return result;
}

export async function archiveHabitAction(id: string) {
  await archiveHabit(id);
  revalidatePath("/habitos");
  revalidatePath("/");
}

export async function restoreHabitAction(id: string) {
  await restoreHabit(id);
  revalidatePath("/habitos");
  revalidatePath("/");
}

export async function pauseHabitAction(id: string) {
  await pauseHabit(id, await todayKey());
  revalidatePath("/habitos");
  revalidatePath("/");
}

export async function resumeHabitAction(id: string) {
  await resumeHabit(id, await todayKey());
  revalidatePath("/habitos");
  revalidatePath("/");
}

// ---- Tareas ----

export async function createTaskAction(date: string, title: string, time?: string) {
  const result = await createTask(date, title, time);
  revalidatePath("/");
  return result;
}

export async function updateTaskAction(id: string, title: string, time: string | undefined, date: string) {
  const result = await updateTask(id, { title, time, date });
  revalidatePath("/");
  return result;
}

export async function toggleTaskAction(id: string) {
  await toggleTask(id);
  revalidatePath("/");
}

export async function deleteTaskAction(id: string) {
  await deleteTask(id);
  revalidatePath("/");
}

// ---- Peso ----

export async function setWeightAction(date: string, weightKg: number) {
  const result = await setWeight(date, weightKg);
  revalidatePath("/");
  revalidatePath("/peso");
  return result;
}
