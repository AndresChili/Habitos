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
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-text-muted">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Beber 2L de agua"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
        />
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("days")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
              mode === "days" ? "border-accent bg-accent-soft text-accent-strong" : "border-border text-text-muted"
            }`}
          >
            Días concretos
          </button>
          <button
            type="button"
            onClick={() => setMode("frequency")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
              mode === "frequency" ? "border-accent bg-accent-soft text-accent-strong" : "border-border text-text-muted"
            }`}
          >
            Frecuencia
          </button>
        </div>

        {mode === "days" ? (
          <div className="flex gap-1">
            {WEEKDAY_LABELS.map((label, i) => {
              const day = i + 1;
              const active = weekdays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  className={`h-9 w-9 rounded-full text-xs font-medium transition ${
                    active ? "bg-accent text-accent-on" : "bg-surface-muted text-text-muted"
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
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                  freq === f ? "border-accent bg-accent-soft text-accent-strong" : "border-border text-text-muted"
                }`}
              >
                {f === "DAILY" ? "Diario" : f === "WEEKLY" ? "Semanal" : "Mensual"}
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-text-faint">
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
        className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-on disabled:opacity-50"
      >
        {formMode === "create" ? "Crear hábito" : "Guardar cambios"}
      </button>
    </form>
  );
}
