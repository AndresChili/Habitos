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
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition disabled:opacity-60 ${
        done
          ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
          : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-700"
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
            done ? "border-white/70" : "border-neutral-300 dark:border-neutral-600"
          }`}
        >
          {done && "✓"}
        </span>
        {name}
      </span>
      {streak > 0 && <span className="shrink-0 text-xs opacity-70">🔥 {streak}</span>}
    </button>
  );
}
