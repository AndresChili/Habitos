import { prisma } from "@/lib/db";

export async function listTasksForDate(date: string) {
  return prisma.task.findMany({
    where: { date },
    orderBy: [{ done: "asc" }, { time: "asc" }, { createdAt: "asc" }],
  });
}

export async function createTask(
  date: string,
  title: string,
  time?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = title.trim();
  if (!trimmed) return { ok: false, error: "El título no puede estar vacío." };

  await prisma.task.create({ data: { date, title: trimmed, time: time || null } });
  return { ok: true };
}

export async function updateTask(
  id: string,
  input: { title: string; time?: string | null; date: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = input.title.trim();
  if (!trimmed) return { ok: false, error: "El título no puede estar vacío." };

  await prisma.task.update({
    where: { id },
    data: { title: trimmed, time: input.time || null, date: input.date },
  });
  return { ok: true };
}

export async function toggleTask(id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;
  await prisma.task.update({ where: { id }, data: { done: !task.done } });
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
}
