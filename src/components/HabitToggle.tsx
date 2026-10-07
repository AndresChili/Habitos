"use client";

import { useTransition } from "react";
import { toggleHabitLogAction } from "@/app/actions";
import { IconCheck, IconFlame } from "@/components/icons";

export default function HabitToggle({
  habitId,
  date,
  name,
  done,
  streak,
  excused = false,
}: {
  habitId: string;
  date: string;
  name: string;
  done: boolean;
  streak: number;
  excused?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleHabitLogAction(habitId, date))}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-all active:scale-[0.99] disabled:opacity-60 ${
        done ? "text-text" : "text-text hover:bg-surface-muted"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          done ? "border-accent bg-gradient-to-br from-accent to-accent-2 text-accent-on" : "border-border"
        }`}
      >
        {done && <IconCheck />}
      </span>
      <span className={`min-w-0 flex-1 truncate font-medium ${done ? "" : "text-text-muted"}`}>{name}</span>
      {excused && !done && (
        <span className="shrink-0 rounded-full bg-surface-muted px-2 py-1 text-[10px] font-medium text-text-faint">
          no cuenta
        </span>
      )}
      {streak > 0 && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-bold text-warn">
          <IconFlame className="h-3 w-3" />
          {streak}
        </span>
      )}
    </button>
  );
}
