"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addSetAction,
  deleteSetAction,
  getExerciseHistoryAction,
  removeExerciseFromSessionAction,
  updateSetAction,
} from "@/app/gym-actions";
import { MUSCLE_LABELS, SET_TYPE_SHORT } from "@/lib/gymLabels";
import { IconCheck, IconStar } from "@/components/icons";
import type { MuscleGroup, SetType } from "@/generated/prisma/client";

const SET_TYPES: SetType[] = ["WARMUP", "NORMAL", "TOP_SET", "BACK_OFF"];

type SetRow = { id: string; weightKg: number; reps: number; setType: SetType; isPr: boolean };

type HistoryEntry = {
  id: string;
  date: Date;
  routineName: string;
  sets: { weightKg: number; reps: number; setType: SetType; isPr: boolean }[];
};

function SetTypePicker({ value, onChange }: { value: SetType; onChange: (t: SetType) => void }) {
  return (
    <div className="flex gap-1">
      {SET_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
            value === t ? "bg-gradient-to-br from-violet to-violet-2 text-violet-on" : "bg-surface-muted text-text-faint"
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
  onSave,
  onDelete,
}: {
  set: SetRow;
  onSave: (weightKg: number, reps: number, setType: SetType) => Promise<{ ok: boolean; error?: string }>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState(set.weightKg.toString());
  const [reps, setReps] = useState(set.reps.toString());
  const [setType, setSetType] = useState<SetType>(set.setType);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div
        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
          set.isPr ? "border border-gold/40 bg-gold-soft" : "bg-surface-muted"
        }`}
      >
        <button type="button" onClick={() => setEditing(true)} className="flex items-center text-left text-text">
          {set.isPr && <IconStar className="mr-1.5 h-3.5 w-3.5 shrink-0 text-gold-strong" />}
          <span>
            <span className="font-medium">{set.weightKg}kg</span> × {set.reps}
          </span>
          <span className="ml-2 text-xs text-text-faint">{SET_TYPE_SHORT[set.setType]}</span>
          {set.isPr && <span className="ml-2 text-xs font-semibold text-gold-strong">PR</span>}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setPending(true);
            onDelete().finally(() => setPending(false));
          }}
          className="text-xs text-danger/70 hover:text-danger disabled:opacity-50"
        >
          Quitar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-violet/40 bg-surface px-3 py-2.5">
      <div className="flex items-center gap-2">
        <input
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm outline-none focus:border-violet"
        />
        <span className="text-xs text-text-faint">kg ×</span>
        <input
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-14 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm outline-none focus:border-violet"
        />
        <span className="text-xs text-text-faint">reps</span>
      </div>
      <SetTypePicker value={setType} onChange={setSetType} />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(false)}
          className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-text-muted disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            setPending(true);
            onSave(Number(weight.replace(",", ".")), Number(reps), setType)
              .then((result) => {
                if (result.ok) setEditing(false);
                else setError(result.error ?? "Error al guardar.");
              })
              .finally(() => setPending(false));
          }}
          className="flex-1 rounded-lg bg-gradient-to-br from-violet to-violet-2 py-1.5 text-xs font-semibold text-violet-on disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Listo"}
        </button>
      </div>
    </div>
  );
}

function formatHistoryDate(date: Date): string {
  return new Date(date).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function ExerciseHistoryPanel({ exerciseId }: { exerciseId: string }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (entries === null) {
      startTransition(async () => {
        const result = await getExerciseHistoryAction(exerciseId);
        setEntries(result);
      });
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="text-xs font-medium text-violet-strong hover:underline"
      >
        {open ? "Ocultar entrenos anteriores" : "Ver entrenos anteriores"}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {pending && entries === null && <p className="text-xs text-text-faint">Cargando…</p>}
          {entries !== null && entries.length === 0 && (
            <p className="text-xs text-text-faint">Sin entrenos anteriores de este ejercicio.</p>
          )}
          {entries?.map((entry) => (
            <div key={entry.id} className="rounded-xl bg-surface-muted px-3 py-2 text-xs">
              <p className="mb-1 font-medium text-text-faint">{formatHistoryDate(entry.date)}</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.sets.map((s, i) => (
                  <span
                    key={i}
                    className={`flex items-center rounded-lg px-2 py-1 ${
                      s.isPr ? "bg-gold-soft text-gold-strong" : "bg-surface text-text"
                    }`}
                  >
                    {s.isPr && <IconStar className="mr-1 h-3 w-3 shrink-0" />}
                    {s.weightKg}kg × {s.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WorkoutExerciseCard({
  workoutExerciseId,
  exerciseId,
  sessionId,
  exerciseName,
  primaryMuscle,
  targetRepMin,
  targetRepMax,
  lastPerformance,
  initialSets,
  suggestion,
  onSetLogged,
  open,
  onOpen,
  onSaved,
}: {
  workoutExerciseId: string;
  exerciseId: string;
  sessionId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  targetRepMin: number | null;
  targetRepMax: number | null;
  lastPerformance: { sets: { weightKg: number; reps: number; setType: SetType }[] } | null;
  initialSets: SetRow[];
  suggestion: { text: string } | null;
  onSetLogged: () => void;
  open: boolean;
  onOpen: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  // Cada serie se guarda en la BD en cuanto se añade/edita/borra — nada
  // queda solo en memoria, así salir de la app o recargar a mitad de
  // ejercicio nunca pierde series ya registradas.
  const [sets, setSets] = useState<SetRow[]>(initialSets);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trae esta tarjeta a la vista en cuanto pasa a ser la abierta — cubre
  // tanto tocar una tarjeta colapsada como tocar "Editar" en una ya guardada,
  // así nunca hace falta hacer scroll para encontrarla.
  useEffect(() => {
    if (open) containerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [open]);

  const done = sets.length > 0;

  const [removing, startRemoveTransition] = useTransition();

  const lastBest = lastPerformance?.sets.length
    ? lastPerformance.sets.reduce((best, s) => (s.weightKg > best.weightKg ? s : best), lastPerformance.sets[0])
    : null;

  const [weight, setWeight] = useState(lastBest ? lastBest.weightKg.toString() : "");
  const [reps, setReps] = useState(lastBest ? lastBest.reps.toString() : "");
  const [setType, setSetType] = useState<SetType>("NORMAL");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function removeFromSession() {
    const warning =
      sets.length > 0
        ? `¿Quitar "${exerciseName}" de hoy? Perderás las ${sets.length} serie(s) ya registradas en este entrenamiento. La rutina no se modifica.`
        : `¿Quitar "${exerciseName}" de hoy? La rutina no se modifica, solo el entrenamiento de hoy.`;
    if (!window.confirm(warning)) return;
    startRemoveTransition(async () => {
      await removeExerciseFromSessionAction(workoutExerciseId, sessionId);
      router.refresh();
    });
  }

  function addSet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const w = Number(weight.replace(",", "."));
    const r = Number(reps);
    if (!Number.isFinite(w) || w < 0 || w > 500) {
      setError("Peso inválido.");
      return;
    }
    if (!Number.isInteger(r) || r < 1 || r > 100) {
      setError("Repeticiones inválidas.");
      return;
    }
    startTransition(async () => {
      const result = await addSetAction(workoutExerciseId, sessionId, w, r, setType);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSets((prev) => [
        ...(result.isPr ? prev.map((x) => ({ ...x, isPr: false })) : prev),
        { id: result.id, weightKg: w, reps: r, setType, isPr: result.isPr },
      ]);
      onSetLogged();
    });
  }

  async function handleUpdateSet(id: string, weightKg: number, reps: number, setType: SetType) {
    if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 500) return { ok: false, error: "Peso inválido." };
    if (!Number.isInteger(reps) || reps < 1 || reps > 100) return { ok: false, error: "Repeticiones inválidas." };
    const result = await updateSetAction(id, sessionId, weightKg, reps, setType);
    if (!result.ok) return { ok: false, error: result.error };
    setSets((prev) =>
      prev.map((x) => {
        if (x.id === id) return { id, weightKg, reps, setType, isPr: result.isPr };
        return result.isPr ? { ...x, isPr: false } : x;
      })
    );
    return { ok: true };
  }

  async function handleDeleteSet(id: string) {
    await deleteSetAction(id, sessionId);
    setSets((prev) => prev.filter((x) => x.id !== id));
  }

  if (!open) {
    if (done) {
      return (
        <div
          ref={containerRef}
          className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-3 shadow-card"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-accent-on">
              <IconCheck className="h-3 w-3" />
            </span>
            <p className="truncate font-medium text-text">{exerciseName}</p>
            <span className="shrink-0 text-xs font-medium text-accent-strong">Guardado</span>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-muted transition-all active:scale-95"
          >
            Editar
          </button>
        </div>
      );
    }
    return (
      <div ref={containerRef}>
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-left shadow-card transition-colors active:scale-[0.99]"
        >
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate font-medium text-text">{exerciseName}</p>
            <span className="shrink-0 rounded-full bg-violet-soft px-2 py-0.5 text-[10px] font-medium text-violet-strong">
              {MUSCLE_LABELS[primaryMuscle]}
            </span>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-text-faint">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="font-medium text-text">{exerciseName}</p>
            <span className="rounded-full bg-violet-soft px-2 py-0.5 text-[10px] font-medium text-violet-strong">
              {MUSCLE_LABELS[primaryMuscle]}
            </span>
          </div>
          <button
            type="button"
            disabled={removing}
            onClick={removeFromSession}
            className="shrink-0 text-xs text-danger/70 hover:text-danger disabled:opacity-50"
          >
            Quitar de hoy
          </button>
        </div>
        <p className="mt-0.5 text-xs text-text-faint">
          {lastBest ? `Última vez: ${lastBest.weightKg}kg × ${lastBest.reps}` : "Sin registros previos"}
          {targetRepMin && targetRepMax ? ` · objetivo ${targetRepMin}-${targetRepMax} reps` : ""}
        </p>
        {suggestion && <p className="mt-1 text-xs text-violet-strong">{suggestion.text}</p>}
        <div className="mt-1.5">
          <ExerciseHistoryPanel exerciseId={exerciseId} />
        </div>
      </div>

      {sets.length > 0 && (
        <div className="space-y-1.5">
          {sets.map((s) => (
            <ExistingSetRow
              key={s.id}
              set={s}
              onSave={(weightKg, reps, setType) => handleUpdateSet(s.id, weightKg, reps, setType)}
              onDelete={() => handleDeleteSet(s.id)}
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
            className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm outline-none focus:border-violet"
          />
          <span className="text-xs text-text-faint">kg ×</span>
          <input
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="reps"
            className="w-14 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm outline-none focus:border-violet"
          />
          <span className="text-xs text-text-faint">reps</span>
          <button
            type="submit"
            disabled={pending || !weight.trim() || !reps.trim()}
            className="ml-auto shrink-0 rounded-lg bg-gradient-to-br from-violet to-violet-2 px-3.5 py-1.5 text-xs font-semibold text-violet-on disabled:opacity-50"
          >
            + Serie
          </button>
        </div>
        <SetTypePicker value={setType} onChange={setSetType} />
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>

      <button
        type="button"
        onClick={onSaved}
        className="w-full rounded-xl bg-gradient-to-br from-accent to-accent-2 py-2.5 text-sm font-semibold text-accent-on shadow-glow transition-all active:scale-[0.98]"
      >
        Listo
      </button>
    </div>
  );
}
