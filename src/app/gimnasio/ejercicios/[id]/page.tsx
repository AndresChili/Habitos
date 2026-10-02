import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { notFound } from "next/navigation";
import { getExercise } from "@/lib/exercises";
import { computeExercisePRs, listExerciseHistory } from "@/lib/workouts";
import StatTile from "@/components/StatTile";
import HistoryEntry from "@/components/HistoryEntry";
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from "@/lib/gymLabels";

export const dynamic = "force-dynamic";

export default async function EjercicioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = await getExercise(id);
  if (!exercise) notFound();

  const [prs, history] = await Promise.all([computeExercisePRs(id), listExerciseHistory(id)]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/gimnasio/ejercicios"
          className="inline-flex items-center gap-1 text-xs font-medium text-text-faint transition-colors hover:text-text-muted"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ejercicios
        </Link>
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-text">{exercise.name}</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            {MUSCLE_LABELS[exercise.primaryMuscle]} · {EQUIPMENT_LABELS[exercise.equipment]}
          </p>
        </div>
      </header>

      {!prs || (!prs.bestWeight && !prs.bestReps) ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-faint">
          Todavía no hay sesiones registradas de este ejercicio.
        </p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <StatTile
              accent="violet"
              label="Peso máximo"
              value={prs.bestWeight ? `${prs.bestWeight.weightKg}kg` : "—"}
              hint={prs.bestWeight ? `× ${prs.bestWeight.reps} reps` : undefined}
            />
            <StatTile
              accent="violet"
              label="Más repeticiones"
              value={prs.bestReps ? `${prs.bestReps.reps}` : "—"}
              hint={prs.bestReps ? `a ${prs.bestReps.weightKg}kg` : undefined}
            />
            <StatTile
              accent="violet"
              label="Mejor volumen"
              value={prs.bestVolume ? `${Math.round(prs.bestVolume.volume)}kg` : "—"}
              hint="en una sesión"
            />
            <StatTile
              accent="violet"
              label="e1RM estimado"
              value={prs.bestEstimatedOneRm ? `${Math.round(prs.bestEstimatedOneRm.value)}kg` : "—"}
              hint={prs.bestEstimatedOneRm ? `desde ${prs.bestEstimatedOneRm.weightKg}kg × ${prs.bestEstimatedOneRm.reps}` : undefined}
            />
          </section>

          <section className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Historial</h2>
            <div className="space-y-2">
              {history.map((entry) => (
                <HistoryEntry
                  key={entry.id}
                  id={entry.id}
                  exerciseId={id}
                  dateLabel={format(entry.workoutSession.startedAt, "EEEE, d MMM", { locale: es })}
                  sets={entry.sets}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
