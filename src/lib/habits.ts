import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import { getSettings } from "@/lib/settings";
import { getBreakRanges, isDateInBreak, type BreakRange } from "@/lib/breaks";
import { isPausedOn, isCurrentlyPaused } from "@/lib/pureLogic";
import { dayKey, isoWeekday, monthRange, nowInTz, parseDayKey, weekRange } from "@/lib/dates";
import {
  addDays,
  endOfISOWeek,
  endOfMonth,
  format,
  startOfISOWeek,
  startOfMonth,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Habit, HabitPause, QuotaPeriod, RecurrenceType } from "@/generated/prisma/client";

export type HabitInput = {
  name: string;
  recurrenceType: RecurrenceType;
  weekdays?: number[];
  quotaPeriod?: QuotaPeriod | null;
  quotaTarget?: number | null;
};

type ValidatedFields =
  | { ok: true; weekdays: number[]; quotaPeriod: QuotaPeriod | null; quotaTarget: number | null }
  | { ok: false; error: string };

function validateRecurrence(input: HabitInput): ValidatedFields {
  if (input.recurrenceType === "FIXED_DAYS") {
    const weekdays = Array.from(new Set(input.weekdays ?? [])).sort((a, b) => a - b);
    if (weekdays.length === 0) return { ok: false, error: "Elige al menos un día de la semana." };
    if (weekdays.some((d) => d < 1 || d > 7)) return { ok: false, error: "Día de la semana inválido." };
    return { ok: true, weekdays, quotaPeriod: null, quotaTarget: null };
  }

  const quotaPeriod = input.quotaPeriod ?? null;
  const quotaTarget = input.quotaTarget ?? null;
  if (!quotaPeriod) return { ok: false, error: "Elige el periodo de la cuota (semana o mes)." };
  if (!quotaTarget || quotaTarget < 1) return { ok: false, error: "El objetivo debe ser al menos 1." };
  const max = quotaPeriod === "WEEK" ? 7 : 31;
  if (quotaTarget > max) return { ok: false, error: `Máximo ${max} veces por ${quotaPeriod === "WEEK" ? "semana" : "mes"}.` };
  return { ok: true, weekdays: [], quotaPeriod, quotaTarget };
}

export async function listHabits(includeArchived = false): Promise<(Habit & { pauses: HabitPause[] })[]> {
  const userId = await requireUserId();
  return prisma.habit.findMany({
    where: includeArchived ? { userId } : { userId, archivedAt: null },
    include: { pauses: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getHabit(id: string) {
  const userId = await requireUserId();
  return prisma.habit.findFirst({ where: { id, userId }, include: { pauses: true } });
}

export async function createHabit(
  input: HabitInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "El nombre no puede estar vacío." };

  const fields = validateRecurrence(input);
  if (!fields.ok) return fields;

  await prisma.habit.create({
    data: {
      userId,
      name,
      recurrenceType: input.recurrenceType,
      weekdays: fields.weekdays,
      quotaPeriod: fields.quotaPeriod,
      quotaTarget: fields.quotaTarget,
    },
  });
  return { ok: true };
}

export async function updateHabit(
  id: string,
  input: HabitInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "El nombre no puede estar vacío." };

  const fields = validateRecurrence(input);
  if (!fields.ok) return fields;

  await prisma.habit.updateMany({
    where: { id, userId },
    data: {
      name,
      recurrenceType: input.recurrenceType,
      weekdays: fields.weekdays,
      quotaPeriod: fields.quotaPeriod,
      quotaTarget: fields.quotaTarget,
    },
  });
  return { ok: true };
}

export async function archiveHabit(id: string) {
  const userId = await requireUserId();
  await prisma.habit.updateMany({ where: { id, userId }, data: { archivedAt: new Date() } });
}

export async function restoreHabit(id: string) {
  const userId = await requireUserId();
  await prisma.habit.updateMany({ where: { id, userId }, data: { archivedAt: null } });
}

export async function pauseHabit(id: string, dateKeyToday: string) {
  const userId = await requireUserId();
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) return;

  const open = await prisma.habitPause.findFirst({ where: { habitId: id, toDate: null } });
  if (open) return;
  await prisma.habitPause.create({ data: { habitId: id, userId, fromDate: dateKeyToday } });
}

export async function resumeHabit(id: string, dateKeyToday: string) {
  const userId = await requireUserId();
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) return;

  const open = await prisma.habitPause.findFirst({ where: { habitId: id, toDate: null } });
  if (!open) return;
  await prisma.habitPause.update({ where: { id: open.id }, data: { toDate: dateKeyToday } });
}

