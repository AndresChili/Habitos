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
        className="text-xs text-neutral-400 transition hover:text-neutral-900 disabled:opacity-50 dark:hover:text-neutral-100"
      >
        Restaurar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs text-neutral-400">
      <Link href={`/habitos/${id}/editar`} className="transition hover:text-neutral-900 dark:hover:text-neutral-100">
        Editar
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => (paused ? resumeHabitAction(id) : pauseHabitAction(id)))}
        className="transition hover:text-neutral-900 disabled:opacity-50 dark:hover:text-neutral-100"
      >
        {paused ? "Reanudar" : "Pausar"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => archiveHabitAction(id))}
        className="transition hover:text-red-500 disabled:opacity-50"
      >
        Eliminar
      </button>
    </div>
  );
}
