"use client";

import { useState, useTransition } from "react";
import { setWeightAction } from "@/app/actions";

export default function WeightQuickInput({
  date,
  initialWeight,
}: {
  date: string;
  initialWeight: number | null;
}) {
  const [value, setValue] = useState(initialWeight?.toString() ?? "");
  const [saved, setSaved] = useState(initialWeight !== null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await setWeightAction(date, Number(value.replace(",", ".")));
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
      <span className="text-sm text-neutral-500">Peso de hoy</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder="72.4"
        className="w-20 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-300"
      />
      <span className="text-sm text-neutral-400">kg</span>
      <button
        type="submit"
        disabled={pending || !value.trim()}
        className="ml-auto shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {saved ? "Guardado" : "Guardar"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
