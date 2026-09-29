"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  archiveHabitAction,
  pauseHabitAction,
  restoreHabitAction,
  resumeHabitAction,
} from "@/app/actions";

const pill = "rounded-lg px-2 py-1 text-xs font-medium transition-all active:scale-95";

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
        className={`${pill} text-text-faint hover:bg-surface-muted hover:text-text-muted disabled:opacity-50`}
      >
        Restaurar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 text-text-faint">
      <Link href={`/habitos/${id}`} className={`${pill} hover:bg-accent-soft hover:text-accent-strong`}>
        Progreso
      </Link>
      <Link href={`/habitos/${id}/editar`} className={`${pill} hover:bg-surface-muted hover:text-text-muted`}>
        Editar
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => (paused ? resumeHabitAction(id) : pauseHabitAction(id)))}
        className={`${pill} hover:bg-surface-muted hover:text-text-muted disabled:opacity-50`}
      >
        {paused ? "Reanudar" : "Pausar"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => archiveHabitAction(id))}
        className={`${pill} hover:bg-danger/10 hover:text-danger disabled:opacity-50`}
      >
        Eliminar
      </button>
    </div>
  );
}
