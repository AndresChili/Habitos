"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteSessionAction, startFreeformWorkoutAction, startWorkoutAction } from "@/app/gym-actions";
import { IconGym, IconTrash } from "@/components/icons";
import type { TodayGymStatus } from "@/lib/workouts";

export default function GymTodayCard({
  status,
  otherRoutines,
}: {
  status: TodayGymStatus;
  otherRoutines: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [choosingOther, setChoosingOther] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!status.scheduled) return null;

  function handleDeleteSession(id: string) {
    if (!window.confirm("¿Eliminar este entrenamiento? No se puede deshacer.")) return;
    startTransition(async () => {
      await deleteSessionAction(id);
      router.refresh();
    });
  }

  // Already started (or finished) today — whatever routine (or none) it's
  // actually running, regardless of what's permanently assigned to today.
  if (status.session) {
    if (status.session.status === "COMPLETED") {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm shadow-card">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-violet-2 text-violet-on shadow-glow-violet">
            <IconGym className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-text">{status.session.routineName}</p>
            <p className="text-xs text-violet-strong">Entrenamiento de hoy completado ✓</p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => handleDeleteSession(status.session!.id)}
            className="shrink-0 rounded-lg p-2 text-text-faint transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
            aria-label="Eliminar entrenamiento"
          >
            <IconTrash className="h-4 w-4" />
          </button>
          <Link
            href={`/gimnasio/entrenar/${status.session.id}`}
            className="shrink-0 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-text-muted"
          >
            Ver
          </Link>
        </div>
      );
    }
    const { exercisesTotal, exercisesDone } = status.session;
    const pct = exercisesTotal > 0 ? Math.round((exercisesDone / exercisesTotal) * 100) : 0;
    return (
      <div className="rounded-2xl border border-violet/25 bg-gradient-to-br from-violet-soft to-surface px-4 py-3.5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-violet-2 text-violet-on shadow-glow-violet">
            <IconGym className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text">{status.session.routineName}</p>
            {exercisesTotal > 0 ? (
              <p className="text-xs font-semibold text-violet-strong">
                {exercisesDone} de {exercisesTotal} ejercicios hechos
              </p>
            ) : (
              <p className="text-xs text-text-faint">Entrenamiento en curso</p>
            )}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => handleDeleteSession(status.session!.id)}
            className="shrink-0 rounded-lg p-2 text-text-faint transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
            aria-label="Eliminar entrenamiento"
          >
            <IconTrash className="h-4 w-4" />
          </button>
          <Link
            href={`/gimnasio/entrenar/${status.session.id}`}
            className="shrink-0 rounded-xl bg-gradient-to-br from-violet to-violet-2 px-3.5 py-2 text-xs font-semibold text-violet-on shadow-glow-violet"
          >
            Continuar
          </Link>
        </div>
        {exercisesTotal > 0 && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-violet-soft">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet to-violet-2 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // Nothing started yet today.
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left shadow-card transition-colors hover:border-violet"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-violet-2 text-violet-on shadow-glow-violet">
          <IconGym className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">
            {status.assignedRoutine ? status.assignedRoutine.name : "Hoy toca gimnasio"}
          </p>
          <p className="text-xs text-text-faint">Pendiente hoy</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-text-faint">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-violet-2 text-violet-on shadow-glow-violet">
          <IconGym className="h-4 w-4" />
        </span>
        <p className="text-sm font-medium text-text">Gimnasio hoy</p>
      </div>

      {!choosingOther ? (
        <div className="space-y-2">
          {status.assignedRoutine && (
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => startWorkoutAction(status.assignedRoutine!.id))}
              className="w-full rounded-xl bg-gradient-to-br from-violet to-violet-2 py-2.5 text-sm font-semibold text-violet-on shadow-glow-violet transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Empezar {status.assignedRoutine.name}
            </button>
          )}
          <button
            type="button"
            onClick={() => setChoosingOther(true)}
            className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-text-muted transition-all active:scale-[0.98]"
          >
            Cambiar rutina (solo hoy)
          </button>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="w-full py-1 text-xs text-text-faint"
          >
            Cerrar
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text-faint">
            Esto solo afecta al entrenamiento de hoy — la rutina asignada a este día no cambia.
          </p>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {otherRoutines.length === 0 ? (
              <p className="px-1 py-1.5 text-xs text-text-faint">No tienes otras rutinas creadas.</p>
            ) : (
              otherRoutines.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => startWorkoutAction(r.id))}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-text transition-colors hover:bg-surface-muted disabled:opacity-50"
                >
                  {r.name}
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => startFreeformWorkoutAction())}
            className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-text-muted transition-all active:scale-[0.98] hover:border-violet hover:text-violet disabled:opacity-50"
          >
            Sin rutina — crear ejercicios manualmente
          </button>
          <button
            type="button"
            onClick={() => setChoosingOther(false)}
            className="w-full py-1 text-xs text-text-faint"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
}