export { isPausedOn, isCurrentlyPaused };

// Una pausa propia del hábito o una pausa global de cuenta (vacaciones,
// enfermedad) cuentan igual aquí: ambas congelan el hábito ese día — no
// vence, no cuenta como fallado, y la racha no se rompe.
function isExcludedOn(pauses: HabitPause[], breaks: BreakRange[], date: string): boolean {
  return isPausedOn(pauses, date) || isDateInBreak(breaks, date);
}

export async function toggleLog(habitId: string, date: string) {
  const userId = await requireUserId();
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return false;

  const existing = await prisma.habitLog.findFirst({ where: { habitId, userId, date } });
  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.habitLog.create({ data: { habitId, userId, date } });
  return true;
}

function computeFixedStreak(
  habit: Habit,
  pauses: HabitPause[],
  breaks: BreakRange[],
  loggedDates: Set<string>,
  uptoDateKey: string
): number {
  let cursor = loggedDates.has(uptoDateKey) ? parseDayKey(uptoDateKey) : subDays(parseDayKey(uptoDateKey), 1);
  const habitStart = dayKey(habit.createdAt);
  let streak = 0;

  for (let i = 0; i < 3650; i++) {
    const key = dayKey(cursor);
    if (key < habitStart) break;
    if (isExcludedOn(pauses, breaks, key)) {
      // Un día de pausa no rompe la racha, pero si de verdad se hizo (ej.
      // "hoy sí me dio tiempo de ir al gimnasio" durante vacaciones) sigue
      // contando a favor — solo es neutro cuando se deja sin marcar.
      if (loggedDates.has(key)) streak++;
      cursor = subDays(cursor, 1);
      continue;
    }
    if (!habit.weekdays.includes(isoWeekday(cursor))) {
      cursor = subDays(cursor, 1);
      continue;
    }
    if (loggedDates.has(key)) {
      streak++;
      cursor = subDays(cursor, 1);
    } else {
      break;
    }
  }
  return streak;
}

export type TodayHabit = {
  id: string;
  name: string;
  done: boolean;
  streak: number;
  // En pausa (vacaciones/enfermedad) hoy — se puede marcar igual si de
  // verdad se hizo, pero dejarlo sin marcar no rompe la racha.
  excused: boolean;
};

// Hábitos FIXED_DAYS que vencen en `dateKeyValue`, para la pantalla "Hoy".
export async function getFixedHabitsForDate(dateKeyValue: string): Promise<TodayHabit[]> {
  const userId = await requireUserId();
  const weekday = isoWeekday(parseDayKey(dateKeyValue));
  const [habits, breaks] = await Promise.all([
    prisma.habit.findMany({
      where: {
        userId,
        recurrenceType: "FIXED_DAYS",
        archivedAt: null,
        createdAt: { lte: addDays(parseDayKey(dateKeyValue), 1) },
        weekdays: { has: weekday },
      },
      include: { pauses: true },
      orderBy: { createdAt: "asc" },
    }),
    getBreakRanges(),
  ]);

  // Una pausa global no oculta el hábito — sigue pudiendo marcarse si de
  // verdad se hizo. Solo una pausa propia del hábito lo saca de la lista.
  const due = habits.filter((h) => !isPausedOn(h.pauses, dateKeyValue));
  if (due.length === 0) return [];
  const excusedToday = isDateInBreak(breaks, dateKeyValue);

  const logs = await prisma.habitLog.findMany({
    where: { userId, habitId: { in: due.map((h) => h.id) }, date: { lte: dateKeyValue } },
    select: { habitId: true, date: true },
  });

  const byHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!byHabit.has(log.habitId)) byHabit.set(log.habitId, new Set());
    byHabit.get(log.habitId)!.add(log.date);
  }

  return due.map((h) => {
    const dates = byHabit.get(h.id) ?? new Set<string>();
    return {
      id: h.id,
      name: h.name,
      done: dates.has(dateKeyValue),
      streak: computeFixedStreak(h, h.pauses, breaks, dates, dateKeyValue),
      excused: excusedToday,
    };
  });
}

