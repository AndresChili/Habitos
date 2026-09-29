"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createHabitAction, updateHabitAction } from "@/app/actions";
import type { HabitInput } from "@/lib/habits";
import type { QuotaPeriod, RecurrenceType } from "@/generated/prisma/client";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export default function HabitForm({
  mode,
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
  const [name, setName] = useState(initial?.name ?? "");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    initial?.recurrenceType ?? "FIXED_DAYS"
  );
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? []);
  const [quotaPeriod, setQuotaPeriod] = useState<QuotaPeriod>(initial?.quotaPeriod ?? "WEEK");
  const [quotaTarget, setQuotaTarget] = useState(initial?.quotaTarget?.toString() ?? "3");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: HabitInput = {
      name,
      recurrenceType,
      weekdays: recurrenceType === "FIXED_DAYS" ? weekdays : undefined,
      quotaPeriod: recurrenceType === "QUOTA" ? quotaPeriod : undefined,
      quotaTarget: recurrenceType === "QUOTA" ? Number(quotaTarget) : undefined,
    };

    startTransition(async () => {
      const result =
        mode === "create" ? await createHabitAction(input) : await updateHabitAction(habitId!, input);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (mode === "create") setName("");
      else router.push("/habitos");
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
        <label className="text-xs font-medium text-text-muted">Tipo</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecurrenceType("FIXED_DAYS")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
              recurrenceType === "FIXED_DAYS"
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-border text-text-muted"
            }`}
          >
            Días fijos
          </button>
          <button
            type="button"
            onClick={() => setRecurrenceType("QUOTA")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
              recurrenceType === "QUOTA"
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-border text-text-muted"
            }`}
          >
            Cuota por periodo
          </button>
        </div>
      </div>

      {recurrenceType === "FIXED_DAYS" ? (
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">Días (aparece en &ldquo;Hoy&rdquo;)</label>
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
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-text-muted">Periodo</label>
            <select
              value={quotaPeriod}
              onChange={(e) => setQuotaPeriod(e.target.value as QuotaPeriod)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            >
              <option value="WEEK">Semana</option>
              <option value="MONTH">Mes</option>
            </select>
          </div>
          <div className="w-24 space-y-1">
            <label className="text-xs font-medium text-text-muted">Veces</label>
            <input
              type="number"
              min={1}
              value={quotaTarget}
              onChange={(e) => setQuotaTarget(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-on disabled:opacity-50"
      >
        {mode === "create" ? "Crear hábito" : "Guardar cambios"}
      </button>
    </form>
  );
}
