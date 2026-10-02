"use client";

import { useState, useTransition } from "react";
import { createRoutineAction } from "@/app/gym-actions";
import WeekdayPicker from "@/components/WeekdayPicker";

export default function RoutineForm({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-text-muted transition-all active:scale-[0.98] hover:border-violet hover:text-violet"
      >
        + Añadir rutina
      </button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createRoutineAction(name, description, weekdays);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setDescription("");
      setWeekdays([]);
      setOpen(false);
      onCreated?.();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        placeholder="Ej. Lunes — Espalda y Bíceps"
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-violet"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción (opcional)"
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-violet"
      />
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-text-faint">
          Día de la semana (opcional)
        </label>
        <WeekdayPicker value={weekdays} onChange={setWeekdays} />
      </div>
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
          className="flex-1 rounded-xl bg-gradient-to-br from-violet to-violet-2 py-2.5 text-sm font-semibold text-violet-on shadow-glow-violet transition-all active:scale-[0.98] disabled:opacity-50"
        >
          Crear
        </button>
      </div>
    </form>
  );
}