export type QuotaHabit = {
  id: string;
  name: string;
  quotaPeriod: QuotaPeriod;
  quotaTarget: number;
  done: number;
  periodLabel: string;
  paused: boolean;
};

// Hábitos QUOTA con el progreso del periodo actual, para la pantalla "Hábitos".
export async function getQuotaHabits(tz: string): Promise<QuotaHabit[]> {
  const userId = await requireUserId();
  const now = nowInTz(tz);
  const habits = await prisma.habit.findMany({
    where: { userId, recurrenceType: "QUOTA", archivedAt: null },
    include: { pauses: true },
    orderBy: { createdAt: "asc" },
  });
  if (habits.length === 0) return [];

  const logs = await prisma.habitLog.findMany({
    where: { userId, habitId: { in: habits.map((h) => h.id) } },
    select: { habitId: true, date: true },
  });
  const byHabit = new Map<string, string[]>();
  for (const log of logs) {
    if (!byHabit.has(log.habitId)) byHabit.set(log.habitId, []);
    byHabit.get(log.habitId)!.push(log.date);
  }

  return habits.map((h) => {
    const { start, end } =
      h.quotaPeriod === "WEEK" ? weekRange(now) : monthRange(now);
    const dates = byHabit.get(h.id) ?? [];
    const done = dates.filter((d) => d >= dayKey(start) && d <= dayKey(end)).length;
    return {
      id: h.id,
      name: h.name,
      quotaPeriod: h.quotaPeriod!,
      quotaTarget: h.quotaTarget!,
      done,
      periodLabel: h.quotaPeriod === "WEEK" ? "esta semana" : "este mes",
      paused: isCurrentlyPaused(h.pauses),
    };
  });
}

