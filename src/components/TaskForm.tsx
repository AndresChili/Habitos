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
        className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-300"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="w-28 shrink-0 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-300"
      />
      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        Añadir
      </button>
    </form>
  );
}
