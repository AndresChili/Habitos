"use client";

import { useTransition } from "react";
import { toggleQuotaLogAction } from "@/app/actions";

export default function QuotaToggle({
  habitId,
  name,
  done,
  periodLabel,
  paused,
}: {
  habitId: string;
  name: string;
  done: boolean;
  periodLabel: string;
  paused: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (paused) {
    return (
      <div className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-left text-sm text-text-faint">
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <span className="shrink-0 text-xs">pausado</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleQuotaLogAction(habitId))}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition disabled:opacity-60 ${
        done ? "border-accent/30 bg-accent-soft text-text" : "border-border bg-surface text-text hover:border-text-faint"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition ${
          done ? "border-accent bg-accent text-accent-on" : "border-border"
        }`}
      >
        {done && "✓"}
      </span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span className="shrink-0 text-xs text-text-faint">{periodLabel}</span>
    </button>
  );
}
