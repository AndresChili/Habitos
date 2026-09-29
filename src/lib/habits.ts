import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
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
  return prisma.habit.findMany({
    where: includeArchived ? undefined : { archivedAt: null },
    include: { pauses: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getHabit(id: string) {
  return prisma.habit.findUnique({ where: { id }, include: { pauses: true } });
}

export async function createHabit(
  input: HabitInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "El nombre no puede estar vacío." };

  const fields = validateRecurrence(input);
  if (!fields.ok) return fields;

  await prisma.habit.create({
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

export async function updateHabit(
  id: string,
  input: HabitInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "El nombre no puede estar vacío." };

  const fields = validateRecurrence(input);
  if (!fields.ok) return fields;

  await prisma.habit.update({
    where: { id },
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
  await prisma.habit.update({ where: { id }, data: { archivedAt: new Date() } });
}

export async function restoreHabit(id: string) {
  await prisma.habit.update({ where: { id }, data: { archivedAt: null } });
}

export async function pauseHabit(id: string, dateKeyToday: string) {
  const open = await prisma.habitPause.findFirst({ where: { habitId: id, toDate: null } });
  if (open) return;
  await prisma.habitPause.create({ data: { habitId: id, fromDate: dateKeyToday } });
}

export async function resumeHabit(id: string, dateKeyToday: string) {
  const open = await prisma.habitPause.findFirst({ where: { habitId: id, toDate: null } });
  if (!open) return;
  await prisma.habitPause.update({ where: { id: open.id }, data: { toDate: dateKeyToday } });
}

export function isPausedOn(pauses: HabitPause[], date: string): boolean {
  return pauses.some((p) => date >= p.fromDate && (p.toDate === null || date <= p.toDate));
}

export function isCurrentlyPaused(pauses: HabitPause[]): boolean {
  return pauses.some((p) => p.toDate === null);
}

export async function toggleLog(habitId: string, date: string) {
  const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId, date } } });
  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.habitLog.create({ data: { habitId, date } });
  return true;
}

function computeFixedStreak(
  habit: Habit,
  pauses: HabitPause[],
  loggedDates: Set<string>,
  uptoDateKey: string
): number {
  let cursor = loggedDates.has(uptoDateKey) ? parseDayKey(uptoDateKey) : subDays(parseDayKey(uptoDateKey), 1);
  const habitStart = dayKey(habit.createdAt);
  let streak = 0;

  for (let i = 0; i < 3650; i++) {
    const key = dayKey(cursor);
    if (key < habitStart) break;
    if (isPausedOn(pauses, key)) {
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
};

// FIXED_DAYS habits due on `dateKeyValue`, for the "Hoy" screen.
export async function getFixedHabitsForDate(dateKeyValue: string): Promise<TodayHabit[]> {
  const weekday = isoWeekday(parseDayKey(dateKeyValue));
  const habits = await prisma.habit.findMany({
    where: {
      recurrenceType: "FIXED_DAYS",
      archivedAt: null,
      createdAt: { lte: addDays(parseDayKey(dateKeyValue), 1) },
      weekdays: { has: weekday },
    },
    include: { pauses: true },
    orderBy: { createdAt: "asc" },
  });

  const due = habits.filter((h) => !isPausedOn(h.pauses, dateKeyValue));
  if (due.length === 0) return [];

  const logs = await prisma.habitLog.findMany({
    where: { habitId: { in: due.map((h) => h.id) }, date: { lte: dateKeyValue } },
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
      streak: computeFixedStreak(h, h.pauses, dates, dateKeyValue),
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

// QUOTA habits with current-period progress, for the "Hábitos" screen.
export async function getQuotaHabits(tz: string): Promise<QuotaHabit[]> {
  const now = nowInTz(tz);
  const habits = await prisma.habit.findMany({
    where: { recurrenceType: "QUOTA", archivedAt: null },
    include: { pauses: true },
    orderBy: { createdAt: "asc" },
  });
  if (habits.length === 0) return [];

  const logs = await prisma.habitLog.findMany({
    where: { habitId: { in: habits.map((h) => h.id) } },
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
  const habit = await prisma.habit.findUnique({ where: { id }, include: { pauses: true } });
  if (!habit) return null;

  const now = nowInTz(tz);
  const todayK = dayKey(now);
  const logs = await prisma.habitLog.findMany({ where: { habitId: id }, select: { date: true } });
  const loggedDates = new Set(logs.map((l) => l.date));

  if (habit.recurrenceType === "FIXED_DAYS") {
    const habitStartKey = dayKey(habit.createdAt);
    const gridStart = startOfISOWeek(subDays(now, HEATMAP_WEEKS * 7 - 1));
    const cells: HeatCell[] = [];
    for (let cursor = gridStart; dayKey(cursor) <= todayK; cursor = addDays(cursor, 1)) {
      const key = dayKey(cursor);
      let state: HeatCell["state"];
      if (key < habitStartKey || isPausedOn(habit.pauses, key) || !habit.weekdays.includes(isoWeekday(cursor))) {
        state = "not_scheduled";
      } else if (key === todayK && !loggedDates.has(key)) {
        state = "today_pending";
      } else if (loggedDates.has(key)) {
        state = "done";
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
          !isPausedOn(habit.pauses, key) &&
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
      currentStreak: computeFixedStreak(habit, habit.pauses, loggedDates, todayK),
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
