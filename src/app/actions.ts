"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, destroySession, verifyPasscode } from "@/lib/auth";
import { archiveHabit, createHabit, toggleLog } from "@/lib/habits";
import type { Frequency } from "@/generated/prisma/client";

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

export async function toggleHabitAction(habitId: string, date: string) {
  await toggleLog(habitId, date);
  revalidatePath("/");
  revalidatePath("/calendario");
}

export async function createHabitAction(name: string, frequency: Frequency) {
  const result = await createHabit(name, frequency);
  revalidatePath("/habitos");
  revalidatePath("/");
  return result;
}

export async function archiveHabitAction(id: string) {
  await archiveHabit(id);
  revalidatePath("/habitos");
  revalidatePath("/");
  revalidatePath("/calendario");
}
