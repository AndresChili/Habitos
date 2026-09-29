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
    <form
      onSubmit={submit}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm shadow-black/[0.03] focus-within:border-accent"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
        <IconWeight className="h-4 w-4" />
      </span>
      <span className="shrink-0 text-sm font-medium text-text-muted">Peso de hoy</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder="72.4"
        className="w-16 border-0 border-b border-border bg-transparent py-0.5 text-right text-sm text-text outline-none focus:border-accent"
      />
      <span className="shrink-0 text-sm text-text-faint">kg</span>
      <button
        type="submit"
        disabled={pending || !value.trim()}
        className="ml-auto shrink-0 rounded-xl bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-on transition-all active:scale-95 disabled:opacity-50"
      >
        {saved ? "Guardado" : "Guardar"}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
