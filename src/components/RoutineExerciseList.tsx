"use client";

import { useEffect, useState, useTransition } from "react";
import {
  removeExerciseFromRoutineAction,
  reorderRoutineExercisesAction,
  updateRoutineExerciseTargetAction,
} from "@/app/gym-actions";
import { MUSCLE_LABELS } from "@/lib/gymLabels";
import type { MuscleGroup } from "@/generated/prisma/client";

export type RoutineExerciseItem = {
  id: string;
  targetRepMin: number | null;
  targetRepMax: number | null;
  exercise: { id: string; name: string; primaryMuscle: MuscleGroup };
};

function RepRangeEditor({
  id,
  routineId,
  min,
  max,
}: {
  id: string;
  routineId: string;
  min: number | null;
  max: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [minVal, setMinVal] = useState(min?.toString() ?? "");
  const [maxVal, setMaxVal] = useState(max?.toString() ?? "");
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-text-faint underline decoration-dotted underline-offset-2 hover:text-text-muted"
      >
        {min && max ? `${min}-${max} reps` : "+ rango de reps"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        inputMode="numeric"
        value={minVal}
        onChange={(e) => setMinVal(e.target.value)}
        placeholder="8"
        className="w-10 rounded-lg border border-border bg-surface px-1.5 py-1 text-center text-xs text-text outline-none focus:border-violet"
      />
      <span className="text-xs text-text-faint">–</span>
      <input
        inputMode="numeric"
        value={maxVal}
        onChange={(e) => setMaxVal(e.target.value)}
        placeholder="12"
        className="w-10 rounded-lg border border-border bg-surface px-1.5 py-1 text-center text-xs text-text outline-none focus:border-violet"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateRoutineExerciseTargetAction(
              id,
              routineId,
              minVal ? Number(minVal) : undefined,
              maxVal ? Number(maxVal) : undefined
            );
            setEditing(false);
          })
        }
        className="rounded-lg bg-violet-soft px-2 py-1 text-xs font-medium text-violet-strong"
      >
        OK
      </button>
    </div>
  );
}

export default function RoutineExerciseList({
  routineId,
  items,
}: {
  routineId: string;
  items: RoutineExerciseItem[];
}) {
  const [list, setList] = useState(items);
  const [, startTransition] = useTransition();

  useEffect(() => setList(items), [items]);

  function persistOrder(next: RoutineExerciseItem[]) {
    setList(next);
    startTransition(() => reorderRoutineExercisesAction(routineId, next.map((i) => i.id)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next);
  }

  function remove(id: string) {
    setList((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => removeExerciseFromRoutineAction(id, routineId));
  }

  if (list.length === 0) {
    return <p className="text-sm text-text-faint">Todavía no has añadido ejercicios.</p>;
  }

  return (
    <div className="space-y-2">
      {list.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-card"
        >
          <div className="flex flex-col">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              className="px-1 text-text-faint disabled:opacity-20"
              aria-label="Subir"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={index === list.length - 1}
              onClick={() => move(index, 1)}
              className="px-1 text-text-faint disabled:opacity-20"
              aria-label="Bajar"
            >
              ▼
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text">{item.exercise.name}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="rounded-full bg-violet-soft px-2 py-0.5 text-[10px] font-medium text-violet-strong">
                {MUSCLE_LABELS[item.exercise.primaryMuscle]}
              </span>
              <RepRangeEditor id={item.id} routineId={routineId} min={item.targetRepMin} max={item.targetRepMax} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => remove(item.id)}
            className="shrink-0 rounded-lg bg-danger/10 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/15"
          >
            Quitar
          </button>
        </div>
      ))}
    </div>
  );
}
