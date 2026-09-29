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
    <header className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => go(format(addDays(parsed, -1), "yyyy-MM-dd"))}
        className="rounded-lg px-2 py-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        aria-label="Día anterior"
      >
        ←
      </button>

      <div className="text-center">
        <p className="text-sm capitalize text-neutral-400">{isToday ? "Hoy" : label}</p>
        {isToday && <h1 className="text-2xl font-semibold capitalize">{label}</h1>}
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="mt-1 bg-transparent text-xs text-neutral-400 outline-none"
        />
      </div>

      <button
        type="button"
        onClick={() => go(format(addDays(parsed, 1), "yyyy-MM-dd"))}
        className="rounded-lg px-2 py-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        aria-label="Día siguiente"
      >
        →
      </button>
    </header>
  );
}
