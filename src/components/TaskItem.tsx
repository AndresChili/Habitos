"use client";

import { useState, useTransition } from "react";
import { deleteTaskAction, toggleTaskAction, updateTaskAction } from "@/app/actions";

export default function TaskItem({
  id,
  date,
  title,
  time,
  done,
}: {
  id: string;
  date: string;
  title: string;
  time: string | null;
  done: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editTime, setEditTime] = useState(time ?? "");
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await updateTaskAction(id, editTitle, editTime || undefined, date);
            setEditing(false);
          });
        }}
        className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <input
          type="time"
          value={editTime}
          onChange={(e) => setEditTime(e.target.value)}
          className="w-24 shrink-0 bg-transparent text-xs text-neutral-500 outline-none"
        />
        <button type="submit" disabled={pending} className="shrink-0 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          Guardar
        </button>
        <button type="button" onClick={() => setEditing(false)} className="shrink-0 text-xs text-neutral-400">
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
        done
          ? "border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/50"
          : "border-neutral-200 bg-white text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
      }`}
    >
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => toggleTaskAction(id))}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
          done
            ? "border-neutral-400 bg-neutral-400 text-white dark:border-neutral-600 dark:bg-neutral-600"
            : "border-neutral-300 dark:border-neutral-600"
        }`}
      >
        {done && "✓"}
      </button>

      <button type="button" onClick={() => setEditing(true)} className={`min-w-0 flex-1 truncate text-left ${done ? "line-through" : ""}`}>
        {title}
      </button>

      {time && <span className="shrink-0 text-xs text-neutral-400">{time}</span>}

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => deleteTaskAction(id))}
        className="shrink-0 text-neutral-300 transition hover:text-red-500 disabled:opacity-50"
        aria-label="Eliminar tarea"
      >
        ×
      </button>
    </div>
  );
}
