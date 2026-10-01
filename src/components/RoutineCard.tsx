"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRoutineAction, duplicateRoutineAction, startWorkoutAction } from "@/app/gym-actions";
import { formatWeekdays } from "@/lib/gymLabels";

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`¿Eliminar "${name}"? Tus entrenamientos ya registrados no se verán afectados.`)) return;
    startTransition(() => deleteRoutineAction(id));
  }

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicateRoutineAction(id);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-2.5 rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <div>
        <p className="font-medium text-text">{name}</p>
        {description && <p className="mt-0.5 text-xs text-text-faint">{description}</p>}
        <p className="mt-0.5 text-xs text-text-faint">
          {exerciseCount} {exerciseCount === 1 ? "ejercicio" : "ejercicios"}
          {weekdays.length > 0 && ` · ${formatWeekdays(weekdays)}`}
        </p>
      </div>
      <div className="flex items-center gap-1 text-text-faint">
        <form action={startWorkoutAction.bind(null, id)} className="flex-1">
          <button
            type="submit"
            className="w-full rounded-lg bg-accent-soft px-2 py-1.5 text-xs font-semibold text-accent-strong transition-all active:scale-95"
          >
            Entrenar
          </button>
        </form>
        <Link
          href={`/gimnasio/rutinas/${id}`}
          className="rounded-lg px-2 py-1.5 text-xs font-medium transition-all hover:bg-surface-muted hover:text-text-muted active:scale-95"
        >
          Editar
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={handleDuplicate}
          className="rounded-lg px-2 py-1.5 text-xs font-medium transition-all hover:bg-surface-muted hover:text-text-muted active:scale-95 disabled:opacity-50"
        >
          Duplicar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleDelete}
          className="rounded-lg px-2 py-1.5 text-xs font-medium transition-all hover:bg-danger/10 hover:text-danger active:scale-95 disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
