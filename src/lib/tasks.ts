import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";

export async function listTasksForDate(date: string) {
  const userId = await requireUserId();
  return prisma.task.findMany({
    where: { userId, date },
    orderBy: [{ done: "asc" }, { time: "asc" }, { createdAt: "asc" }],
  });
}

export async function createTask(
  date: string,
  title: string,
  time?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const trimmed = title.trim();
  if (!trimmed) return { ok: false, error: "El título no puede estar vacío." };

  await prisma.task.create({ data: { userId, date, title: trimmed, time: time || null } });
  return { ok: true };
}

export async function updateTask(
  id: string,
  input: { title: string; time?: string | null; date: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const trimmed = input.title.trim();
  if (!trimmed) return { ok: false, error: "El título no puede estar vacío." };

  await prisma.task.updateMany({
    where: { id, userId },
    data: { title: trimmed, time: input.time || null, date: input.date },
  });
  return { ok: true };
}

export async function toggleTask(id: string) {
  const userId = await requireUserId();
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) return;
  await prisma.task.update({ where: { id: task.id }, data: { done: !task.done } });
}

export async function deleteTask(id: string) {
  const userId = await requireUserId();
  await prisma.task.deleteMany({ where: { id, userId } });
}
