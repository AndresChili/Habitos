"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveExerciseAction, updateExerciseAction } from "@/app/gym-actions";
import { EQUIPMENT_LABELS, MUSCLE_LABELS, MUSCLE_ORDER } from "@/lib/gymLabels";
import { IconTrash } from "@/components/icons";
import type { Equipment, MuscleGroup } from "@/generated/prisma/client";

const EQUIPMENT_ORDER: Equipment[] = ["BARBELL", "DUMBBELL", "MACHINE", "CABLE", "BODYWEIGHT"];

type Exercise = {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  equipment: Equipment;
  instructions: string | null;
};

export default function ExerciseHeader({ exercise }: { exercise: Exercise }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(exercise.name);
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>(exercise.primaryMuscle);
  const [equipment, setEquipment] = useState<Equipment>(exercise.equipment);
  const [instructions, setInstructions] = useState(exercise.instructions ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`¿Eliminar "${exercise.name}"? Tu historial de sesiones no se verá afectado.`)) return;
    startTransition(() => archiveExerciseAction(exercise.id));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateExerciseAction(exercise.id, { name, primaryMuscle, equipment, instructions });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          placeholder="Nombre del ejercicio"
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-violet"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={primaryMuscle}
            onChange={(e) => setPrimaryMuscle(e.target.value as MuscleGroup)}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-violet"
          >
            {MUSCLE_ORDER.map((m) => (
              <option key={m} value={m}>
                {MUSCLE_LABELS[m]}
              </option>
            ))}
          </select>
          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value as Equipment)}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-violet"
          >
            {EQUIPMENT_ORDER.map((eq) => (
              <option key={eq} value={eq}>
                {EQUIPMENT_LABELS[eq]}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Notas / instrucciones (opcional)"
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-violet"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-text-muted transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="flex-1 rounded-xl bg-gradient-to-br from-violet to-violet-2 py-2.5 text-sm font-semibold text-violet-on shadow-glow-violet transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-text">{exercise.name}</h1>
        <p className="mt-0.5 text-sm text-text-muted">
          {MUSCLE_LABELS[exercise.primaryMuscle]} · {EQUIPMENT_LABELS[exercise.equipment]}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-text-muted transition-all hover:border-violet hover:text-violet active:scale-95"
        >
          Editar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleDelete}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-danger/10 py-1.5 text-xs font-semibold text-danger transition-all active:scale-95 disabled:opacity-50"
        >
          <IconTrash className="h-3.5 w-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  );
}