// Para hábitos QUOTA: alterna un único cumplimiento dentro del periodo actual
// — marcar "hecho" registra hoy, volver a marcar quita el registro que exista
// en el periodo (solo debería haber uno, ya que el objetivo siempre es 1).
export async function toggleQuotaLog(habitId: string, tz: string): Promise<boolean> {
  const userId = await requireUserId();
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit || habit.recurrenceType !== "QUOTA") return false;

  const now = nowInTz(tz);
  const { start, end } = habit.quotaPeriod === "WEEK" ? weekRange(now) : monthRange(now);
  const existing = await prisma.habitLog.findFirst({
    where: { habitId, userId, date: { gte: dayKey(start), lte: dayKey(end) } },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.habitLog.create({ data: { habitId, userId, date: dayKey(now) } });
  return true;
}

async function getSettingsTz(): Promise<string> {
  const settings = await getSettings();
  return settings.timezone;
}

export { getSettingsTz };

export type HeatCell = { date: string; state: "done" | "missed" | "not_scheduled" | "today_pending" | "future" };

export type FixedHabitDetail = {
  kind: "FIXED_DAYS";
  id: string;
  name: string;
  weekdays: number[];
  cells: HeatCell[];
  currentStreak: number;
  completionRate: number | null;
  previousCompletionRate: number | null;
  doneCount: number;
};

export type QuotaPeriodEntry = { label: string; done: number; target: number; met: boolean; current: boolean };

export type QuotaHabitDetail = {
  kind: "QUOTA";
  id: string;
  name: string;
  quotaPeriod: QuotaPeriod;
  quotaTarget: number;
  periods: QuotaPeriodEntry[];
  currentStreak: number;
  completionRate: number | null;
  previousMet: boolean | null;
};

export type HabitDetail = FixedHabitDetail | QuotaHabitDetail;

const HEATMAP_WEEKS = 18;
const COMPARE_WINDOW_DAYS = 42;

export async function getHabitDetail(id: string, tz: string): Promise<HabitDetail | null> {
  const userId = await requireUserId();
  const [habit, breaks] = await Promise.all([
    prisma.habit.findFirst({ where: { id, userId }, include: { pauses: true } }),
    getBreakRanges(),
  ]);
  if (!habit) return null;

  const now = nowInTz(tz);
  const todayK = dayKey(now);
  const logs = await prisma.habitLog.findMany({ where: { habitId: id, userId }, select: { date: true } });
  const loggedDates = new Set(logs.map((l) => l.date));

  if (habit.recurrenceType === "FIXED_DAYS") {
    const habitStartKey = dayKey(habit.createdAt);
    const gridStart = startOfISOWeek(subDays(now, HEATMAP_WEEKS * 7 - 1));
    const cells: HeatCell[] = [];
    for (let cursor = gridStart; dayKey(cursor) <= todayK; cursor = addDays(cursor, 1)) {
      const key = dayKey(cursor);
      // El marcado manda sobre la pausa — si de verdad se hizo ese día (ej.
      // fue al gimnasio aunque estuviera "de vacaciones"), se ve como hecho,
      // no como "no programado".
      let state: HeatCell["state"];
      if (loggedDates.has(key)) {
        state = "done";
      } else if (key < habitStartKey || isExcludedOn(habit.pauses, breaks, key) || !habit.weekdays.includes(isoWeekday(cursor))) {
        state = "not_scheduled";
      } else if (key === todayK) {
        state = "today_pending";
      } else {
        state = "missed";
      }
      cells.push({ date: key, state });
    }

    const rateOver = (from: Date, to: Date): number | null => {
      let scheduled = 0;
      let done = 0;
      for (let cursor = from; dayKey(cursor) <= dayKey(to); cursor = addDays(cursor, 1)) {
        const key = dayKey(cursor);
        if (
          key >= habitStartKey &&
          key <= todayK &&
          !isExcludedOn(habit.pauses, breaks, key) &&
          habit.weekdays.includes(isoWeekday(cursor))
        ) {
          scheduled++;
          if (loggedDates.has(key)) done++;
        }
      }
      return scheduled > 0 ? done / scheduled : null;
    };

    const currentStart = subDays(now, COMPARE_WINDOW_DAYS - 1);
    const prevEnd = subDays(currentStart, 1);
    const prevStart = subDays(prevEnd, COMPARE_WINDOW_DAYS - 1);

    return {
      kind: "FIXED_DAYS",
      id: habit.id,
      name: habit.name,
      weekdays: habit.weekdays,
      cells,
      currentStreak: computeFixedStreak(habit, habit.pauses, breaks, loggedDates, todayK),
      completionRate: rateOver(currentStart, now),
      previousCompletionRate: rateOver(prevStart, prevEnd),
      doneCount: loggedDates.size,
    };
  }

  const periodCount = 8;
  const periods: QuotaPeriodEntry[] = [];
  for (let i = periodCount - 1; i >= 0; i--) {
    let start: Date;
    let end: Date;
    let label: string;
    if (habit.quotaPeriod === "WEEK") {
      const base = subWeeks(now, i);
      start = startOfISOWeek(base);
      end = endOfISOWeek(base);
      label = format(start, "d MMM", { locale: es });
    } else {
      const base = subMonths(now, i);
      start = startOfMonth(base);
      end = endOfMonth(base);
      label = format(start, "MMM yyyy", { locale: es });
    }
    const done = [...loggedDates].filter((d) => d >= dayKey(start) && d <= dayKey(end)).length;
    periods.push({ label, done, target: habit.quotaTarget!, met: done >= habit.quotaTarget!, current: i === 0 });
  }

  const past = periods.slice(0, -1);
  let currentStreak = periods[periods.length - 1].met ? 1 : 0;
  for (let i = past.length - 1; i >= 0; i--) {
    if (past[i].met) currentStreak++;
    else break;
  }

  return {
    kind: "QUOTA",
    id: habit.id,
    name: habit.name,
    quotaPeriod: habit.quotaPeriod!,
    quotaTarget: habit.quotaTarget!,
    periods,
    currentStreak,
    completionRate: past.length > 0 ? past.filter((p) => p.met).length / past.length : null,
    previousMet: past.length > 0 ? past[past.length - 1].met : null,
  };
}
