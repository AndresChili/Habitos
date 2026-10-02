"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExerciseAction } from "@/app/gym-actions";
import { EQUIPMENT_LABELS, MUSCLE_LABELS, MUSCLE_ORDER } from "@/lib/gymLabels";
import type { Equipment, MuscleGroup } from "@/generated/prisma/client";

const EQUIPMENT_ORDER: Equipment[] = ["BARBELL", "DUMBBELL", "MACHINE", "CABLE", "BODYWEIGHT"];

export default function ExerciseCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>("CHEST");
  const [equipment, setEquipment] = useState<Equipment>("BARBELL");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-text-muted transition-all active:scale-[0.98] hover:border-accent hover:text-accent"
      >
        + Crear ejercicio
      </button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createExerciseAction({ name, primaryMuscle, equipment, instructions });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setInstructions("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        placeholder="Nombre del ejercicio"
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={primaryMuscle}
          onChange={(e) => setPrimaryMuscle(e.target.value as MuscleGroup)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
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
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
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
        className="w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-text-muted transition-all active:scale-[0.98]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-on shadow-sm shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          Crear
        </button>
      </div>
    </form>
  );
}
