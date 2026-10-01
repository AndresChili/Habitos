"use client";

import { useState, useTransition } from "react";
import { updateRoutineAction } from "@/app/gym-actions";

export default function RoutineEditForm({
  id,
  initialName,
  initialDescription,
}: {
  id: string;
  initialName: string;
  initialDescription: string | null;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
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

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setSaved(false);
        }}
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-text outline-none transition-colors focus:border-accent"
      />
      <input
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          setSaved(false);
        }}
        placeholder="Descripción (opcional)"
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending || !name.trim() || saved}
        className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-on shadow-sm shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {saved ? "Guardado" : "Guardar cambios"}
      </button>
    </form>
  );
}
