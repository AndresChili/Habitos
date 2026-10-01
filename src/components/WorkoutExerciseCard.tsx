"use client";

import { useState, useTransition } from "react";
import { addSetAction, deleteSetAction, updateSetAction } from "@/app/gym-actions";
import { MUSCLE_LABELS, SET_TYPE_SHORT } from "@/lib/gymLabels";
import type { MuscleGroup, SetType } from "@/generated/prisma/client";

const SET_TYPES: SetType[] = ["WARMUP", "NORMAL", "TOP_SET", "BACK_OFF"];

type SetRow = { id: string; weightKg: number; reps: number; setType: SetType };

function SetTypePicker({ value, onChange }: { value: SetType; onChange: (t: SetType) => void }) {
  return (
    <div className="flex gap-1">
      {SET_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
            value === t ? "bg-accent text-accent-on" : "bg-surface-muted text-text-faint"
          }`}
        >
          {SET_TYPE_SHORT[t]}
        </button>
      ))}
    </div>
  );
}

function ExistingSetRow({
  set,
  sessionId,
  onChanged,
}: {
  set: SetRow;
  sessionId: string;
  onChanged: (updated: SetRow | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState(set.weightKg.toString());
  const [reps, setReps] = useState(set.reps.toString());
  const [setType, setSetType] = useState<SetType>(set.setType);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2 text-sm">
        <button type="button" onClick={() => setEditing(true)} className="text-left text-text">
          <span className="font-medium">{set.weightKg}kg</span> × {set.reps}
          <span className="ml-2 text-xs text-text-faint">{SET_TYPE_SHORT[set.setType]}</span>
        </button>
        <button
          type="button"
          onClick={() => startTransition(async () => { await deleteSetAction(set.id, sessionId); onChanged(null); })}
          className="text-xs text-text-faint hover:text-danger"
        >
          Quitar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-accent/40 bg-surface px-3 py-2.5">
      <div className="flex items-center gap-2">
        <input
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm outline-none focus:border-accent"
        />
        <span className="text-xs text-text-faint">kg ×</span>
        <input
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-14 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm outline-none focus:border-accent"
        />
        <span className="text-xs text-text-faint">reps</span>
      </div>
      <SetTypePicker value={setType} onChange={setSetType} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-text-muted">
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await updateSetAction(set.id, sessionId, Number(weight.replace(",", ".")), Number(reps), setType);
              if (result.ok) {
                onChanged({ id: set.id, weightKg: Number(weight.replace(",", ".")), reps: Number(reps), setType });
                setEditing(false);
              }
            })
          }
          className="flex-1 rounded-lg bg-accent py-1.5 text-xs font-semibold text-accent-on disabled:opacity-50"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

export default function WorkoutExerciseCard({
  workoutExerciseId,
  sessionId,
  exerciseName,
  primaryMuscle,
  targetRepMin,
  targetRepMax,
  lastPerformance,
  initialSets,
  suggestion,
  onSetLogged,
}: {
  workoutExerciseId: string;
  sessionId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  targetRepMin: number | null;
  targetRepMax: number | null;
  lastPerformance: { sets: { weightKg: number; reps: number; setType: SetType }[] } | null;
  initialSets: SetRow[];
  suggestion: { text: string } | null;
  onSetLogged: () => void;
}) {
  const [sets, setSets] = useState<SetRow[]>(initialSets);
  const lastBest = lastPerformance?.sets.length
    ? lastPerformance.sets.reduce((best, s) => (s.weightKg > best.weightKg ? s : best), lastPerformance.sets[0])
    : null;

  const [weight, setWeight] = useState(lastBest ? lastBest.weightKg.toString() : "");
  const [reps, setReps] = useState(lastBest ? lastBest.reps.toString() : "");
  const [setType, setSetType] = useState<SetType>("NORMAL");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addSet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addSetAction(
        workoutExerciseId,
        sessionId,
        Number(weight.replace(",", ".")),
        Number(reps),
        setType
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSets((prev) => [...prev, { id: result.id, weightKg: Number(weight.replace(",", ".")), reps: Number(reps), setType }]);
      onSetLogged();
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-text">{exerciseName}</p>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-strong">
            {MUSCLE_LABELS[primaryMuscle]}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-text-faint">
          {lastBest ? `Última vez: ${lastBest.weightKg}kg × ${lastBest.reps}` : "Sin registros previos"}
          {targetRepMin && targetRepMax ? ` · objetivo ${targetRepMin}-${targetRepMax} reps` : ""}
        </p>
        {suggestion && <p className="mt-1 text-xs text-accent-strong">{suggestion.text}</p>}
      </div>

      {sets.length > 0 && (
        <div className="space-y-1.5">
          {sets.map((s) => (
            <ExistingSetRow
              key={s.id}
              set={s}
              sessionId={sessionId}
              onChanged={(updated) =>
                setSets((prev) => (updated ? prev.map((x) => (x.id === s.id ? updated : x)) : prev.filter((x) => x.id !== s.id)))
              }
            />
          ))}
        </div>
      )}

      <form onSubmit={addSet} className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="kg"
            className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm outline-none focus:border-accent"
          />
          <span className="text-xs text-text-faint">kg ×</span>
          <input
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="reps"
            className="w-14 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm outline-none focus:border-accent"
          />
          <span className="text-xs text-text-faint">reps</span>
          <button
            type="submit"
            disabled={pending || !weight.trim() || !reps.trim()}
            className="ml-auto shrink-0 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-on disabled:opacity-50"
          >
            + Serie
          </button>
        </div>
        <SetTypePicker value={setType} onChange={setSetType} />
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </div>
  );
}
