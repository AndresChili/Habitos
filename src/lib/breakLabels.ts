import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { BreakReason } from "@/generated/prisma/client";

export const BREAK_REASON_LABELS: Record<BreakReason, string> = {
  VACATION: "Vacaciones",
  SICK: "Enfermo/a",
  OTHER: "Otro",
};

export function formatBreakRange(fromDate: string, toDate: string | null): string {
  const from = format(parseISO(fromDate), "d MMM", { locale: es });
  if (!toDate) return `Desde el ${from}, sin fecha de vuelta`;
  const to = format(parseISO(toDate), "d MMM", { locale: es });
  return fromDate === toDate ? `El ${from}` : `Del ${from} al ${to}`;
}
