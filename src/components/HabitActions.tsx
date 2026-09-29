"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  archiveHabitAction,
  pauseHabitAction,
  restoreHabitAction,
  resumeHabitAction,
} from "@/app/actions";

export default function HabitActions({
  id,
  archived,
  paused,
}: {
  id: string;
  archived: boolean;
  paused: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (archived) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => restoreHabitAction(id))}
        className="text-xs text-text-faint transition hover:text-text-muted disabled:opacity-50"
      >
        Restaurar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs text-text-faint">
      <Link href={`/habitos/${id}`} className="transition hover:text-accent">
        Progreso
      </Link>
      <Link href={`/habitos/${id}/editar`} className="transition hover:text-text-muted">
        Editar
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => (paused ? resumeHabitAction(id) : pauseHabitAction(id)))}
        className="transition hover:text-text-muted disabled:opacity-50"
      >
        {paused ? "Reanudar" : "Pausar"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => archiveHabitAction(id))}
        className="transition hover:text-danger disabled:opacity-50"
      >
        Eliminar
      </button>
    </div>
  );
}
