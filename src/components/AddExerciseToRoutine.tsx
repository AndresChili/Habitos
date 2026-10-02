"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addExerciseToRoutineAction } from "@/app/gym-actions";
import { MUSCLE_LABELS } from "@/lib/gymLabels";
import type { MuscleGroup } from "@/generated/prisma/client";

type Exercise = { id: string; name: string; primaryMuscle: MuscleGroup };

export default function AddExerciseToRoutine({ routineId, exercises }: { routineId: string; exercises: Exercise[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) => e.name.toLowerCase().includes(q) || MUSCLE_LABELS[e.primaryMuscle].toLowerCase().includes(q)
    );
  }, [exercises, query]);

  function add(exerciseId: string) {
    startTransition(async () => {
      await addExerciseToRoutineAction(routineId, exerciseId);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-text-muted transition-all active:scale-[0.98] hover:border-accent hover:text-accent"
      >
        + Añadir ejercicio
      </button>
    );
  }

  return (
    <div className="space-y-2.5 rounded-2xl border border-border bg-surface p-3 shadow-card">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="Buscar ejercicio..."
          className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-medium text-text-faint hover:bg-surface-muted"
        >
          Cerrar
        </button>
      </div>
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-1 py-2 text-xs text-text-faint">Sin resultados. Créalo en la biblioteca de ejercicios.</p>
        ) : (
          filtered.map((e) => (
            <button
              key={e.id}
              type="button"
              disabled={pending}
              onClick={() => add(e.id)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              <span className="text-text">{e.name}</span>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-strong">
                {MUSCLE_LABELS[e.primaryMuscle]}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
