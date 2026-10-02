"use client";

import { useState, useTransition } from "react";
import { updateRoutineAction, updateRoutineWeekdaysAction } from "@/app/gym-actions";
import WeekdayPicker from "@/components/WeekdayPicker";

export default function RoutineEditForm({
  id,
  initialName,
  initialDescription,
  initialWeekdays,
}: {
  id: string;
  initialName: string;
  initialDescription: string | null;
  initialWeekdays: number[];
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [weekdays, setWeekdays] = useState(initialWeekdays);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateRoutineAction(id, name, description);
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  function changeWeekdays(next: number[]) {
    setWeekdays(next);
    startTransition(() => updateRoutineWeekdaysAction(id, next));
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setSaved(false);
        }}
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-text outline-none transition-colors focus:border-violet"
      />
      <input
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          setSaved(false);
        }}
        placeholder="Descripción (opcional)"
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-violet"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending || !name.trim() || saved}
        className="rounded-xl bg-gradient-to-br from-violet to-violet-2 px-4 py-2 text-xs font-semibold text-violet-on shadow-glow-violet transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {saved ? "Guardado" : "Guardar cambios"}
      </button>

      <div className="space-y-1.5 border-t border-border pt-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-text-faint">Día asignado</label>
        <WeekdayPicker value={weekdays} onChange={changeWeekdays} />
        <p className="text-xs text-text-faint">Si marcas un día que ya tiene otra rutina asignada, se la quita a esa otra.</p>
      </div>
    </form>
  );
}
