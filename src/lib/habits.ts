import { prisma } from "@/lib/db";
import {
  dayKey,
  isoWeekKey,
  monthKey,
  monthRange,
  nowInTz,
  weekRange,
} from "@/lib/dates";
import {
  addDays,
  addMonths,
  endOfISOWeek,
  endOfMonth,
  parseISO,
  setISOWeek,
  setISOWeekYear,
  startOfISOWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import type { Frequency, Settings } from "@/generated/prisma/client";

const SETTINGS_ID = 1;

export async function getSettings(): Promise<Settings> {
  const existing = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: SETTINGS_ID } });
}

function isoWeekStart(key: string): Date {
  const [year, week] = key.split("-W").map(Number);
  let d = setISOWeekYear(new Date(), year);
  d = setISOWeek(d, week);
  return startOfISOWeek(d);
}

async function weekCompliance(weekKey: string): Promise<number | null> {
  const start = isoWeekStart(weekKey);
  const end = endOfISOWeek(start);
  const dailyHabits = await prisma.habit.findMany({
    where: { frequency: "DAILY", archived: false, createdAt: { lte: end } },
  });
  if (dailyHabits.length === 0) return null;

  const count = await prisma.habitLog.count({
    where: {
      habitId: { in: dailyHabits.map((h) => h.id) },
      date: { gte: dayKey(start), lte: dayKey(end) },
    },
  });
  return count / (dailyHabits.length * 7);
}

async function monthWeeklyCompliance(monthKeyStr: string): Promise<boolean | null> {
  const [year, month] = monthKeyStr.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const end = endOfMonth(monthStart);

  const weeklyHabits = await prisma.habit.findMany({
    where: { frequency: "WEEKLY", archived: false, createdAt: { lte: end } },
  });
  if (weeklyHabits.length === 0) return null;

  const weeks: { start: Date; end: Date }[] = [];
  for (let cursor = startOfISOWeek(monthStart); cursor <= end; cursor = addDays(cursor, 7)) {
    weeks.push({ start: cursor, end: endOfISOWeek(cursor) });
  }

  for (const habit of weeklyHabits) {
    for (const week of weeks) {
      if (habit.createdAt > week.end) continue;
      const count = await prisma.habitLog.count({
        where: { habitId: habit.id, date: { gte: dayKey(week.start), lte: dayKey(week.end) } },
      });
      if (count === 0) return false;
    }
  }
  return true;
}

// Lazily evaluated on every Today-page load: cheap, idempotent (guarded by the
// lastDaily/lastWeekly cursors), no cron needed for a single-user app.
export async function ensureUnlocks(): Promise<Settings> {
  const settings = await getSettings();
  const now = nowInTz(settings.timezone);
  const currentWeek = isoWeekKey(now);
  const currentMonth = monthKey(now);

  let { dailyCap, weeklyCap, lastDailyUnlockWeek, lastWeeklyUnlockMonth } = settings;
  let changed = false;

  if (lastDailyUnlockWeek === null) {
    lastDailyUnlockWeek = currentWeek;
    changed = true;
  } else if (lastDailyUnlockWeek !== currentWeek) {
    const compliance = await weekCompliance(lastDailyUnlockWeek);
    if (compliance !== null && compliance >= 0.8) dailyCap += 1;
    lastDailyUnlockWeek = currentWeek;
    changed = true;
  }

  if (lastWeeklyUnlockMonth === null) {
    lastWeeklyUnlockMonth = currentMonth;
    changed = true;
  } else if (lastWeeklyUnlockMonth !== currentMonth) {
    const met = await monthWeeklyCompliance(lastWeeklyUnlockMonth);
    if (met) weeklyCap += 1;
    lastWeeklyUnlockMonth = currentMonth;
    changed = true;
  }

  if (!changed) return settings;

  return prisma.settings.update({
    where: { id: SETTINGS_ID },
    data: { dailyCap, weeklyCap, lastDailyUnlockWeek, lastWeeklyUnlockMonth },
  });
}

export async function listHabits(includeArchived = false) {
  return prisma.habit.findMany({
    where: includeArchived ? undefined : { archived: false },
    orderBy: { createdAt: "asc" },
  });
}

export async function createHabit(
  name: string,
  frequency: Frequency
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "El nombre no puede estar vacío." };

  const settings = await ensureUnlocks();
  const activeCount = await prisma.habit.count({ where: { frequency, archived: false } });
  const cap =
    frequency === "DAILY" ? settings.dailyCap : frequency === "WEEKLY" ? settings.weeklyCap : settings.monthlyCap;

  if (activeCount >= cap) {
    return { ok: false, error: `Ya usas los ${cap} slots disponibles para este tipo.` };
  }

  await prisma.habit.create({ data: { name: trimmed, frequency } });
  return { ok: true };
}

export async function archiveHabit(id: string) {
  await prisma.habit.update({ where: { id }, data: { archived: true } });
}

export async function toggleLog(habitId: string, date: string) {
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date } },
  });
  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.habitLog.create({ data: { habitId, date } });
  return true;
}

