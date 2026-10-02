"use client";

import { useState, useTransition } from "react";
import { setWeightAction } from "@/app/actions";
import { IconWeight } from "@/components/icons";

export default function WeightQuickInput({
  date,
  initialWeight,
  suggestedWeight = null,
  previousWeight = null,
}: {
  date: string;
  initialWeight: number | null;
  suggestedWeight?: number | null;
  previousWeight?: number | null;
}) {
  const [value, setValue] = useState(initialWeight?.toString() ?? suggestedWeight?.toString() ?? "");
  const [saved, setSaved] = useState(initialWeight !== null);
  const [isSuggestion, setIsSuggestion] = useState(initialWeight === null && suggestedWeight !== null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const delta =
    initialWeight !== null && previousWeight !== null ? Math.round((initialWeight - previousWeight) * 10) / 10 : null;

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
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-card focus-within:border-rose"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose to-rose-2 text-rose-on shadow-glow-rose">
        <IconWeight className="h-4 w-4" />
      </span>
      <span className="shrink-0 text-sm font-medium text-text-muted">Peso de hoy</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
          setIsSuggestion(false);
        }}
        placeholder="72.4"
        className={`w-16 border-0 border-b border-border bg-transparent py-0.5 text-right text-sm outline-none focus:border-rose ${
          isSuggestion ? "text-text-faint" : "text-text"
        }`}
      />
      <span className="shrink-0 text-sm text-text-faint">kg</span>
      {delta !== null && delta !== 0 && (
        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${
            delta < 0 ? "bg-accent-soft text-accent-strong" : "bg-danger/10 text-danger"
          }`}
        >
          {delta > 0 ? "+" : ""}
          {delta}
        </span>
      )}
      <button
        type="submit"
        disabled={pending || !value.trim()}
        className="ml-auto shrink-0 rounded-xl bg-gradient-to-br from-rose to-rose-2 px-3.5 py-1.5 text-xs font-semibold text-rose-on shadow-glow-rose transition-all active:scale-95 disabled:opacity-50"
      >
        {saved ? "Guardado" : "Guardar"}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
