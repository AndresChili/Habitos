"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, addMonths, endOfISOWeek, endOfMonth, format, isSameMonth, parseISO, startOfISOWeek, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

type SessionInfo = { id: string; routineName: string; status: "IN_PROGRESS" | "COMPLETED" };

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function GymCalendar({
  monthKey,
  todayKey,
  sessionsByDate,
}: {
  monthKey: string;
  todayKey: string;
  sessionsByDate: Record<string, SessionInfo[]>;
}) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthDate = parseISO(`${monthKey}-01`);
  const gridStart = startOfISOWeek(startOfMonth(monthDate));
  const gridEnd = endOfISOWeek(endOfMonth(monthDate));

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  function goToMonth(target: Date) {
    router.push(`/gimnasio/calendario?month=${format(target, "yyyy-MM")}`);
  }

  const selectedSessions = selectedDay ? sessionsByDate[selectedDay] ?? [] : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-card">
        <button
          type="button"
          onClick={() => goToMonth(addMonths(monthDate, -1))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-muted active:scale-90"
          aria-label="Mes anterior"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="flex-1 text-center text-sm font-semibold text-text">
          {capitalizeFirst(format(monthDate, "MMMM yyyy", { locale: es }))}
        </h2>
        <button
          type="button"
          onClick={() => goToMonth(addMonths(monthDate, 1))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-muted active:scale-90"
          aria-label="Mes siguiente"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3 shadow-card">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-text-faint">
          {WEEKDAY_LABELS.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const sessions = sessionsByDate[key] ?? [];
            const trained = sessions.some((s) => s.status === "COMPLETED");
            const inProgress = sessions.some((s) => s.status === "IN_PROGRESS");
            const inMonth = isSameMonth(d, monthDate);
            const isToday = key === todayKey;
            const hasSessions = sessions.length > 0;

            return (
              <button
                key={key}
                type="button"
                disabled={!hasSessions}
                onClick={() => setSelectedDay(key)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs font-medium transition-all active:scale-95 ${
                  !inMonth ? "text-text-faint/40" : trained ? "bg-gradient-to-br from-violet to-violet-2 text-violet-on shadow-glow-violet" : inProgress ? "border border-violet/40 text-violet-strong" : "text-text"
                } ${isToday && !trained ? "ring-2 ring-violet/50" : ""}`}
              >
                {format(d, "d")}
                {hasSessions && !trained && inProgress && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-violet" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="space-y-2 rounded-2xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold text-text-faint">
            {capitalizeFirst(format(parseISO(selectedDay), "EEEE, d MMM", { locale: es }))}
          </p>
          {selectedSessions.length === 0 ? (
            <p className="text-sm text-text-faint">Sin entrenamientos este día.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/gimnasio/entrenar/${s.id}`}
                  className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2 text-sm"
                >
                  <span className="font-medium text-text">{s.routineName}</span>
                  <span className="text-xs text-text-faint">{s.status === "COMPLETED" ? "Completado ✓" : "En curso"}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
