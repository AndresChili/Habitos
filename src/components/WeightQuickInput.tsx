"use client";

import { useState, useTransition } from "react";
import { setWeightAction } from "@/app/actions";
import { IconWeight } from "@/components/icons";

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
    <form onSubmit={submit} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <IconWeight className="h-4 w-4 shrink-0 text-text-faint" />
      <span className="shrink-0 text-sm text-text-muted">Peso de hoy</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder="72.4"
        className="w-16 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text outline-none transition focus:border-accent"
      />
      <span className="shrink-0 text-sm text-text-faint">kg</span>
      <button
        type="submit"
        disabled={pending || !value.trim()}
        className="ml-auto shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-on disabled:opacity-50"
      >
        {saved ? "Guardado" : "Guardar"}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
