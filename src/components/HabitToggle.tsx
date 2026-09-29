"use client";

import { useTransition } from "react";
import { toggleHabitLogAction } from "@/app/actions";

export default function HabitToggle({
  habitId,
  date,
  name,
  done,
  streak,
}: {
  habitId: string;
  date: string;
  name: string;
  done: boolean;
  streak: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleHabitLogAction(habitId, date))}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition disabled:opacity-60 ${
        done
          ? "border-accent/30 bg-accent-soft text-text"
          : "border-border bg-surface text-text hover:border-text-faint"
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
      {streak > 0 && (
        <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-muted">
          {streak}
        </span>
      )}
    </button>
  );
}
