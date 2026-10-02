"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteRoutineAction, startWorkoutAction } from "@/app/gym-actions";
import { formatWeekdays } from "@/lib/gymLabels";
import { IconGym } from "@/components/icons";

export default function RoutineCard({
  id,
  name,
  description,
  exerciseCount,
  weekdays,
}: {
  id: string;
  name: string;
  description: string | null;
  exerciseCount: number;
  weekdays: number[];
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`¿Eliminar "${name}"? Tus entrenamientos ya registrados no se verán afectados.`)) return;
    startTransition(() => deleteRoutineAction(id));
  }

  return (
    <div className="space-y-3.5 rounded-2xl border border-border bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-violet-2 text-violet-on shadow-glow-violet">
          <IconGym className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text">{name}</p>
          {description && <p className="mt-0.5 truncate text-xs text-text-faint">{description}</p>}
          <p className="mt-0.5 text-xs font-medium text-text-faint">
            {exerciseCount} {exerciseCount === 1 ? "ejercicio" : "ejercicios"}
            {weekdays.length > 0 && ` · ${formatWeekdays(weekdays)}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <form action={startWorkoutAction.bind(null, id)} className="flex-1">
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-br from-violet to-violet-2 py-1.5 text-xs font-semibold text-violet-on shadow-glow-violet transition-all active:scale-95"
          >
            Entrenar
          </button>
        </form>
        <Link
          href={`/gimnasio/rutinas/${id}`}
          className="flex-1 rounded-lg border border-border py-1.5 text-center text-xs font-semibold text-text-muted transition-all hover:border-violet hover:text-violet active:scale-95"
        >
          Ver
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={handleDelete}
          className="flex-1 rounded-lg bg-danger/10 py-1.5 text-xs font-semibold text-danger transition-all active:scale-95 disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