function stepBackKey(key: string, freq: "WEEKLY" | "MONTHLY"): string {
  if (freq === "WEEKLY") {
    const back = subWeeks(isoWeekStart(key), 1);
    return isoWeekKey(back);
  }
  const [year, month] = key.split("-").map(Number);
  const back = subMonths(new Date(year, month - 1, 1), 1);
  return monthKey(back);
}

function computeStreak(dates: string[], frequency: Frequency, todayKey: string, tz: string): number {
  const set = new Set(dates);
  if (frequency === "DAILY") {
    let streak = 0;
    let cursor = parseISO(todayKey);
    if (!set.has(dayKey(cursor))) cursor = addDays(cursor, -1);
    while (set.has(dayKey(cursor))) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  const freq = frequency as "WEEKLY" | "MONTHLY";
  const periodKeys = new Set(
    dates.map((d) => (freq === "WEEKLY" ? isoWeekKey(parseISO(d)) : monthKey(parseISO(d))))
  );
  const now = nowInTz(tz);
  const currentPeriod = freq === "WEEKLY" ? isoWeekKey(now) : monthKey(now);
  let cursor = currentPeriod;
  if (!periodKeys.has(cursor)) cursor = stepBackKey(cursor, freq);
  let streak = 0;
  while (periodKeys.has(cursor)) {
    streak++;
    cursor = stepBackKey(cursor, freq);
  }
  return streak;
}

export type TodayHabit = {
  id: string;
  name: string;
  frequency: Frequency;
  done: boolean;
  streak: number;
};

export async function getTodayView() {
  const settings = await ensureUnlocks();
  const now = nowInTz(settings.timezone);
  const today = dayKey(now);
  const { start: weekStart, end: weekEnd } = weekRange(now);
  const { start: monthStart, end: monthEnd } = monthRange(now);

  const habits = await listHabits();
  const logs = await prisma.habitLog.findMany({
    where: { habitId: { in: habits.map((h) => h.id) } },
    select: { habitId: true, date: true },
  });

  const byHabit = new Map<string, string[]>();
  for (const log of logs) {
    if (!byHabit.has(log.habitId)) byHabit.set(log.habitId, []);
    byHabit.get(log.habitId)!.push(log.date);
  }

  const items: TodayHabit[] = habits.map((h) => {
    const dates = byHabit.get(h.id) ?? [];
    let done: boolean;
    if (h.frequency === "DAILY") done = dates.includes(today);
    else if (h.frequency === "WEEKLY")
      done = dates.some((d) => d >= dayKey(weekStart) && d <= dayKey(weekEnd));
    else done = dates.some((d) => d >= dayKey(monthStart) && d <= dayKey(monthEnd));

    return {
      id: h.id,
      name: h.name,
      frequency: h.frequency,
      done,
      streak: computeStreak(dates, h.frequency, today, settings.timezone),
    };
  });

  const countBy = (f: Frequency) => habits.filter((h) => h.frequency === f).length;

  return {
    date: today,
    timezone: settings.timezone,
    daily: items.filter((i) => i.frequency === "DAILY"),
    weekly: items.filter((i) => i.frequency === "WEEKLY"),
    monthly: items.filter((i) => i.frequency === "MONTHLY"),
    slots: {
      daily: { used: countBy("DAILY"), cap: settings.dailyCap },
      weekly: { used: countBy("WEEKLY"), cap: settings.weeklyCap },
      monthly: { used: countBy("MONTHLY"), cap: settings.monthlyCap },
    },
  };
}

export type DayCellState = "done" | "missed" | "future" | "pending" | "none";

export async function getMonthGrid(year: number, month: number) {
  const settings = await getSettings();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = endOfMonth(monthStart);
  const todayKey = dayKey(nowInTz(settings.timezone));

  const habits = await listHabits();
  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: { in: habits.map((h) => h.id) },
      date: { gte: dayKey(monthStart), lte: dayKey(monthEnd) },
    },
    select: { habitId: true, date: true },
  });

  const doneDates = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!doneDates.has(log.habitId)) doneDates.set(log.habitId, new Set());
    doneDates.get(log.habitId)!.add(log.date);
  }

  const daysInMonth = monthEnd.getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const rows = habits.map((h) => {
    const dates = doneDates.get(h.id) ?? new Set<string>();
    const cells: DayCellState[] = days.map((day) => {
      const key = dayKey(new Date(year, month - 1, day));
      const isDone = dates.has(key);
      if (isDone) return "done";
      if (h.frequency !== "DAILY") return "none";
      if (key > todayKey) return "future";
      if (key === todayKey) return "pending";
      return "missed";
    });
    return { id: h.id, name: h.name, frequency: h.frequency, cells };
  });

  return { year, month, days, rows };
}

export function nextMonth(year: number, month: number) {
  const d = addMonths(new Date(year, month - 1, 1), 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function prevMonth(year: number, month: number) {
  const d = subMonths(new Date(year, month - 1, 1), 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
