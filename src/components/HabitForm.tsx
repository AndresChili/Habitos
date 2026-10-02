"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createHabitAction, updateHabitAction } from "@/app/actions";
import type { HabitInput } from "@/lib/habits";
import type { QuotaPeriod, RecurrenceType } from "@/generated/prisma/client";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

type Mode = "days" | "frequency";
type Freq = "DAILY" | "WEEKLY" | "MONTHLY";

function initialModeAndFreq(initial?: {
  recurrenceType: RecurrenceType;
  weekdays: number[];
  quotaPeriod: QuotaPeriod | null;
}): { mode: Mode; freq: Freq } {
  if (!initial) return { mode: "days", freq: "DAILY" };
  if (initial.recurrenceType === "FIXED_DAYS") {
    return initial.weekdays.length === 7 ? { mode: "frequency", freq: "DAILY" } : { mode: "days", freq: "DAILY" };
  }
  return { mode: "frequency", freq: initial.quotaPeriod === "MONTH" ? "MONTHLY" : "WEEKLY" };
}

export default function HabitForm({
  mode: formMode,
  habitId,
  initial,
}: {
  mode: "create" | "edit";
  habitId?: string;
  initial?: {
    name: string;
    recurrenceType: RecurrenceType;
    weekdays: number[];
    quotaPeriod: QuotaPeriod | null;
    quotaTarget: number | null;
  };
}) {
  const router = useRouter();
  const { mode: initMode, freq: initFreq } = initialModeAndFreq(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [mode, setMode] = useState<Mode>(initMode);
  const [freq, setFreq] = useState<Freq>(initFreq);
  const [weekdays, setWeekdays] = useState<number[]>(
    initial?.recurrenceType === "FIXED_DAYS" && initial.weekdays.length !== 7 ? initial.weekdays : []
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let input: HabitInput;
    if (mode === "days") {
      input = { name, recurrenceType: "FIXED_DAYS", weekdays };
    } else if (freq === "DAILY") {
      input = { name, recurrenceType: "FIXED_DAYS", weekdays: ALL_WEEKDAYS };
    } else {
      input = {
        name,
        recurrenceType: "QUOTA",
        quotaPeriod: freq === "WEEKLY" ? "WEEK" : "MONTH",
        quotaTarget: 1,
      };
    }

    startTransition(async () => {
      const result =
        formMode === "create" ? await createHabitAction(input) : await updateHabitAction(habitId!, input);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (formMode === "create") {
        setName("");
        setWeekdays([]);
      } else router.push("/habitos");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-text-faint">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Beber 2L de agua"
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="space-y-3">
        <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
          <button
            type="button"
            onClick={() => setMode("days")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === "days" ? "bg-surface text-text shadow-card" : "text-text-muted"
            }`}
          >
            Días concretos
          </button>
          <button
            type="button"
            onClick={() => setMode("frequency")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === "frequency" ? "bg-surface text-text shadow-card" : "text-text-muted"
            }`}
          >
            Frecuencia
          </button>
        </div>

        {mode === "days" ? (
          <div className="flex justify-between gap-1">
            {WEEKDAY_LABELS.map((label, i) => {
              const day = i + 1;
              const active = weekdays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold transition-all active:scale-90 ${
                    active ? "bg-gradient-to-br from-accent to-accent-2 text-accent-on shadow-glow" : "bg-surface-muted text-text-muted"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-2">
            {(["DAILY", "WEEKLY", "MONTHLY"] as Freq[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFreq(f)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.97] ${
                  freq === f ? "border-accent bg-accent-soft text-accent-strong" : "border-border text-text-muted"
                }`}
              >
                {f === "DAILY" ? "Diario" : f === "WEEKLY" ? "Semanal" : "Mensual"}
              </button>
            ))}
          </div>
        )}

        <p className="text-xs leading-relaxed text-text-faint">
          {mode === "days"
            ? "Aparece en “Hoy” solo los días marcados."
            : freq === "DAILY"
              ? "Aparece en “Hoy” todos los días."
              : `Una vez por ${freq === "WEEKLY" ? "semana" : "mes"} — lo marcas desde “Hábitos”.`}
        </p>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        type="submit"
        disabled={pending || !name.trim() || (mode === "days" && weekdays.length === 0)}
        className="w-full rounded-xl bg-gradient-to-br from-accent to-accent-2 py-3 text-sm font-semibold text-accent-on shadow-glow transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {formMode === "create" ? "Crear hábito" : "Guardar cambios"}
      </button>
    </form>
  );
}
