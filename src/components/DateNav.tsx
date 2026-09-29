"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, addDays } from "date-fns";
import { es } from "date-fns/locale";

export default function DateNav({ date, todayKey }: { date: string; todayKey: string }) {
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-all hover:bg-surface-muted active:scale-90"
        aria-label="Día anterior"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        role="button"
        tabIndex={0}
        onClick={() => dateInputRef.current?.showPicker?.()}
        onKeyDown={(e) => e.key === "Enter" && dateInputRef.current?.showPicker?.()}
        className="relative min-w-0 flex-1 cursor-pointer rounded-xl px-2 py-1 text-center transition-colors hover:bg-surface-muted active:scale-[0.98]"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">
          {isToday ? "Hoy" : format(parsed, "yyyy") !== format(new Date(), "yyyy") ? format(parsed, "yyyy") : " "}
        </p>
        <h1 className="truncate text-xl font-semibold capitalize tracking-tight text-text">{label}</h1>
        <input
          ref={dateInputRef}
          type="date"
          value={date}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="pointer-events-none absolute inset-0 h-0 w-0 opacity-0"
          tabIndex={-1}
        />
      </div>

      <button
        type="button"
        onClick={() => go(format(addDays(parsed, 1), "yyyy-MM-dd"))}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-all hover:bg-surface-muted active:scale-90"
        aria-label="Día siguiente"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </header>
  );
}
