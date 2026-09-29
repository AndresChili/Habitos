"use client";

import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { addDays } from "date-fns";

export default function DateNav({ date, todayKey }: { date: string; todayKey: string }) {
  const router = useRouter();
  const parsed = parseISO(date);
  const label = format(parsed, "EEEE, d 'de' MMMM", { locale: es });
  const isToday = date === todayKey;

  function go(target: string) {
    router.push(target === todayKey ? "/" : `/?date=${target}`);
  }

  return (
    <header className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => go(format(addDays(parsed, -1), "yyyy-MM-dd"))}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-faint transition hover:bg-surface-muted hover:text-text-muted"
        aria-label="Día anterior"
      >
        ‹
      </button>

      <div className="min-w-0 flex-1 text-center">
        {!isToday && <p className="text-xs font-medium uppercase tracking-wide text-text-faint">{format(parsed, "yyyy") === format(new Date(), "yyyy") ? "" : format(parsed, "yyyy")}</p>}
        <h1 className="truncate text-xl font-semibold capitalize text-text">{isToday ? "Hoy" : label}</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="mt-0.5 bg-transparent text-xs text-text-faint outline-none"
        />
      </div>

      <button
        type="button"
        onClick={() => go(format(addDays(parsed, 1), "yyyy-MM-dd"))}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-faint transition hover:bg-surface-muted hover:text-text-muted"
        aria-label="Día siguiente"
      >
        ›
      </button>
    </header>
  );
}
