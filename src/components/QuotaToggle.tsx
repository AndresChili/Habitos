"use client";

import { useTransition } from "react";
import { toggleQuotaLogAction } from "@/app/actions";
import { IconCheck } from "@/components/icons";

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
      <div className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-4 py-3.5 text-left text-sm text-text-faint">
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
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm shadow-card transition-all active:scale-[0.98] disabled:opacity-60 ${
        done
          ? "border-accent/25 bg-accent-soft text-text"
          : "border-border bg-surface text-text hover:border-text-faint/60"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          done ? "border-accent bg-gradient-to-br from-accent to-accent-2 text-accent-on" : "border-border"
        }`}
      >
        {done && <IconCheck />}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
      <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-muted">
        {periodLabel}
      </span>
    </button>
  );
}
