"use client";

import { useState, useTransition } from "react";
import { createHabitAction } from "@/app/actions";
import type { Frequency } from "@/generated/prisma/client";

export default function CreateHabitForm({
  frequency,
  disabled,
}: {
  frequency: Frequency;
  disabled: boolean;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (disabled) {
    return (
      <p className="text-xs text-neutral-400">
        Slots completos por ahora. Cumple tus hábitos para desbloquear más.
      </p>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createHabitAction(name, frequency);
      if (!result.ok) setError(result.error);
      else setName("");
    });
  }

  return (
    <div className="space-y-1">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nuevo hábito"
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-300"
        />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          Añadir
        </button>
      </form>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
