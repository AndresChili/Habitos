"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  verifyPassword,
  verifyPasswordOrDummy,
} from "@/lib/auth";
import { requireUserId } from "@/lib/dal";
import { isRateLimited, recordLoginAttempt } from "@/lib/rateLimit";
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
import { createBreak, deleteBreak } from "@/lib/breaks";
import { dayKey, nowInTz } from "@/lib/dates";
import type { BreakReason } from "@/generated/prisma/client";

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  const qs = `next=${encodeURIComponent(next)}`;

  if (!email || !password) {
    redirect(`/login?error=1&${qs}`);
  }

  if (await isRateLimited(email)) {
    redirect(`/login?error=rate&${qs}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Siempre ejecuta bcrypt, coincida o no, para que el tiempo de respuesta
  // no revele si el email está registrado.
  const valid = await verifyPasswordOrDummy(password, user?.passwordHash);
  await recordLoginAttempt(email, valid);

  if (!user || !valid) {
    redirect(`/login?error=1&${qs}`);
  }

  await createSession(user.id);
  redirect(next || "/");
}

export async function registerAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!isValidEmail(email)) {
    redirect("/register?error=email");
  }
  if (!isValidPassword(password)) {
    redirect("/register?error=weak");
  }
  if (password !== confirm) {
    redirect("/register?error=match");
  }
  if (await isRateLimited(email)) {
    redirect("/register?error=rate");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await recordLoginAttempt(email, false);
    redirect("/register?error=exists");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  await recordLoginAttempt(email, true);
  await prisma.settings.create({ data: { userId: user.id } });

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(formData: FormData) {
  const userId = await requireUserId();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) redirect("/cuenta?error=current");
  if (!isValidPassword(newPassword)) redirect("/cuenta?error=weak");
  if (newPassword !== confirm) redirect("/cuenta?error=match");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  redirect("/cuenta?ok=1");
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

// ---- Pausas de cuenta (vacaciones, enfermedad) ----

export async function createBreakAction(formData: FormData) {
  const fromDate = String(formData.get("fromDate") ?? "");
  const toDateRaw = String(formData.get("toDate") ?? "").trim();
  const reason = String(formData.get("reason") ?? "OTHER") as BreakReason;
  const note = String(formData.get("note") ?? "");

  const result = await createBreak(fromDate, toDateRaw || null, reason, note);
  revalidatePath("/cuenta");
  revalidatePath("/");
  revalidatePath("/habitos");
  if (!result.ok) redirect(`/cuenta?breakError=${encodeURIComponent(result.error)}`);
  redirect("/cuenta");
}

export async function deleteBreakAction(id: string) {
  await deleteBreak(id);
  revalidatePath("/cuenta");
  revalidatePath("/");
  revalidatePath("/habitos");
}

// ---- Peso ----

export async function setWeightAction(date: string, weightKg: number) {
  const result = await setWeight(date, weightKg);
  revalidatePath("/");
  revalidatePath("/peso");
  return result;
}
