"use client";

import { useState, useTransition } from "react";
import { createTaskAction } from "@/app/actions";
import { IconPlus } from "@/components/icons";

export default function TaskForm({ date }: { date: string }) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createTaskAction(date, title, time || undefined);
      if (result.ok) {
        setTitle("");
        setTime("");
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-1.5 pl-4 shadow-sm shadow-black/[0.03] focus-within:border-accent"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nueva tarea"
        className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-text outline-none placeholder:text-text-faint"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="w-24 shrink-0 bg-transparent text-xs text-text-muted outline-none"
      />
      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-on transition-all active:scale-90 disabled:opacity-40"
        aria-label="Añadir tarea"
      >
        <IconPlus />
      </button>
    </form>
  );
}
