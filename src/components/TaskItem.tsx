"use client";

import { useState, useTransition } from "react";
import { deleteTaskAction, toggleTaskAction, updateTaskAction } from "@/app/actions";
import { IconCheck, IconTrash } from "@/components/icons";

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
        className="flex items-center gap-2 rounded-2xl border border-accent/40 bg-surface px-3 py-2.5 shadow-card"
      >
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none"
        />
        <input
          type="time"
          value={editTime}
          onChange={(e) => setEditTime(e.target.value)}
          className="w-24 shrink-0 bg-transparent text-xs text-text-muted outline-none"
        />
        <button type="submit" disabled={pending} className="shrink-0 rounded-lg bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-strong transition active:scale-95">
          Guardar
        </button>
        <button type="button" onClick={() => setEditing(false)} className="shrink-0 text-xs text-text-faint">
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm shadow-card transition-colors ${
        done ? "border-border bg-surface-muted text-text-faint" : "border-border bg-surface text-text"
      }`}
    >
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => toggleTaskAction(id))}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90 ${
          done ? "border-text-faint bg-text-faint text-surface" : "border-border"
        }`}
      >
        {done && <IconCheck />}
      </button>

      <button type="button" onClick={() => setEditing(true)} className={`min-w-0 flex-1 truncate text-left font-medium ${done ? "line-through" : ""}`}>
        {title}
      </button>

      {time && <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-faint">{time}</span>}

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => deleteTaskAction(id))}
        className="shrink-0 text-danger/70 transition-all hover:text-danger active:scale-90 disabled:opacity-50"
        aria-label="Eliminar tarea"
      >
        <IconTrash />
      </button>
    </div>
  );
}
