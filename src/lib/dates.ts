import { toZonedTime } from "date-fns-tz";
import {
  addDays,
  differenceInCalendarDays,
  endOfISOWeek,
  endOfMonth,
  format,
  getISODay,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfISOWeek,
  startOfMonth,
} from "date-fns";

const DAY_KEY = "yyyy-MM-dd";

// Todo el cálculo de calendario (límites de día/semana/mes) se hace sobre la
// fecha "de reloj de pared" en la zona horaria, nunca sobre instantes UTC en
// crudo — esto evita por completo los errores de DST y de desfase horario.
export function nowInTz(timezone: string): Date {
  return toZonedTime(new Date(), timezone);
}

export function dayKey(date: Date): string {
  return format(date, DAY_KEY);
}

export function parseDayKey(key: string): Date {
  return parseISO(key);
}

export function isoWeekKey(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

export function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function weekRange(date: Date): { start: Date; end: Date } {
  return { start: startOfISOWeek(date), end: endOfISOWeek(date) };
}

export function monthRange(date: Date): { start: Date; end: Date } {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function daysBetweenInclusive(start: Date, end: Date): Date[] {
  const count = differenceInCalendarDays(end, start) + 1;
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

// Día de la semana ISO, 1=lunes..7=domingo — coincide con la codificación de Habit.weekdays.
export function isoWeekday(date: Date): number {
  return getISODay(date);
}
