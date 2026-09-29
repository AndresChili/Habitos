"use client";

import { useState, useTransition } from "react";
import { createTaskAction } from "@/app/actions";

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
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nueva tarea"
        className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="w-28 shrink-0 rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text-muted outline-none transition focus:border-accent"
      />
      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-on disabled:opacity-50"
      >
        Añadir
      </button>
    </form>
  );
}
