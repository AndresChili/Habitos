"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  archiveHabitAction,
  pauseHabitAction,
  restoreHabitAction,
  resumeHabitAction,
} from "@/app/actions";
import { IconChartBar, IconPause, IconPencil, IconPlay, IconTrash } from "@/components/icons";

const action =
  "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-all active:scale-95";

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
        className={`${action} w-full text-text-faint hover:bg-surface-muted hover:text-text-muted disabled:opacity-50`}
      >
        <IconPlay className="h-4 w-4" />
        Restaurar
      </button>
    );
  }

  return (
    <div className="flex items-stretch divide-x divide-border text-text-faint">
      <Link href={`/habitos/${id}`} className={`${action} hover:bg-accent-soft hover:text-accent-strong`}>
        <IconChartBar className="h-4 w-4" />
        Progreso
      </Link>
      <Link href={`/habitos/${id}/editar`} className={`${action} hover:bg-surface-muted hover:text-text-muted`}>
        <IconPencil className="h-4 w-4" />
        Editar
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => (paused ? resumeHabitAction(id) : pauseHabitAction(id)))}
        className={`${action} hover:bg-surface-muted hover:text-text-muted disabled:opacity-50`}
      >
        {paused ? <IconPlay className="h-4 w-4" /> : <IconPause className="h-4 w-4" />}
        {paused ? "Reanudar" : "Pausar"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => archiveHabitAction(id))}
        className={`${action} text-danger hover:bg-danger/10 disabled:opacity-50`}
      >
        <IconTrash className="h-4 w-4" />
        Eliminar
      </button>
    </div>
  );
}
