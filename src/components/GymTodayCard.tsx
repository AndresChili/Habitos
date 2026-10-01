import Link from "next/link";
import { startWorkoutAction } from "@/app/gym-actions";
import { IconGym } from "@/components/icons";
import type { TodayGymStatus } from "@/lib/workouts";

export default function GymTodayCard({ status }: { status: TodayGymStatus }) {
  if (!status.scheduled) return null;

  if (!status.routine) {
    return (
      <Link
        href="/gimnasio"
        className="flex items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-3.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <IconGym className="h-5 w-5 shrink-0" />
        Hoy toca gimnasio — asigna una rutina a este día.
      </Link>
    );
  }

  if (status.sessionStatus === "COMPLETED") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm shadow-sm shadow-black/[0.03]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <IconGym className="h-4 w-4" />
        </span>
        <div>
          <p className="font-medium text-text">{status.routine.name}</p>
          <p className="text-xs text-accent-strong">Entrenamiento de hoy completado ✓</p>
        </div>
      </div>
    );
  }

  const inProgress = status.sessionStatus === "IN_PROGRESS";

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm shadow-black/[0.03]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <IconGym className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{status.routine.name}</p>
        <p className="text-xs text-text-faint">{inProgress ? "Entrenamiento en curso" : "Gimnasio pendiente hoy"}</p>
      </div>
      {inProgress && status.sessionId ? (
        <Link
          href={`/gimnasio/entrenar/${status.sessionId}`}
          className="shrink-0 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-accent-on shadow-sm shadow-black/10"
        >
          Continuar
        </Link>
      ) : (
        <form action={startWorkoutAction.bind(null, status.routine.id)}>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-accent-on shadow-sm shadow-black/10 active:scale-95"
          >
            Empezar
          </button>
        </form>
      )}
    </div>
  );
}
